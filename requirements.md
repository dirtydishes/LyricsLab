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
- Suggestions must be deterministic and non-disruptive.
- CMU-backed rhyme suggestions are the next core upgrade; placeholder suggestions are only acceptable during the rebuild foundation.
- The CMU dictionary source lives at `data/cmudict.txt` until the TypeScript rhyme module chooses its runtime format.

Non-functional:
- Typing should remain responsive.
- Expensive analysis must be debounced or moved out of the hot typing path.
- No lyric content logging.
- No external APIs in MVP.

## Post-MVP Or Explicitly Scoped Later

- Rhyme highlighting and richer visual grouping.
- Full CMU dictionary port and caching.
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
- Real-device validation is required before declaring the Expo rebuild the primary product lane.

## Acceptance Criteria For The Rebuild Foundation

- `npm test`, `npm run typecheck`, `npm run editor:test`, and `npm run build:editor-html` pass.
- `npx expo config --type public` resolves without config errors.
- Physical-device checklist in `testing.md` passes.
- A fresh checkout can install, build the editor HTML, and start the Expo app from the repo root.
