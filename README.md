# LyricsLab

LyricsLab is an offline-first lyric writing workspace for rappers, songwriters, and lyric-driven musicians. The active app is now the Expo/React Native rebuild with a WebView-hosted Tiptap editor.

This branch is the clean Expo working surface. The old Swift/Xcode implementation was removed from this branch so day-to-day work starts from the app that is being rebuilt, not from the prototype graveyard.

## Status

Current state: Expo rebuild foundation, not production-ready yet.

Already present:
- Expo Router app shell at the repo root.
- Local song list, creation, deletion, title/body persistence, and search.
- SQLite-backed local song repository.
- Tiptap editor bundle in `packages/editor-web`.
- WebView bridge for editor readiness, body changes, cursor context, and suggestion insertion.
- Offline generated editor HTML at `src/editor/generated/editorHtml.ts`.
- Native suggestion bar placeholder wired to insert at the WebView cursor.
- Dev-client oriented iOS config, including bundle id and local-network permissions.

Still required before replacing the old Swift lane in spirit:
- Real-device Expo runtime validation.
- Generated editor HTML freshness guard.
- Offline rhyme-backed suggestions and highlighting.
- Theme, audio, iCloud, IAP, and AI decisions for the Expo architecture.

## Repo Layout

- `app/` - Expo Router routes.
- `src/songs/` - song types, repository interface, SQLite implementation, list screen.
- `src/editor/` - editor screen, WebView wrapper, bridge helpers, suggestion bar, generated HTML.
- `packages/editor-web/` - Vite/Tiptap package that builds the editor loaded by the WebView.
- `data/cmudict.txt` - neutral CMU dictionary source for the upcoming offline rhyme engine.
- `scripts/build-editor-html.mjs` - inlines the editor web build into `src/editor/generated/editorHtml.ts`.
- `docs/implementation/expo-webview-rebuild/` - archived execution notes from the viability lane.

## Development

Install dependencies:

```bash
npm ci
npm --prefix packages/editor-web ci
```

Rebuild the offline editor HTML after changing `packages/editor-web`:

```bash
npm run build:editor-html
```

Run checks:

```bash
npm test
npm run typecheck
npm run editor:test
npm run editor:build
```

Run on iOS with the Expo dev client path:

```bash
npm run ios
```

Generated native folders stay ignored. If `npm run ios` creates `ios/` or `android/`, treat them as local build output unless a specific task says to commit native project files.

## Product Rules

- MVP-first. Do not widen into AI, external APIs, IAP, or audio unless explicitly scoped.
- Offline-first. The local app remains useful without network access.
- Store lyric body as editor JSON plus plain text. Do not make HTML canonical.
- Keep typing, cursor behavior, keyboard layout, and suggestion insertion product-critical.
- Do not log user lyric content.

## Current Decision

Keep the same GitHub repo and use this clean branch/worktree as the Expo app surface. The Swift implementation remains recoverable through Git history and older branches, but it is no longer part of this branch's working tree.
