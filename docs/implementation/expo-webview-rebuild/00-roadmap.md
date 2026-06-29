# LyricsLab Expo WebView Rebuild Foundation Roadmap

Canonical tracker: Beads epic `lyricslab-jd5`

## Plan Source

- Original implementation plan: `docs/plans/2026-06-28-expo-webview-prototype-rebuild.md`
- Generated dirtyloop docs: `docs/implementation/expo-webview-rebuild/`

## Outcome

Build the first Expo/WebView rebuild slice and decide, with device evidence, whether this becomes the new main LyricsLab implementation lane.

## Phase Sequence

1. `lyricslab-jd5.1` - Expo workspace foundation (`docs/implementation/expo-webview-rebuild/01-expo-workspace-foundation.md`)
2. `lyricslab-jd5.2` - Song persistence and app shell (`docs/implementation/expo-webview-rebuild/02-song-persistence-app-shell.md`)
3. `lyricslab-jd5.3` - Tiptap editor web bundle (`docs/implementation/expo-webview-rebuild/03-tiptap-editor-web-bundle.md`)
4. `lyricslab-jd5.4` - WebView bridge and body persistence (`docs/implementation/expo-webview-rebuild/04-webview-bridge-body-persistence.md`)
5. `lyricslab-jd5.5` - Keyboard suggestion bar and insertion (`docs/implementation/expo-webview-rebuild/05-keyboard-suggestions-insertion.md`)
6. `lyricslab-jd5.6` - Offline bundle and viability gate (`docs/implementation/expo-webview-rebuild/06-offline-bundle-viability-gate.md`)

## Dependencies

The phases are intentionally single-threaded and sequential:

- Phase 1 creates the mobile workspace and scripts.
- Phase 2 builds app data/navigation shell.
- Phase 3 creates the web editor package.
- Phase 4 bridges web editor content into the native app.
- Phase 5 adds the keyboard suggestion interaction.
- Phase 6 bundles offline and records viability evidence.

## Risks

- WebView editor may still have keyboard/focus/cursor edge cases on real iPhone.
- Tiptap/ProseMirror bundle integration may need build tooling adjustments.
- Expo Go compatibility may differ from a dev build for keyboard/WebView behavior.
- SQLite tests may need an adapter/fake rather than direct native SQLite in Node tests.
- Codex may try to port rhyme highlighting too early; this is explicitly out of scope.

## Quality Gates

- Keep the Swift app intact.
- No rhyme highlighting, iCloud, StoreKit/IAP, AI, audio, or theme parity in this stream.
- Typecheck/test/build gates as available per phase.
- Final phase records real device or documented-environment manual evidence.

## Closeout

The final closeout artifact is:

`docs/implementation/expo-webview-rebuild/storyboard-post-run-mm-dd-yyyy.html`
