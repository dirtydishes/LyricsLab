# architecture.md - LyricsLab Expo Rebuild

## High Level

LyricsLab is now shaped as an Expo/React Native app with a WebView editor package:

- Expo Router owns native navigation and app startup.
- React Native screens own songs, title editing, search, persistence orchestration, native CMU-backed suggestion orchestration, and the keyboard suggestion bar.
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
- `src/rhyme/`
  - Planned pure TypeScript boundary for deterministic offline rhyme logic and CMU-backed suggestion ranking.
  - Keep it independent of Expo, React Native, WebView, SQLite, Tiptap, network access, and lyric-content logging.
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
- Calls into `src/rhyme/` with compact cursor/anchor context and prepared CMU-backed data.
- Calls into the editor: load song, focus, insert suggestion.

WebView owns:
- Body text editing.
- Selection/cursor context.
- Tiptap JSON document shape.
- Bridge messages back to native.
- It does not own MVP rhyme analysis, highlight spans, or decorations.

The bridge should stay narrow, typed, and versioned. MVP rhyme traffic is limited to editor readiness, body/selection context needed for suggestions, load/focus/insert commands, and save state. Do not send raw CMU payloads, rhyme indexes, analyzer internals, highlight spans, or ProseMirror/Tiptap decoration packets through the bridge in the MVP. If a feature needs a new message, add tests around parsing/sending behavior before widening the command surface.

## MVP Offline Rhyme Suggestions

CMU-backed suggestions are MVP when they appear in the native suggestion bar. The WebView reports compact cursor/selection context to native; native normalizes the current anchor, asks `src/rhyme/` for deterministic ranked suggestions from a prepared CMU artifact or fixture, renders the suggestion bar, and uses the existing insert command when a suggestion is selected.

Constraints:
- All rhyme lookup runs locally with no network calls or external rhyme APIs.
- Lyric body text, cursor context, search text, rhyme queries, and suggestion candidates must not be logged.
- The typing/suggestion hot path must not issue SQLite dictionary lookups or parse raw `data/cmudict.txt`.
- SQLite remains for songs, search, and local user data; later custom pronunciations, learned preferences, or sync metadata need separate scoped slices.

## Persistence

MVP persistence is local SQLite. The repository interface keeps app code away from the concrete store so later iCloud/sync decisions can happen without rewriting screens.

Search is title plus plain lyric body text. HTML is never used for search or canonical storage.

## Deferred Areas

- WebView rhyme highlighting, ProseMirror/Tiptap decorations, highlight/span packets, and phrase-rhyme visualization.
- Theme parity and highlight color tokens.
- Local audio playback and loop points.
- iCloud/sync.
- IAP and paywall.
- AI collaborator flows.
- Neural ranking and learned rerankers.
- Teachable slant preferences.

Each deferred area should land as a thin, testable slice rather than a broad port from the old Swift app.
