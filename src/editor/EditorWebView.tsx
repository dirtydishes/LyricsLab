import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import Constants from 'expo-constants';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import {
  createEditorWebViewSource,
  createEditorThemeBootstrapJavaScript,
  createFocusEditorJavaScript,
  createInsertSuggestionJavaScript,
  createLoadSongJavaScript,
  createSetThemeJavaScript,
  parseEditorBridgeMessage,
  type EditorBodySnapshot,
  type EditorErrorMessage,
  type EditorTheme,
  type SuggestionContext,
} from './bridge';
import { editorHtml } from './generated/editorHtml';
import { getThemeTokens } from '../theme/theme';

declare const process:
  | {
      env?: {
        EXPO_PUBLIC_EDITOR_WEB_URL?: string;
      };
    }
  | undefined;

export type EditorWebViewHandle = {
  focusEditor: () => void;
  insertSuggestion: (word: string) => void;
};

type EditorWebViewProps = EditorBodySnapshot & {
  editorUrl?: string;
  onContentChanged: (snapshot: EditorBodySnapshot) => void;
  onEditorBlurred?: (context: SuggestionContext) => void;
  onEditorError?: (message: EditorErrorMessage) => void;
  onEditorFocused?: (context: SuggestionContext) => void;
  onSelectionChanged?: (context: SuggestionContext) => void;
  style?: StyleProp<ViewStyle>;
  theme: EditorTheme;
};

export const EditorWebView = forwardRef<EditorWebViewHandle, EditorWebViewProps>(
  function EditorWebView(
    {
      bodyJson,
      bodyText,
      editorUrl,
      onContentChanged,
      onEditorBlurred,
      onEditorError,
      onEditorFocused,
      onSelectionChanged,
      style,
      theme,
    },
    ref,
  ) {
    const tokens = getThemeTokens(theme);
    const webViewRef = useRef<WebView>(null);
    const latestBodySnapshotRef = useRef<EditorBodySnapshot>({
      bodyJson,
      bodyText,
    });

    latestBodySnapshotRef.current = {
      bodyJson,
      bodyText,
    };

    const editorSource = useMemo(() => {
      return createEditorWebViewSource(
        editorHtml,
        editorUrl ?? getConfiguredEditorUrl(),
      );
    }, [editorUrl]);

    const sendCurrentBody = useCallback(() => {
      webViewRef.current?.injectJavaScript(
        createLoadSongJavaScript(latestBodySnapshotRef.current),
      );
    }, []);

    const sendCurrentTheme = useCallback(() => {
      webViewRef.current?.injectJavaScript(createSetThemeJavaScript(theme));
    }, [theme]);

    useEffect(() => {
      sendCurrentTheme();
    }, [sendCurrentTheme]);

    useImperativeHandle(
      ref,
      () => ({
        focusEditor() {
          webViewRef.current?.injectJavaScript(createFocusEditorJavaScript());
        },
        insertSuggestion(word: string) {
          webViewRef.current?.injectJavaScript(
            createInsertSuggestionJavaScript(word),
          );
        },
      }),
      [],
    );

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        const result = parseEditorBridgeMessage(event.nativeEvent.data);

        if (!result.ok) {
          console.warn(`Ignored editor bridge message: ${result.reason}`);
          return;
        }

        switch (result.message.type) {
          case 'editorReady':
            sendCurrentBody();
            sendCurrentTheme();
            break;
          case 'contentChanged':
            onContentChanged({
              bodyJson: result.message.bodyJson,
              bodyText: result.message.bodyText,
            });
            break;
          case 'selectionChanged':
            onSelectionChanged?.(result.message.context);
            break;
          case 'editorFocused':
            onSelectionChanged?.(result.message.context);
            onEditorFocused?.(result.message.context);
            break;
          case 'editorBlurred':
            onSelectionChanged?.(result.message.context);
            onEditorBlurred?.(result.message.context);
            break;
          case 'editorError':
            onEditorError?.(result.message);
            break;
        }
      },
      [
        onContentChanged,
        onEditorBlurred,
        onEditorError,
        onEditorFocused,
        onSelectionChanged,
        sendCurrentBody,
        sendCurrentTheme,
      ],
    );

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: tokens.editorBackground,
            borderColor: tokens.border,
          },
          style,
        ]}
      >
        <WebView
          allowsInlineMediaPlayback
          domStorageEnabled
          javaScriptEnabled
          injectedJavaScriptBeforeContentLoaded={createEditorThemeBootstrapJavaScript(
            theme,
          )}
          keyboardDisplayRequiresUserAction={false}
          onMessage={handleMessage}
          originWhitelist={['http://*', 'https://*']}
          ref={webViewRef}
          renderError={() => (
            <View
              style={[
                styles.centerState,
                {
                  backgroundColor: tokens.editorBackground,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: tokens.danger }]}>
                Editor failed to load
              </Text>
            </View>
          )}
          source={editorSource}
          style={[
            styles.webView,
            {
              backgroundColor: tokens.editorBackground,
            },
          ]}
        />
      </View>
    );
  },
);

function getConfiguredEditorUrl() {
  const extraEditorUrl = Constants.expoConfig?.extra?.editorWebUrl;

  if (typeof extraEditorUrl === 'string') {
    return extraEditorUrl;
  }

  if (typeof process !== 'undefined') {
    return process.env?.EXPO_PUBLIC_EDITOR_WEB_URL;
  }

  return undefined;
}

const styles = StyleSheet.create({
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
  },
  webView: {
    flex: 1,
  },
});
