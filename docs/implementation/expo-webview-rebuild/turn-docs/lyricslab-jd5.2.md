# Phase 2 Turn Doc: Song persistence and app shell

Beads issue: `lyricslab-jd5.2`

Phase doc: `docs/implementation/expo-webview-rebuild/02-song-persistence-app-shell.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by selector subagent on 2026-06-29.

- Beads issue: `lyricslab-jd5.2`
- Phase: Song persistence and app shell
- Active stream branch: `lavender/expo-webview-rebuild-test`
- Expected PR base: `lavender/expo-webview-rebuild-test`
- Why ready: Beads reports `lyricslab-jd5.2` as the only ready child; blocker `lyricslab-jd5.1` is closed. Phases 3-6 remain dependency-blocked.

## Scope

Implement `Song` / `SongId` types, local song repository, Songs screen create/open/delete/search, editor route with native title editing, debounced title persistence, and repository CRUD/search tests.

Out of scope: real lyric body WebView editing, Tiptap/editor-web, WebView bridge, keyboard suggestion bar, rhyme logic, or highlighting.

## Implementation Log

2026-06-29 implementation thread:

- Created branch `lavender/lyricslab-jd5-2-song-persistence-app-shell` from `origin/lavender/expo-webview-rebuild-test`.
- Added typed `Song` / `SongId` model with `title`, `bodyText`, `bodyJson`, `createdAt`, and `updatedAt`.
- Added a pure `SongRepository` with a `SongRecordStore` adapter seam, an in-memory adapter for Node tests, and an Expo SQLite runtime store.
- Added repository behavior tests for create/list/get/update/delete plus title/body search.
- Replaced the Phase 1 placeholder shell with Expo Router routes:
  - `apps/mobile/app/index.tsx`
  - `apps/mobile/app/song/[id].tsx`
  - `apps/mobile/app/_layout.tsx`
- Added a repository provider backed by Expo SQLite.
- Added a Songs screen with search, create, open, and delete.
- Added an editor route/screen with native title `TextInput`, placeholder lyric body area, and 450 ms debounced title persistence. The back action flushes pending title changes before returning to Songs.
- Installed Expo Router and its Expo-compatible dependencies with `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants`.
- Removed the Phase 1 placeholder screen/test modules and the old `App.tsx` / `index.ts` entrypoint now that `expo-router/entry` owns app startup.

## Subagent Swarms

Not used. This was a narrow implementation phase with direct local gates.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Not started.

## CI And Gates

CI owner: reviewer/verification agents

Current implementation-thread gate state: local gates passed; hosted CI not inspected by this thread.

Evidence:

- `npm --prefix apps/mobile ci` passed; npm installed 849 packages and reported 10 moderate severity vulnerabilities in the dependency graph.
- `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants` passed from `apps/mobile`; npm reported peer override warnings around `react-native-worklets`, and Expo added the `expo-router` config plugin.
- `npm --prefix apps/mobile test -- songRepository.test.ts` passed; Jest reported 1 suite and 4 tests passing.
- `npm --prefix apps/mobile run typecheck` passed with `tsc --noEmit`.
- `npm --prefix apps/mobile test` passed; Jest reported 1 suite and 4 tests passing.
- `cd apps/mobile && npx expo config --type public` passed; resolved SDK `56.0.0`, plugins `expo-sqlite` and `expo-router`, and platforms `ios`, `android`, and `web`.
- `CI=1 EXPO_NO_TELEMETRY=1 timeout 25s npm --prefix apps/mobile run start -- --port 8094` reached `Starting Metro Bundler` and `Waiting on http://localhost:8094`; exit code `124` was the intentional timeout. Follow-up `ss -tulpen | rg ':8094' || true` showed no listener left behind.
- `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform ios --output-dir /tmp/lyricslab-mobile-export-jd5-2` passed from `apps/mobile`; Expo bundled `node_modules/expo-router/entry.js` for iOS with 1113 modules and exported to `/tmp/lyricslab-mobile-export-jd5-2`.
- Manual device smoke for tapping create, editing the title, returning to Songs, and searching by title is blocked in this environment: this Debian host has no `adb` and no `xcrun`, so no Android emulator or iOS simulator/device target is available from the thread. Closest evidence is the repository create/update/search test coverage plus the Expo Router start/export checks above.

## PR And Commits

- Draft PR: https://github.com/dirtydishes/lyricslab/pull/11
- Branch: `lavender/lyricslab-jd5-2-song-persistence-app-shell`
- Base: `lavender/expo-webview-rebuild-test`
- Commits:
  - `6d2e9af` - `feat: add song persistence app shell`

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.2` `in_progress` after selector chose it as the next ready phase.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 2 owns native app shell and song persistence only.
- Quality gates: repository tests, `npm --prefix apps/mobile run typecheck`, and manual smoke for create song, edit title, return to Songs, and search by title when feasible.
- Expo Router is now installed and `apps/mobile/package.json` uses `expo-router/entry`.
- Keep non-route providers out of `apps/mobile/src/app/`; Expo Router will treat `src/app` as the route root if that directory exists.
- Runtime persistence uses Expo SQLite through the `SongRecordStore` adapter; Node tests use the in-memory adapter.

## Closeout

Implementation closeout state: PR-ready after draft PR creation.

- Status: `pr-ready`
- Callback target: orchestrator thread `019f141a-a9e0-76c0-96b9-401376bb75f4`
- Beads: not advanced by this implementation thread per orchestrator instruction.
