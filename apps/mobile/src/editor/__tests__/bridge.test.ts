/// <reference types="jest" />

import {
  BRIDGE_MESSAGE_VERSION,
  createLoadSongJavaScript,
  editorWebUrlFromExpoHost,
  normalizeEditorWebUrl,
  parseEditorBridgeMessage,
} from '../bridge';

describe('editor native bridge', () => {
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
        context: {
          currentLineText: 'writing late night',
          previousToken: 'late',
          selectionEmpty: true,
          wordBeforeCursor: 'night',
        },
      }),
    );

    expect(result).toEqual({
      ok: true,
      message: {
        type: 'selectionChanged',
        context: {
          currentLineText: 'writing late night',
          previousToken: 'late',
          selectionEmpty: true,
          wordBeforeCursor: 'night',
        },
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

  it('resolves editor dev URLs from Expo host metadata', () => {
    expect(editorWebUrlFromExpoHost('192.168.1.20:8081')).toBe(
      'http://192.168.1.20:5174/',
    );
    expect(editorWebUrlFromExpoHost(undefined)).toBeNull();
    expect(normalizeEditorWebUrl('http://127.0.0.1:5174')).toBe(
      'http://127.0.0.1:5174/',
    );
  });
});
