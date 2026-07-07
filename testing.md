# testing.md - LyricsLab Expo Rebuild

## Fast Local Gates

Run these before closing most code changes:

```bash
npm test
npm run typecheck
npm run editor:test
```

Run this whenever `packages/editor-web` changes or when WebView loading behavior changes:

```bash
npm run build:editor-html
```

Use this as a config sanity check when Expo dependencies or `app.json` change:

```bash
npx expo config --type public
```

## Coverage Priorities

- `src/songs/`
  - Repository create/update/delete/search behavior.
  - SQLite implementation tests where feasible without device-only APIs.
- `src/editor/bridge.ts`
  - Parse only known bridge messages.
  - Generate safe WebView command scripts.
- `src/editor/bodyPersistence.ts`
  - Preserve stale-save ordering and merge behavior.
- `src/editor/suggestions.ts`
  - Deterministic suggestion ids, filtering, and ordering.
- `packages/editor-web/src/`
  - Suggestion context extraction.
  - Bridge message emission.
  - Future editor command behavior.

## Manual Device Checklist

The Expo rebuild is not validated as the daily app until this passes on a physical iPhone:

- App launches through the Expo dev-client flow.
- Create a song.
- Edit title and body.
- Keyboard appears without covering the editor unexpectedly.
- Suggestion bar stays reachable while typing.
- Insert suggestion at cursor.
- Navigate away and back; title/body persist.
- Search finds title and body text.
- Kill and relaunch; local songs remain.
- Airplane mode does not break the core writing flow.

Record device, iOS version, command used, and any screenshots or screen recordings in the relevant implementation note or Beads issue.

## What Not To Add Yet

- Broad UI snapshots before the visual system exists.
- Cloud/IAP/AI tests before those features are in scope.
- Slow full-dictionary or performance benchmarks in the default test command.
