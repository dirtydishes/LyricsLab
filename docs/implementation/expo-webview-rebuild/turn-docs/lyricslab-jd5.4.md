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

2026-06-29 implementation thread:

- Created `apps/mobile/src/editor/bridge.ts` with native-side parsing for Phase 3 WebView bridge envelopes and a typed `loadSong` JavaScript sender helper.
- Created `apps/mobile/src/editor/EditorWebView.tsx` using `react-native-webview`; it loads the editor-web dev URL, waits for `editorReady`, then injects `window.LyricsLabEditor.loadSong({ bodyJson, bodyText })`.
- Replaced the editor body placeholder in `apps/mobile/src/editor/LyricsEditorScreen.tsx` with `EditorWebView`.
- Wired `contentChanged` messages into debounced repository persistence for `bodyJson` and `bodyText`; the Back action flushes pending title/body saves before navigation.
- Stored the latest `selectionChanged` context in native editor state for Phase 5 suggestion work without adding suggestion UI or insertion behavior.
- Added stale-save protection so an older body save cannot clear or visually overwrite a newer pending body edit.
- Strengthened repository coverage so updated `bodyText` is searchable after persistence.
- Kept keyboard suggestions, suggestion insertion, offline bundling, and rhyme highlighting/decorations out of scope.

## Subagent Swarms

Not used. The selected phase was narrow enough for direct implementation in this worker thread.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Not started.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `not-started`; implementation local gates passed.

Evidence:

- Initial `npm --prefix apps/mobile test` and `npm --prefix apps/mobile run typecheck` were blocked because `apps/mobile/node_modules` was absent (`jest: not found`, `tsc: not found`).
- `npm --prefix apps/mobile ci` passed on 2026-06-29.
  - Installed 946 packages from `apps/mobile/package-lock.json`.
  - npm reported existing peer/deprecation warnings and 10 moderate audit findings.
- `npm --prefix apps/mobile test` passed on 2026-06-29 after dependency install.
  - Jest suites: `2 passed, 2 total`.
  - Tests: `10 passed, 10 total`.
  - Includes bridge parsing/sending tests in `apps/mobile/src/editor/__tests__/bridge.test.ts`.
- `npm --prefix apps/mobile run typecheck` passed on 2026-06-29.
  - Runs `tsc --noEmit`.
- Optional editor-web dependency check:
  - Initial `npm --prefix apps/editor-web test` and `npm --prefix apps/editor-web run build` were blocked because `apps/editor-web/node_modules` was absent (`vitest: not found`, `tsc: not found`).
  - `npm --prefix apps/editor-web ci` passed on 2026-06-29.
  - `npm --prefix apps/editor-web test` passed on 2026-06-29: Vitest `1 passed (1)`, `4 passed (4)`.
  - `npm --prefix apps/editor-web run build` passed on 2026-06-29: `tsc --noEmit && vite build`, `52 modules transformed`, `built in 340ms`.
- Manual/device smoke for "body edits persist after navigating away/back" was not run in this worker environment because no Expo device session or simulator runtime was available. Closest automated evidence is the native bridge parser/sender test coverage plus repository update/search persistence coverage in `npm --prefix apps/mobile test`.

## PR And Commits

Implementation branch: `lavender/lyricslab-jd5-4-webview-bridge-body-persistence`

Draft PR: https://github.com/dirtydishes/lyricslab/pull/13

Commits:

- `f0d308e` - `feat: wire webview body persistence`
- `docs: record phase 4 pr state` - final PR-state turn-doc update on top of the implementation commit.

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.4` `in_progress` after selector chose it as the next ready phase.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 4 owns native WebView integration and body persistence. Phase 5 owns keyboard suggestions/insertion; Phase 6 owns offline bundling.
- Quality gates: typecheck, bridge parsing tests if added, manual smoke for body edits persisting after navigating away/back, and search finding body text when feasible.
- `EditorWebView` currently loads the editor-web dev server URL from explicit `EXPO_PUBLIC_EDITOR_WEB_URL` / Expo `extra.editorWebUrl` config when present, otherwise infers the host from Expo metadata and falls back to `http://127.0.0.1:5174/`. Phase 6 owns offline bundled loading.
- Latest selection context is stored in `LyricsEditorScreen` for later suggestion UI, but Phase 4 intentionally does not render suggestions or call `insertSuggestion`.

## Closeout

Implementation PR is open as draft PR #13 against `lavender/expo-webview-rebuild-test`.

Implementation callback status: ready to send after this turn-doc update is committed and pushed.
