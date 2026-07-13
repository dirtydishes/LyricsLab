// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import {
  BRIDGE_MESSAGE_VERSION,
  BROWSER_BRIDGE_EVENT,
  installLyricsEditorCommands,
  postBridgeMessage,
  toEditorErrorMessage,
  type LyricsBridgeEnvelope,
  type LyricsEditorCommands,
  type ReactNativeWebViewBridge,
} from './bridge';

type CapturedBridgeEvent = Event & {
  detail: LyricsBridgeEnvelope;
};

type BridgeTestWindow = Window & {
  CustomEvent: typeof CustomEvent;
  LyricsLabEditor?: LyricsEditorCommands;
  ReactNativeWebView?: ReactNativeWebViewBridge;
};

const FakeCustomEvent = class<T = unknown> {
  readonly type: string;
  readonly detail: T;

  constructor(type: string, init: CustomEventInit<T> = {}) {
    this.type = type;
    this.detail = init.detail as T;
  }
} as typeof CustomEvent;

function createFakeWindow(options: { nativeBridge?: boolean } = {}) {
  const events: CapturedBridgeEvent[] = [];
  const postMessage = vi.fn<(message: string) => void>();
  const dispatchEvent = vi.fn((event: Event) => {
    events.push(event as CapturedBridgeEvent);
    return true;
  });
  const targetWindow = {
    CustomEvent: FakeCustomEvent,
    dispatchEvent,
  } as unknown as BridgeTestWindow;

  if (options.nativeBridge !== false) {
    targetWindow.ReactNativeWebView = { postMessage };
  }

  return {
    dispatchEvent,
    events,
    postMessage,
    targetWindow,
  };
}

describe('postBridgeMessage', () => {
  it('returns a versioned bridge envelope', () => {
    const { targetWindow } = createFakeWindow();

    const envelope = postBridgeMessage(
      {
        type: 'contentChanged',
        bodyJson: { type: 'doc', content: [{ type: 'paragraph' }] },
        bodyText: 'cold room full of flow',
      },
      targetWindow,
    );

    expect(envelope).toEqual({
      version: BRIDGE_MESSAGE_VERSION,
      type: 'contentChanged',
      bodyJson: { type: 'doc', content: [{ type: 'paragraph' }] },
      bodyText: 'cold room full of flow',
    });
  });

  it('serializes the envelope through ReactNativeWebView.postMessage', () => {
    const { postMessage, targetWindow } = createFakeWindow();

    const envelope = postBridgeMessage(
      {
        type: 'selectionChanged',
        context: {
          currentLineText: 'mirror line',
          previousToken: 'mirror',
          selectionEmpty: true,
          wordBeforeCursor: 'line',
        },
      },
      targetWindow,
    );

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(JSON.stringify(envelope));
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual(envelope);
  });

  it('dispatches a CustomEvent with the envelope as detail', () => {
    const { dispatchEvent, events, targetWindow } = createFakeWindow();

    const envelope = postBridgeMessage(
      {
        type: 'editorFocused',
        context: {
          currentLineText: 'late night',
          previousToken: 'late',
          selectionEmpty: false,
          wordBeforeCursor: 'night',
        },
      },
      targetWindow,
    );

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(BROWSER_BRIDGE_EVENT);
    expect(events[0].detail).toBe(envelope);
  });

  it('still dispatches browser events without ReactNativeWebView', () => {
    const { events, postMessage, targetWindow } = createFakeWindow({
      nativeBridge: false,
    });

    const envelope = postBridgeMessage(
      {
        type: 'editorReady',
        bodyJson: { type: 'doc' },
        bodyText: '',
      },
      targetWindow,
    );

    expect(postMessage).not.toHaveBeenCalled();
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual(envelope);
  });
});

describe('installLyricsEditorCommands', () => {
  it('installs the editor command surface on the target window', () => {
    const { targetWindow } = createFakeWindow();
    const commands: LyricsEditorCommands = {
      focusEditor: vi.fn(() => true),
      insertSuggestion: vi.fn(() => true),
      loadSong: vi.fn(() => true),
      setTheme: vi.fn(() => true),
    };

    installLyricsEditorCommands(commands, targetWindow);

    expect(targetWindow.LyricsLabEditor).toBe(commands);
    expect(targetWindow.LyricsLabEditor?.insertSuggestion({ word: 'flow' })).toBe(
      true,
    );
    expect(commands.insertSuggestion).toHaveBeenCalledWith({ word: 'flow' });
  });
});

describe('toEditorErrorMessage', () => {
  it('converts Error instances into editor error bridge messages', () => {
    const error = new Error('bridge failed');

    expect(toEditorErrorMessage(error, 'bridge_failed')).toEqual({
      type: 'editorError',
      code: 'bridge_failed',
      message: 'bridge failed',
      stack: error.stack,
    });
  });

  it('stringifies non-Error thrown values with the default code', () => {
    expect(toEditorErrorMessage('plain failure')).toEqual({
      type: 'editorError',
      code: 'editor_error',
      message: 'plain failure',
    });
  });
});
