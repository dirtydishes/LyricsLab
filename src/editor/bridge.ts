export const BRIDGE_MESSAGE_VERSION = 1;
export const DEFAULT_EDITOR_WEB_PORT = 5174;
export const LOCAL_EDITOR_WEBVIEW_BASE_URL = 'https://lyricslab.local/';

export type EditorBodySnapshot = {
  bodyJson: unknown | null;
  bodyText: string;
};

export type InsertSuggestionCommand = {
  word: string;
};

export type EditorTheme = 'dark' | 'light';

export type SuggestionContext = {
  currentLineText: string;
  previousToken: string;
  selectionEmpty: boolean;
  wordBeforeCursor: string;
};

export type EditorReadyMessage = EditorBodySnapshot & {
  type: 'editorReady';
};

export type ContentChangedMessage = EditorBodySnapshot & {
  type: 'contentChanged';
};

export type SelectionChangedMessage = {
  context: SuggestionContext;
  type: 'selectionChanged';
};

export type EditorFocusedMessage = {
  context: SuggestionContext;
  type: 'editorFocused';
};

export type EditorBlurredMessage = {
  context: SuggestionContext;
  type: 'editorBlurred';
};

export type EditorErrorMessage = {
  code: string;
  message: string;
  stack?: string;
  type: 'editorError';
};

export type EditorBridgeMessage =
  | EditorReadyMessage
  | ContentChangedMessage
  | SelectionChangedMessage
  | EditorFocusedMessage
  | EditorBlurredMessage
  | EditorErrorMessage;

export type BridgeParseResult =
  | {
      message: EditorBridgeMessage;
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };

export type EditorWebViewSource =
  | {
      baseUrl: typeof LOCAL_EDITOR_WEBVIEW_BASE_URL;
      html: string;
    }
  | {
      uri: string;
    };

export function parseEditorBridgeMessage(rawMessage: string): BridgeParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawMessage);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }

  return parseBridgeEnvelope(parsed);
}

export function createLoadSongJavaScript(snapshot: EditorBodySnapshot) {
  return createEditorCommandJavaScript('loadSong', {
    bodyJson: snapshot.bodyJson,
    bodyText: snapshot.bodyText,
  });
}

export function createInsertSuggestionJavaScript(word: string) {
  return createEditorCommandJavaScript('insertSuggestion', { word });
}

export function createSetThemeJavaScript(theme: EditorTheme) {
  return createEditorCommandJavaScript('setTheme', { theme });
}

export function createFocusEditorJavaScript() {
  return createEditorCommandJavaScript('focusEditor', undefined);
}

export function normalizeEditorWebUrl(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    return `http://127.0.0.1:${DEFAULT_EDITOR_WEB_PORT}/`;
  }

  return trimmedUrl.endsWith('/') ? trimmedUrl : `${trimmedUrl}/`;
}

export function editorWebUrlFromExpoHost(hostUri: string | null | undefined) {
  const host = hostUri?.split(':')[0]?.trim();

  if (!host) {
    return null;
  }

  return `http://${host}:${DEFAULT_EDITOR_WEB_PORT}/`;
}

export function createEditorWebViewSource(
  editorHtml: string,
  configuredEditorUrl?: string | null,
): EditorWebViewSource {
  if (configuredEditorUrl?.trim()) {
    return {
      uri: normalizeEditorWebUrl(configuredEditorUrl),
    };
  }

  return {
    baseUrl: LOCAL_EDITOR_WEBVIEW_BASE_URL,
    html: editorHtml,
  };
}

function parseBridgeEnvelope(value: unknown): BridgeParseResult {
  if (!isRecord(value)) {
    return { ok: false, reason: 'message-not-object' };
  }

  if (value.version !== BRIDGE_MESSAGE_VERSION) {
    return { ok: false, reason: 'unsupported-version' };
  }

  switch (value.type) {
    case 'contentChanged':
    case 'editorReady':
      return parseBodySnapshotMessage(value);
    case 'selectionChanged':
    case 'editorFocused':
    case 'editorBlurred':
      return parseSelectionContextMessage(value);
    case 'editorError':
      return parseEditorErrorMessage(value);
    default:
      return { ok: false, reason: 'unknown-message-type' };
  }
}

function parseBodySnapshotMessage(
  value: Record<string, unknown>,
): BridgeParseResult {
  if (!isBodyJson(value.bodyJson)) {
    return { ok: false, reason: 'invalid-body-json' };
  }

  if (typeof value.bodyText !== 'string') {
    return { ok: false, reason: 'invalid-body-text' };
  }

  return {
    message: {
      bodyJson: value.bodyJson,
      bodyText: value.bodyText,
      type: value.type as
        | EditorReadyMessage['type']
        | ContentChangedMessage['type'],
    },
    ok: true,
  };
}

function parseSelectionContextMessage(
  value: Record<string, unknown>,
): BridgeParseResult {
  const context = parseSuggestionContext(value.context);

  if (!context) {
    return { ok: false, reason: 'invalid-selection-context' };
  }

  return {
    message: {
      context,
      type: value.type as
        | SelectionChangedMessage['type']
        | EditorFocusedMessage['type']
        | EditorBlurredMessage['type'],
    },
    ok: true,
  };
}

function parseEditorErrorMessage(
  value: Record<string, unknown>,
): BridgeParseResult {
  if (typeof value.code !== 'string' || typeof value.message !== 'string') {
    return { ok: false, reason: 'invalid-editor-error' };
  }

  if (
    Object.prototype.hasOwnProperty.call(value, 'stack') &&
    typeof value.stack !== 'string'
  ) {
    return { ok: false, reason: 'invalid-editor-error-stack' };
  }

  const stack = typeof value.stack === 'string' ? value.stack : undefined;

  return {
    message: {
      code: value.code,
      message: value.message,
      stack,
      type: 'editorError',
    },
    ok: true,
  };
}

function parseSuggestionContext(value: unknown): SuggestionContext | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.currentLineText !== 'string' ||
    typeof value.previousToken !== 'string' ||
    typeof value.selectionEmpty !== 'boolean' ||
    typeof value.wordBeforeCursor !== 'string'
  ) {
    return null;
  }

  return {
    currentLineText: value.currentLineText,
    previousToken: value.previousToken,
    selectionEmpty: value.selectionEmpty,
    wordBeforeCursor: value.wordBeforeCursor,
  };
}

function createEditorCommandJavaScript(commandName: string, payload: unknown) {
  const serializedPayload = JSON.stringify(payload);
  const serializedCommandName = JSON.stringify(commandName);

  return `
    (function () {
      var editor = window.LyricsLabEditor;
      var commandName = ${serializedCommandName};
      var command = editor && editor[commandName];

      if (typeof command !== 'function') {
        return false;
      }

      command(${serializedPayload});
      return true;
    })();
    true;
  `;
}

function isBodyJson(value: unknown) {
  return value === null || isRecord(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
