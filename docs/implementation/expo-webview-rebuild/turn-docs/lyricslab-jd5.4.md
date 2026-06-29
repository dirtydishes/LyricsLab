# Phase 4 Turn Doc: WebView bridge and body persistence

Beads issue: `lyricslab-jd5.4`

Phase doc: `docs/implementation/expo-webview-rebuild/04-webview-bridge-body-persistence.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by selector subagent on 2026-06-29.

- Beads issue: `lyricslab-jd5.4`
- Phase: WebView bridge and body persistence
- Active stream branch: `lavender/expo-webview-rebuild-test`
- Expected PR base: `lavender/expo-webview-rebuild-test`
- Why ready: Beads reports `lyricslab-jd5.4` as the only ready child; blocker `lyricslab-jd5.3` is closed. Phases 5-6 remain dependency-blocked.

## Scope

Load the Phase 3 Tiptap editor inside the Expo React Native WebView, add narrow typed native bridge parsing/sending helpers, send current song body after `editorReady`, debounce `contentChanged` persistence into `bodyJson` / `bodyText`, store latest `selectionChanged` context for later phases, and make previews/search use `bodyText`.

Out of scope: keyboard suggestions, suggestion insertion, offline bundling, and rhyme highlighting/decorations.

## Implementation Log

Implementation callback received on 2026-06-29.

- Status: `pr-ready`
- Branch: `lavender/lyricslab-jd5-4-webview-bridge-body-persistence`
- PR: https://github.com/dirtydishes/lyricslab/pull/13
- Commits:
  - `f0d308ee2f0f91150d9b7a81143388765fe36845`
  - `6e756486499f3db2e5ae5a995e1621e764c3e8e1`
- `EditorWebView` loads a dev editor URL from `EXPO_PUBLIC_EDITOR_WEB_URL` or Expo `extra.editorWebUrl` first, then Expo host metadata, then `http://127.0.0.1:5174/`. Phase 6 still owns offline bundling.
- Latest `selectionChanged` context is stored in `LyricsEditorScreen` for Phase 5, but no suggestion UI or `insertSuggestion` interaction was added.
- Body persistence debounces `contentChanged` snapshots and guards stale in-flight saves so older saves cannot clear newer pending body edits.

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

- Implementation thread reported `npm --prefix apps/mobile ci` passed after initial missing dependency errors for Jest/TypeScript.
- Implementation thread reported `npm --prefix apps/mobile test` passed with 2 suites and 10 tests.
- Implementation thread reported `npm --prefix apps/mobile run typecheck` passed with `tsc --noEmit`.
- Implementation thread reported `npm --prefix apps/editor-web ci` passed after initial missing dependency errors for Vitest/TypeScript.
- Implementation thread reported `npm --prefix apps/editor-web test` passed with 1 suite and 4 tests.
- Implementation thread reported `npm --prefix apps/editor-web run build` passed with `tsc --noEmit && vite build`.
- Manual Expo device/simulator smoke for body edits after navigating away/back was not run because no Expo device session or simulator runtime was available; closest automated evidence is bridge parser/sender coverage plus repository update/search persistence coverage.

## PR And Commits

Draft PR: https://github.com/dirtydishes/lyricslab/pull/13

GitHub state observed by orchestrator after callback:

- Head: `lavender/lyricslab-jd5-4-webview-bridge-body-persistence`
- Base: `lavender/expo-webview-rebuild-test`
- Draft: yes
- Merge state: `CLEAN`
- Mergeable: `MERGEABLE`
- Status checks: empty `statusCheckRollup`

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.4` `in_progress` after selector chose it as the next ready phase.

2026-06-29: Orchestrator recorded the implementation callback in Beads before launching the review thread.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 4 owns native WebView integration and body persistence. Phase 5 owns keyboard suggestions/insertion; Phase 6 owns offline bundling.
- Quality gates: typecheck, bridge parsing tests if added, manual smoke for body edits persisting after navigating away/back, and search finding body text when feasible.

## Closeout

Not started.
