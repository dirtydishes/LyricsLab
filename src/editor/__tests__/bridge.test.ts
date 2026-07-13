/// <reference types="jest" />

import {
  BRIDGE_MESSAGE_VERSION,
  LOCAL_EDITOR_WEBVIEW_BASE_URL,
  createEditorWebViewSource,
  createEditorThemeBootstrapJavaScript,
  createFocusEditorJavaScript,
  createInsertSuggestionJavaScript,
  createLoadSongJavaScript,
  createSetThemeJavaScript,
  editorWebUrlFromExpoHost,
  normalizeEditorWebUrl,
  parseEditorBridgeMessage,
} from '../bridge';

describe('editor native bridge', () => {
  const selectionContext = {
    currentLineText: 'writing late night',
    previousToken: 'late',
    selectionEmpty: true,
    wordBeforeCursor: 'night',
  };

  it.each([
    [
      'editorReady',
      {
        bodyJson: { type: 'doc', content: [] },
        bodyText: 'ready body',
        type: 'editorReady',
      },
    ],
    [
      'contentChanged',
      {
        bodyJson: { type: 'doc', content: [] },
        bodyText: 'first bar',
        type: 'contentChanged',
      },
    ],
    [
      'selectionChanged',
      {
        context: selectionContext,
        type: 'selectionChanged',
      },
    ],
    [
      'editorFocused',
      {
        context: selectionContext,
        type: 'editorFocused',
      },
    ],
    [
      'editorBlurred',
      {
        context: selectionContext,
        type: 'editorBlurred',
      },
    ],
    [
      'editorError',
      {
        code: 'editor-runtime-error',
        message: 'Editor command failed',
        stack: 'Error: Editor command failed',
        type: 'editorError',
      },
    ],
  ])('accepts %s messages from the WebView', (_type, message) => {
    expect(
      parseEditorBridgeMessage(
        JSON.stringify({
          version: BRIDGE_MESSAGE_VERSION,
          ...message,
        }),
      ),
    ).toEqual({
      ok: true,
      message,
    });
  });

  it('parses contentChanged snapshots from the WebView', () => {
    const result = parseEditorBridgeMessage(
      JSON.stringify({
        version: BRIDGE_MESSAGE_VERSION,
        type: 'contentChanged',
        bodyJson: { type: 'doc', content: [] },
        bodyText: 'first bar',
      }),
    );

    expect(result).toEqual({
      ok: true,
      message: {
        type: 'contentChanged',
        bodyJson: { type: 'doc', content: [] },
        bodyText: 'first bar',
      },
    });
  });

  it('parses selectionChanged context from the WebView', () => {
    const result = parseEditorBridgeMessage(
      JSON.stringify({
        version: BRIDGE_MESSAGE_VERSION,
        type: 'selectionChanged',
        context: selectionContext,
      }),
    );

    expect(result).toEqual({
      ok: true,
      message: {
        type: 'selectionChanged',
        context: selectionContext,
      },
    });
  });

  it('rejects malformed bridge messages without throwing', () => {
    expect(parseEditorBridgeMessage('not json')).toEqual({
      ok: false,
      reason: 'invalid-json',
    });
    expect(
      parseEditorBridgeMessage(
        JSON.stringify({
          version: 999,
          type: 'contentChanged',
          bodyJson: { type: 'doc' },
          bodyText: 'ignored',
        }),
      ),
    ).toEqual({ ok: false, reason: 'unsupported-version' });
    expect(
      parseEditorBridgeMessage(
        JSON.stringify({
          version: BRIDGE_MESSAGE_VERSION,
          type: 'contentChanged',
          bodyJson: [],
          bodyText: 'ignored',
        }),
      ),
    ).toEqual({ ok: false, reason: 'invalid-body-json' });
  });

  it.each([
    ['non-object envelope', null, 'message-not-object'],
    [
      'unsupported envelope version',
      {
        bodyJson: { type: 'doc' },
        bodyText: 'ignored',
        type: 'contentChanged',
        version: 999,
      },
      'unsupported-version',
    ],
    [
      'malformed selection context',
      {
        context: {
          ...selectionContext,
          selectionEmpty: 'yes',
        },
        type: 'selectionChanged',
        version: BRIDGE_MESSAGE_VERSION,
      },
      'invalid-selection-context',
    ],
    [
      'malformed editor error',
      {
        code: 'editor-runtime-error',
        message: 42,
        type: 'editorError',
        version: BRIDGE_MESSAGE_VERSION,
      },
      'invalid-editor-error',
    ],
    [
      'malformed editor error stack',
      {
        code: 'editor-runtime-error',
        message: 'Editor failed',
        stack: 42,
        type: 'editorError',
        version: BRIDGE_MESSAGE_VERSION,
      },
      'invalid-editor-error-stack',
    ],
    [
      'malformed bodyText',
      {
        bodyJson: { type: 'doc' },
        bodyText: null,
        type: 'contentChanged',
        version: BRIDGE_MESSAGE_VERSION,
      },
      'invalid-body-text',
    ],
    [
      'unknown message type',
      {
        type: 'songSaved',
        version: BRIDGE_MESSAGE_VERSION,
      },
      'unknown-message-type',
    ],
  ])('rejects %s', (_label, envelope, reason) => {
    expect(parseEditorBridgeMessage(JSON.stringify(envelope))).toEqual({
      ok: false,
      reason,
    });
  });

  it('creates executable loadSong JavaScript for the WebView command surface', () => {
    const calls: unknown[] = [];
    const script = createLoadSongJavaScript({
      bodyJson: { type: 'doc', content: [] },
      bodyText: 'persisted body',
    });

    Function('window', script)({
      LyricsLabEditor: {
        loadSong(command: unknown) {
          calls.push(command);
          return true;
        },
      },
    });

    expect(calls).toEqual([
      {
        bodyJson: { type: 'doc', content: [] },
        bodyText: 'persisted body',
      },
    ]);
  });

  it('creates executable insertSuggestion JavaScript for the WebView command surface', () => {
    const calls: unknown[] = [];
    const script = createInsertSuggestionJavaScript('midnight');

    Function('window', script)({
      LyricsLabEditor: {
        insertSuggestion(command: unknown) {
          calls.push(command);
          return true;
        },
      },
    });

    expect(calls).toEqual([{ word: 'midnight' }]);
  });

  it('propagates theme through the existing narrow editor command surface', () => {
    const calls: unknown[] = [];
    const script = createSetThemeJavaScript('dark');

    Function('window', script)({
      LyricsLabEditor: {
        setTheme(command: unknown) {
          calls.push(command);
          return true;
        },
      },
    });

    expect(calls).toEqual([{ theme: 'dark' }]);
  });

  it('sets the initial theme before the editor command surface is ready', () => {
    const documentObject = {
      documentElement: {
        dataset: {} as Record<string, string>,
      },
    };

    Function(
      'document',
      createEditorThemeBootstrapJavaScript('dark'),
    )(documentObject);

    expect(documentObject.documentElement.dataset.theme).toBe('dark');
  });

  it('creates executable focusEditor JavaScript with an undefined payload', () => {
    const calls: unknown[] = [];
    const script = createFocusEditorJavaScript();

    Function('window', script)({
      LyricsLabEditor: {
        focusEditor(command: unknown) {
          calls.push(command);
          return true;
        },
      },
    });

    expect(calls).toEqual([undefined]);
  });

  it('keeps generated command payloads escaped as data', () => {
    const calls: unknown[] = [];
    const script = createInsertSuggestionJavaScript(
      'midnight"; window.__bridgeEscaped = false; //',
    );
    const windowObject = {
      __bridgeEscaped: true,
      LyricsLabEditor: {
        insertSuggestion(command: unknown) {
          calls.push(command);
          return true;
        },
      },
    };

    Function('window', script)(windowObject);

    expect(windowObject.__bridgeEscaped).toBe(true);
    expect(calls).toEqual([
      {
        word: 'midnight"; window.__bridgeEscaped = false; //',
      },
    ]);
  });

  it('resolves editor dev URLs from Expo host metadata', () => {
    expect(editorWebUrlFromExpoHost('192.168.1.20:8081')).toBe(
      'http://192.168.1.20:5174/',
    );
    expect(editorWebUrlFromExpoHost(undefined)).toBeNull();
    expect(normalizeEditorWebUrl('http://127.0.0.1:5174')).toBe(
      'http://127.0.0.1:5174/',
    );
  });

  it('uses local editor HTML by default and remote URLs only when configured', () => {
    expect(createEditorWebViewSource('<html></html>')).toEqual({
      baseUrl: LOCAL_EDITOR_WEBVIEW_BASE_URL,
      html: '<html></html>',
    });
    expect(createEditorWebViewSource('<html></html>', '   ')).toEqual({
      baseUrl: LOCAL_EDITOR_WEBVIEW_BASE_URL,
      html: '<html></html>',
    });
    expect(
      createEditorWebViewSource('<html></html>', 'http://127.0.0.1:5174'),
    ).toEqual({
      uri: 'http://127.0.0.1:5174/',
    });
  });
});
