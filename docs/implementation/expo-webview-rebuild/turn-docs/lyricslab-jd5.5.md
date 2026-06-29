# Phase 5 Turn Doc: Keyboard suggestion bar and insertion

Beads issue: `lyricslab-jd5.5`

Phase doc: `docs/implementation/expo-webview-rebuild/05-keyboard-suggestions-insertion.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by selector subagent on 2026-06-29.

- Beads issue: `lyricslab-jd5.5`
- Phase: Keyboard suggestion bar and insertion
- Active stream branch: `lavender/expo-webview-rebuild-test`
- Expected PR base: `lavender/expo-webview-rebuild-test`
- Why ready: Beads reports `lyricslab-jd5.5` as the only ready child; blocker `lyricslab-jd5.4` is closed. Phase 6 remains dependency-blocked.

## Scope

Add native keyboard-attached horizontal suggestions, a simple TypeScript suggestion provider, show the bar while the WebView body editor is focused, send `insertSuggestion` command messages, and ensure repeated taps insert word plus one trailing space at the current WebView selection without losing focus.

Out of scope: rhyme suggestions, rhyme highlighting, a full custom editor toolbar, and complex keyboard-controller work unless `KeyboardAvoidingView` is proven insufficient and documented.

## Implementation Log

2026-06-29 implementation worker:

- Created implementation branch `lavender/lyricslab-jd5-5-keyboard-suggestions-insertion` from `origin/lavender/expo-webview-rebuild-test`.
- Added `apps/mobile/src/editor/suggestions.ts`, a pure TypeScript placeholder word suggestion provider with stable IDs, deterministic ordering, light context follow-ups from the previous completed token, fallback suggestions, dedupe, and filtering for the current active token.
- Added `apps/mobile/src/editor/SuggestionBar.tsx`, a horizontal native `ScrollView` suggestion bar using `keyboardShouldPersistTaps="always"` and fixed-height suggestion buttons.
- Extended `apps/mobile/src/editor/bridge.ts` with typed `insertSuggestion` and `focusEditor` WebView command script helpers.
- Converted `EditorWebView` to expose a small imperative handle with `insertSuggestion(word)` and `focusEditor()`, and propagated `editorFocused` / `editorBlurred` messages to the native screen.
- Wired `LyricsEditorScreen` to track body editor focus and latest WebView selection context, show the bar only while the body editor is focused, and send tapped suggestions back into the WebView via `insertSuggestion`.
- Kept keyboard positioning to the existing `KeyboardAvoidingView` approach. No keyboard-controller dependency was added.
- Added a short native blur grace period before hiding the bar so a WebView blur during a native suggestion tap does not immediately remove the press target.

2026-06-29 orchestrator recorded the implementation callback:

- Status: `pr-ready`
- Branch: `lavender/lyricslab-jd5-5-keyboard-suggestions-insertion`
- PR: https://github.com/dirtydishes/lyricslab/pull/14
- Commits:
  - `919b02a847d5a3b3de43fc47b1cfd05c12534612`
  - `bb501253449ca995878873bf4490d592f9fd0503`
- Native suggestion taps inject `window.LyricsLabEditor.insertSuggestion({ word })` through `EditorWebView`; native never mutates body text directly.
- Bar visibility follows WebView `editorFocused` / `editorBlurred` messages and uses a short blur grace period around suggestion taps.
- Keyboard positioning intentionally uses the existing `KeyboardAvoidingView` approach; no keyboard-controller dependency was added.

## Subagent Swarms

None. This worker kept the phase implementation single-threaded and did not launch review threads.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

2026-06-29 reviewer:

- Confirmed Phase 5 stayed within scope: native horizontal suggestion bar, simple pure TypeScript suggestion provider, focus-driven bar visibility, typed native command injection to WebView, and insertion delegated to the existing WebView command surface.
- Confirmed no rhyme-powered suggestions, rhyme highlighting, `react-native-keyboard-controller` dependency, or full custom editor toolbar were added.
- Repair: narrowed the editor-web `InsertSuggestionCommand` contract from `string | { word: string }` to only `{ word: string }`, matching the native bridge payload and removing a fallback branch from `normalizeSuggestion`.
- Repair: removed the dead `latestSelectionContextRef` mirror from `LyricsEditorScreen`; `selectionContext` state is the single source used by the suggestion provider.
- Repair: merged the active `origin/lavender/expo-webview-rebuild-test` base into the PR branch to clear GitHub's conflicting merge state caused by orchestrator bookkeeping in Beads, loop-state, and this shared turn doc.
- Findings remaining: none.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `ci-unavailable-with-evidence`.

Evidence:

- Implementation thread reported initial `npm --prefix apps/mobile test -- suggestions.test.ts` failed before dependency install because `jest` was not present in `apps/mobile/node_modules` (`sh: 1: jest: not found`).
- Reviewer reran `npm --prefix apps/mobile ci`: passed. npm reported existing peer/deprecation/audit warnings, but installed lockfile dependencies successfully.
- Reviewer reran `npm --prefix apps/mobile test -- suggestions.test.ts`: passed, 1 test suite and 4 tests.
- Reviewer reran `npm --prefix apps/mobile run typecheck`: passed (`tsc --noEmit`).
- Reviewer reran `npm --prefix apps/mobile test`: passed, 4 test suites and 19 tests.
- Because the reviewer repaired editor-web bridge typing, reviewer also ran `npm --prefix apps/editor-web ci`: passed with 0 vulnerabilities.
- Reviewer also ran `npm --prefix apps/editor-web run build`: passed (`tsc --noEmit && vite build`, 52 modules transformed).
- Reviewer also ran `npm --prefix apps/editor-web test`: passed, 1 test file and 4 tests.
- Reviewer ran `git diff --check`: passed.
- Reviewer checked GitHub PR state before repair: PR #14 was open/draft with empty `statusCheckRollup`, head `bb501253449ca995878873bf4490d592f9fd0503`, and mergeable state `CONFLICTING` after the base branch advanced with orchestrator bookkeeping.
- Hosted CI is unavailable with evidence: GitHub `statusCheckRollup` was empty for PR #14, so there were no hosted checks to rerun or wait on.
- Manual/device smoke for body editor focus, keyboard appearance, bar appearance, horizontal scrolling, repeated taps at the visible cursor, and keyboard/focus stability was not feasible in this Debian reviewer worker: `command -v adb` exited 1 and `command -v xcrun` exited 1, so there was no Android device/emulator or iOS toolchain path available. Closest automated evidence is provider coverage, bridge command injection coverage, mobile typecheck, full mobile Jest, editor-web build/test, and static review of WebView-owned insertion.

## PR And Commits

Draft PR: https://github.com/dirtydishes/lyricslab/pull/14

Commits:

- `919b02a847d5a3b3de43fc47b1cfd05c12534612` - `add keyboard suggestion insertion`
- `bb501253449ca995878873bf4490d592f9fd0503` - `record phase five pr details`
- `31cd47d` - `tighten suggestion bridge contract`

GitHub state observed by orchestrator after callback:

- Head: `lavender/lyricslab-jd5-5-keyboard-suggestions-insertion`
- Base: `lavender/expo-webview-rebuild-test`
- Draft: yes
- Merge state: `CLEAN`
- Mergeable: `MERGEABLE`
- Status checks: empty `statusCheckRollup`

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.5` `in_progress` after selector chose it as the next ready phase.

2026-06-29: Orchestrator recorded the implementation callback in Beads before launching the review thread.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 5 owns keyboard suggestions and insertion. Phase 6 owns offline bundling and final viability gate.
- Quality gates: suggestion provider tests, mobile typecheck, manual smoke for focus body editor, keyboard/bar appearance, horizontal scrolling, and repeated taps inserting at the visible cursor while focus/keyboard remain stable when feasible.
- Native suggestion taps call `EditorWebView.insertSuggestion(word)`, which injects the existing WebView `window.LyricsLabEditor.insertSuggestion({ word })` command. Native does not edit lyric body text directly.
- Real keyboard/device smoke remains for Phase 6 because this review worker had no `adb` or `xcrun` runtime.

## Closeout

Review resolved with repair. Local automated gates passed, hosted CI is unavailable with evidence, manual device smoke is blocked by this Debian worker environment, and no maintainability findings remain.
