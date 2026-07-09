# requirements.md - LyricsLab Expo Rebuild

## MVP Requirements

Core writing:
- Create, open, rename, search, and delete songs.
- Edit lyric body with stable cursor behavior.
- Persist title, `bodyJson`, and `bodyText` locally.
- Search must match titles and lyric body text.
- Keep the editor usable offline.

Editor bridge:
- Load a song into the WebView editor.
- Receive body changes from the WebView.
- Receive cursor/suggestion context from the WebView.
- Insert a native suggestion at the editor cursor.
- Use generated offline editor HTML instead of depending on a dev server at runtime.

Suggestions:
- Keep the native suggestion bar reachable while typing.
- MVP suggestions are deterministic offline CMU-backed rhyme suggestions shown in the native suggestion bar.
- Placeholder suggestions are only acceptable during the rebuild foundation and are not the offline-rhyme MVP.
- The WebView provides cursor/suggestion context only; MVP rhyme search and ranking belong outside the WebView.
- Planned rhyme logic boundary: `src/rhyme/`, a pure TypeScript module consumed by native suggestion integration and tested independently from React Native, WebView, SQLite, and network concerns.
- The CMU dictionary source lives at `data/cmudict.txt`; later phases may choose a generated runtime format, but raw CMU parsing must not happen in the typing hot path.

Non-functional:
- Typing should remain responsive.
- Expensive analysis must be debounced or moved out of the hot typing path.
- No lyric body text, cursor context, search text, rhyme queries, or suggestion candidate text may be logged.
- No external APIs, external rhyme services, AI/model calls, cloud inference, or network dependency in MVP suggestions.
- No hot-path SQLite dictionary lookups, raw CMU parsing, full-dictionary scans, network calls, or expensive synchronous analysis while typing.

## Post-MVP Or Explicitly Scoped Later

- WebView rhyme highlighting, phrase-rhyme visualization, and richer visual grouping.
- Advanced CMU cache layouts, numeric optimizations, optional benchmarks, and tuning beyond the deterministic MVP artifact pipeline.
- Teachable slant preferences and persistent writer-trained rhyme families.
- Neural ranking, model inference, and learned rerankers.
- Theme parity with highlight palettes.
- Local audio playback and loop points.
- iCloud/sync.
- IAP/paywall.
- AI collaborator room.
- External rhyme APIs.

## Decisions

- Active app shell: Expo/React Native.
- Active body editor: WebView-hosted Tiptap.
- Active local store: SQLite via `expo-sqlite`.
- Canonical body storage: `bodyJson` and `bodyText`.
- Generated HTML is build output, not product data.
- CMU dictionary data is shared product data, not old Swift app code.
- `src/rhyme/` is the planned pure TypeScript boundary for offline rhyme lookup and ranking.
- Real-device validation is required before declaring the Expo rebuild the primary product lane.

## Acceptance Criteria For The Rebuild Foundation

- `npm test`, `npm run typecheck`, `npm run editor:test`, and `npm run build:editor-html` pass.
- `npx expo config --type public` resolves without config errors.
- Physical-device checklist in `testing.md` passes.
- A fresh checkout can install, build the editor HTML, and start the Expo app from the repo root.

## Acceptance Criteria For Offline Rhyme Suggestions

- The native suggestion bar can use deterministic ranked suggestions from local CMU-backed data.
- Suggestion insertion at the editor cursor remains unchanged.
- Missing anchors, missing candidates, and missing dictionary entries fall back gracefully without UI disruption.
- Rhyme lookup has no network dependency, external API call, lyric-content logging, or hot-path SQL/raw-CMU parsing.
- Typing responsiveness is protected with prebuilt/indexed data, debouncing, or background work where needed.
