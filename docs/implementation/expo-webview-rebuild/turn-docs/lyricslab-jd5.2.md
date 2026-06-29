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

Implementation callback received on 2026-06-29.

- Status: `pr-ready`
- Branch: `lavender/lyricslab-jd5-2-song-persistence-app-shell`
- PR: https://github.com/dirtydishes/lyricslab/pull/11
- Commits:
  - `6d2e9af2a3f0d1599f3e4a98930a81d536e2f3c6`
  - `7250639f27552e938c906cb5570c442afc5f0501`
- Expo Router is now installed and `apps/mobile/package.json` uses `expo-router/entry`.
- Runtime song persistence uses Expo SQLite through the `SongRecordStore` adapter; Node tests use the in-memory adapter.
- The lyric body area remains a placeholder; no WebView, Tiptap, bridge, suggestion bar, rhyme logic, or highlighting was added.

## Subagent Swarms

Not used. This was a narrow implementation phase with direct local gates.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

2026-06-29 review thread:

- Phase scope stayed bounded to native song persistence and shell work: `Song` / `SongId`, repository CRUD/search, Songs route, editor route, native title editing, and debounced title persistence.
- No real lyric body WebView editing, Tiptap/editor-web package, WebView bridge, keyboard suggestion bar, rhyme logic, or highlighting was added.
- Non-route provider code stayed outside `apps/mobile/src/app`; the repository provider lives in `apps/mobile/src/songs/SongRepositoryProvider.tsx`, while route files live under `apps/mobile/app`.
- Repository layering is acceptable for this phase: Expo SQLite is isolated behind `SongRecordStore`, and Node tests exercise repository behavior through the in-memory adapter.
- No file crossed the 1k-line threshold, and no generated/source churn outside the mobile app shell, dependency lockfile, and phase turn doc was found.
- Repair made: clean installs failed because `react-dom@19.2.7` floated into the lockfile while the app pins `react@19.2.3`; pinned `react-dom` exactly to `19.2.3` in `apps/mobile/package.json` and `apps/mobile/package-lock.json`.
- Findings remaining: none.

## CI And Gates

CI owner: reviewer/verification agents

Current implementation-thread gate state: local gates passed; hosted CI not inspected by this thread.

Reviewer gate state: repaired local clean-install blocker; local gates passed after repair. Hosted GitHub checks are unavailable with evidence because PR `statusCheckRollup` is empty.

Evidence:

- Implementation thread reported `npm --prefix apps/mobile test -- songRepository.test.ts` passed with 1 suite and 4 tests passing.
- Implementation thread reported `npm --prefix apps/mobile run typecheck` passed with `tsc --noEmit`.
- Implementation thread reported `npm --prefix apps/mobile test` passed with 1 suite and 4 tests passing.
- Implementation thread reported `cd apps/mobile && npx expo config --type public` passed, resolving SDK 56.0.0 with `expo-sqlite` and `expo-router` plugins.
- Implementation thread reported `CI=1 EXPO_NO_TELEMETRY=1 timeout 25s npm --prefix apps/mobile run start -- --port 8094` reached `Starting Metro Bundler` and `Waiting on http://localhost:8094`; exit 124 was the intentional timeout and `ss` showed no listener left behind.
- Implementation thread reported `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform ios --output-dir /tmp/lyricslab-mobile-export-jd5-2` passed and bundled `expo-router/entry.js` for iOS with 1113 modules.
- Manual device smoke for create song, edit title, return to Songs, and search by title is blocked in this thread because the Debian host has no `adb` and no `xcrun`; closest evidence is repository create/update/search coverage plus Expo Router start/export checks.
- Review `gh pr view 11 --json number,title,state,isDraft,baseRefName,headRefName,headRefOid,mergeStateStatus,statusCheckRollup,url` passed before repair push; PR #11 was open draft, base `lavender/expo-webview-rebuild-test`, head `lavender/lyricslab-jd5-2-song-persistence-app-shell`, head SHA `7250639f27552e938c906cb5570c442afc5f0501`, `mergeStateStatus` `UNKNOWN`, and `statusCheckRollup` `[]`.
- Initial review-worktree `npm --prefix apps/mobile run typecheck` and `npm --prefix apps/mobile test -- songRepository.test.ts` failed because `tsc` and `jest` were not installed before dependency install.
- Initial review-worktree `npm --prefix apps/mobile ci` failed with `ERESOLVE`: `react-dom@19.2.7` required peer `react@^19.2.7` while the app pins `react@19.2.3`.
- Review repair commit `21929c6` pins `react-dom` to `19.2.3`, matching the app's exact `react` version and making the lockfile reproducible.
- Final `npm --prefix apps/mobile ci` passed; npm installed 946 packages, reported the existing `react-native-worklets` peer override warning, and reported 10 moderate vulnerabilities in the dependency graph.
- Final `npm --prefix apps/mobile run typecheck` passed with `tsc --noEmit`.
- Final `npm --prefix apps/mobile test -- songRepository.test.ts` passed; Jest reported 1 suite and 4 tests passing.
- Final `npm --prefix apps/mobile test` passed; Jest reported 1 suite and 4 tests passing.
- Final `cd apps/mobile && npx expo config --type public` passed; resolved SDK `56.0.0`, plugins `expo-sqlite` and `expo-router`, and platforms `ios`, `android`, and `web`.
- Final `CI=1 EXPO_NO_TELEMETRY=1 timeout 25s npm --prefix apps/mobile run start -- --port 8096` reached `Starting Metro Bundler` and `Waiting on http://localhost:8096`; exit code `124` was the intentional timeout. Follow-up `ss -tulpen | rg ':8096\b'` returned no listener.
- Final `cd apps/mobile && CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform ios --output-dir /tmp/lyricslab-mobile-export-jd5-2-review-final-20260629` passed; Expo bundled `node_modules/expo-router/entry.js` for iOS with 1113 modules and exported to `/tmp/lyricslab-mobile-export-jd5-2-review-final-20260629`.
- Manual device smoke for tapping create, editing the title, returning to Songs, and searching by title remains blocked in this environment: `command -v adb` and `command -v xcrun` both returned exit code 1 with no path on this Debian host.
- After merging base commit `f4adb0b` to clear the PR merge conflict, `npm --prefix apps/mobile run typecheck` and `npm --prefix apps/mobile test` both passed again.
- Final review `gh pr view 11 --json number,title,state,isDraft,baseRefName,headRefName,headRefOid,mergeStateStatus,statusCheckRollup,url` after the base merge reported `mergeStateStatus` `CLEAN` and `statusCheckRollup` `[]`.

## PR And Commits

- Draft PR: https://github.com/dirtydishes/lyricslab/pull/11
- Branch: `lavender/lyricslab-jd5-2-song-persistence-app-shell`
- Base: `lavender/expo-webview-rebuild-test`
- GitHub state observed by orchestrator after implementation callback: draft yes; merge state `CLEAN`; mergeable `MERGEABLE`; status checks empty `statusCheckRollup`.
- Review thread observed `mergeStateStatus` `DIRTY` after its first push because base commit `f4adb0b` had landed on `lavender/expo-webview-rebuild-test`; review merged the current base into the PR branch before callback.
- Orchestrator marked PR #11 ready and merged it into `lavender/expo-webview-rebuild-test` after receiving the review callback.
- Merge commit: `8469d4a99dbe3641b0ad39d07f540a01dd695882`
- Commits:
  - `6d2e9af` - `feat: add song persistence app shell`
  - `7250639` - `docs: record phase 2 pr state`
  - `21929c6` - `fix mobile clean install`
  - `9f4dca8` - `merge expo webview rebuild base`

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.2` `in_progress` after selector chose it as the next ready phase.

2026-06-29: Orchestrator recorded the implementation callback in Beads before launching the review thread.

2026-06-29: Orchestrator recorded the review callback in Beads, marked PR #11 ready, merged PR #11, and closed `lyricslab-jd5.2` with review/CI evidence.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 2 owns native app shell and song persistence only.
- Quality gates: repository tests, `npm --prefix apps/mobile run typecheck`, and manual smoke for create song, edit title, return to Songs, and search by title when feasible.
- Expo Router is now installed and `apps/mobile/package.json` uses `expo-router/entry`.
- Keep non-route providers out of `apps/mobile/src/app`; Expo Router treats `src/app` as the route root if it exists.
- Runtime persistence uses Expo SQLite through the `SongRecordStore` adapter; Node tests use the in-memory adapter.

## Closeout

Implementation closeout state: PR-ready after draft PR creation.

- Status: `pr-ready`
- Review status: `repaired`
- CI state: `ci-unavailable-with-evidence`
- Review callback state: ready after pushing review repair/evidence to PR branch.
- PR state: merged into `lavender/expo-webview-rebuild-test`
- Merge commit: `8469d4a99dbe3641b0ad39d07f540a01dd695882`
- Callback target: orchestrator thread `019f141a-a9e0-76c0-96b9-401376bb75f4`
- Beads: closed by orchestrator after PR merge and review callback.
- Next ready Beads phase: `lyricslab-jd5.3`
