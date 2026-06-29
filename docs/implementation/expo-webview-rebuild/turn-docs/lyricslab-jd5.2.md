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

Not started.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Not started.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `not-started`

Evidence:

- Implementation thread reported `npm --prefix apps/mobile test -- songRepository.test.ts` passed with 1 suite and 4 tests passing.
- Implementation thread reported `npm --prefix apps/mobile run typecheck` passed with `tsc --noEmit`.
- Implementation thread reported `npm --prefix apps/mobile test` passed with 1 suite and 4 tests passing.
- Implementation thread reported `cd apps/mobile && npx expo config --type public` passed, resolving SDK 56.0.0 with `expo-sqlite` and `expo-router` plugins.
- Implementation thread reported `CI=1 EXPO_NO_TELEMETRY=1 timeout 25s npm --prefix apps/mobile run start -- --port 8094` reached `Starting Metro Bundler` and `Waiting on http://localhost:8094`; exit 124 was the intentional timeout and `ss` showed no listener left behind.
- Implementation thread reported `CI=1 EXPO_NO_TELEMETRY=1 npx expo export --platform ios --output-dir /tmp/lyricslab-mobile-export-jd5-2` passed and bundled `expo-router/entry.js` for iOS with 1113 modules.
- Manual device smoke for create song, edit title, return to Songs, and search by title is blocked in this thread because the Debian host has no `adb` and no `xcrun`; closest evidence is repository create/update/search coverage plus Expo Router start/export checks.

## PR And Commits

Draft PR: https://github.com/dirtydishes/lyricslab/pull/11

GitHub state observed by orchestrator after callback:

- Head: `lavender/lyricslab-jd5-2-song-persistence-app-shell`
- Base: `lavender/expo-webview-rebuild-test`
- Draft: yes
- Merge state: `CLEAN`
- Mergeable: `MERGEABLE`
- Status checks: empty `statusCheckRollup`

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.2` `in_progress` after selector chose it as the next ready phase.

2026-06-29: Orchestrator recorded the implementation callback in Beads before launching the review thread.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 2 owns native app shell and song persistence only.
- Quality gates: repository tests, `npm --prefix apps/mobile run typecheck`, and manual smoke for create song, edit title, return to Songs, and search by title when feasible.
- Keep non-route providers out of `apps/mobile/src/app`; Expo Router treats `src/app` as the route root if it exists.

## Closeout

Not started.
