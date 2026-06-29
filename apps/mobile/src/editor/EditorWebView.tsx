import {
  forwardRef,
  useCallback,
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
  createFocusEditorJavaScript,
  createInsertSuggestionJavaScript,
  createLoadSongJavaScript,
  DEFAULT_EDITOR_WEB_PORT,
  editorWebUrlFromExpoHost,
  normalizeEditorWebUrl,
  parseEditorBridgeMessage,
  type EditorBodySnapshot,
  type EditorErrorMessage,
  type SuggestionContext,
} from './bridge';

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
    },
    ref,
  ) {
    const webViewRef = useRef<WebView>(null);
    const latestBodySnapshotRef = useRef<EditorBodySnapshot>({
      bodyJson,
      bodyText,
    });

    latestBodySnapshotRef.current = {
      bodyJson,
      bodyText,
    };

    const resolvedEditorUrl = useMemo(() => {
      return normalizeEditorWebUrl(
        editorUrl ??
          getConfiguredEditorUrl() ??
          editorWebUrlFromExpoHost(Constants.expoConfig?.hostUri) ??
          `http://127.0.0.1:${DEFAULT_EDITOR_WEB_PORT}/`,
      );
    }, [editorUrl]);

    const sendCurrentBody = useCallback(() => {
      webViewRef.current?.injectJavaScript(
        createLoadSongJavaScript(latestBodySnapshotRef.current),
      );
    }, []);

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
      ],
    );

    return (
      <View style={[styles.container, style]}>
        <WebView
          allowsInlineMediaPlayback
          domStorageEnabled
          javaScriptEnabled
          keyboardDisplayRequiresUserAction={false}
          onMessage={handleMessage}
          originWhitelist={['http://*', 'https://*']}
          ref={webViewRef}
          renderError={() => (
            <View style={styles.centerState}>
              <Text style={styles.errorText}>Editor failed to load</Text>
            </View>
          )}
          source={{ uri: resolvedEditorUrl }}
          style={styles.webView}
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
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderColor: '#d6dae1',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  errorText: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '700',
  },
  webView: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
});
