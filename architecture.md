# architecture.md - LyricsLab Expo Rebuild

## High Level

LyricsLab is now shaped as an Expo/React Native app with a WebView editor package:

- Expo Router owns native navigation and app startup.
- React Native screens own songs, title editing, search, persistence orchestration, and the keyboard suggestion bar.
- `react-native-webview` hosts the lyric body editor.
- `packages/editor-web` owns the Tiptap/ProseMirror editing surface.
- SQLite is the MVP local persistence layer through `expo-sqlite`.
- Canonical lyric body state is `bodyJson` plus `bodyText`; generated HTML is only a runtime bundle.

## Active Modules

- `app/`
  - Route files only.
  - Keep non-route application code out of this folder.
- `src/songs/`
  - `Song`, `SongRepository`, SQLite implementation, provider, list/search UI.
- `src/editor/`
  - Editor screen, WebView integration, native bridge helpers, suggestion bar, body persistence policy.
- `src/editor/generated/`
  - Generated offline editor HTML. Do not edit manually.
- `packages/editor-web/`
  - Vite/Tiptap package compiled into the WebView bundle.
- `data/`
  - Neutral data assets such as `cmudict.txt` for the offline rhyme engine.
- `scripts/`
  - Build-time glue, especially editor HTML generation.

## Editor Boundary

Native owns:
- Current song id and title.
- Song loading and saving.
- Keyboard-attached suggestion UI.
- Calls into the editor: load song, focus, insert suggestion.

WebView owns:
- Body text editing.
- Selection/cursor context.
- Tiptap JSON document shape.
- Bridge messages back to native.

The bridge should stay narrow, typed, and versioned. If a feature needs a new message, add tests around parsing/sending behavior before widening the command surface.

## Persistence

MVP persistence is local SQLite. The repository interface keeps app code away from the concrete store so later iCloud/sync decisions can happen without rewriting screens.

Search is title plus plain lyric body text. HTML is never used for search or canonical storage.

## Deferred Areas

- Rhyme highlighting and CMU-backed suggestions.
- Theme parity and highlight color tokens.
- Local audio playback and loop points.
- iCloud/sync.
- IAP and paywall.
- AI collaborator flows.

Each deferred area should land as a thin, testable slice rather than a broad port from the old Swift app.
