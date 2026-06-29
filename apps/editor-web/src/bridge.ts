import type { JSONContent } from '@tiptap/core';

import type { SuggestionContext } from './suggestionContext';

export const BRIDGE_MESSAGE_VERSION = 1;
export const BROWSER_BRIDGE_EVENT = 'lyricslab:bridge-message';

export type EditorReadyMessage = {
  type: 'editorReady';
  bodyJson: JSONContent;
  bodyText: string;
};

export type ContentChangedMessage = {
  type: 'contentChanged';
  bodyJson: JSONContent;
  bodyText: string;
};

export type SelectionChangedMessage = {
  type: 'selectionChanged';
  context: SuggestionContext;
};

export type EditorFocusedMessage = {
  type: 'editorFocused';
  context: SuggestionContext;
};

export type EditorBlurredMessage = {
  type: 'editorBlurred';
  context: SuggestionContext;
};

export type EditorErrorMessage = {
  type: 'editorError';
  code: string;
  message: string;
  stack?: string;
};

export type LyricsBridgeMessage =
  | EditorReadyMessage
  | ContentChangedMessage
  | SelectionChangedMessage
  | EditorFocusedMessage
  | EditorBlurredMessage
  | EditorErrorMessage;

export type LyricsBridgeEnvelope = LyricsBridgeMessage & {
  version: typeof BRIDGE_MESSAGE_VERSION;
};

export type LoadSongCommand = {
  bodyJson?: JSONContent | null;
  bodyText?: string;
};

export type InsertSuggestionCommand =
  | string
  | {
      word: string;
    };

export type SetThemeCommand = {
  theme?: 'light' | 'dark' | string;
};

export type LyricsEditorCommands = {
  focusEditor(): boolean;
  insertSuggestion(command: InsertSuggestionCommand): boolean;
  loadSong(command?: LoadSongCommand): boolean;
  setTheme(command?: SetThemeCommand): boolean;
};

export type ReactNativeWebViewBridge = {
  postMessage(message: string): void;
};

declare global {
  interface Window {
    LyricsLabEditor?: LyricsEditorCommands;
    ReactNativeWebView?: ReactNativeWebViewBridge;
  }
}

export function postBridgeMessage(
  message: LyricsBridgeMessage,
  targetWindow: Window = window,
) {
  const envelope: LyricsBridgeEnvelope = {
    version: BRIDGE_MESSAGE_VERSION,
    ...message,
  };
  const serialized = JSON.stringify(envelope);

  targetWindow.ReactNativeWebView?.postMessage(serialized);
  const EventConstructor =
    (targetWindow as Window & { CustomEvent?: typeof CustomEvent }).CustomEvent ??
    CustomEvent;

  targetWindow.dispatchEvent(
    new EventConstructor<LyricsBridgeEnvelope>(BROWSER_BRIDGE_EVENT, {
      detail: envelope,
    }),
  );

  return envelope;
}

export function installLyricsEditorCommands(
  commands: LyricsEditorCommands,
  targetWindow: Window = window,
) {
  targetWindow.LyricsLabEditor = commands;
}

export function toEditorErrorMessage(
  error: unknown,
  code = 'editor_error',
): EditorErrorMessage {
  if (error instanceof Error) {
    return {
      type: 'editorError',
      code,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    type: 'editorError',
    code,
    message: String(error),
  };
}
