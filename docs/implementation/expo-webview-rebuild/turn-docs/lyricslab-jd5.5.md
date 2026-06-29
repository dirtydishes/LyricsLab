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

## Subagent Swarms

None. This worker kept the phase implementation single-threaded and did not launch review threads.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Not started.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: local implementation gates passed; reviewer-owned CI not started.

Evidence:

- Initial `npm --prefix apps/mobile test -- suggestions.test.ts` failed before dependency install because `jest` was not present in `apps/mobile/node_modules` (`sh: 1: jest: not found`).
- `npm --prefix apps/mobile ci` passed. npm reported existing peer/deprecation/audit warnings, but installed the lockfile dependencies successfully.
- `npm --prefix apps/mobile test -- suggestions.test.ts` passed: 1 test suite, 4 tests.
- `npm --prefix apps/mobile run typecheck` passed (`tsc --noEmit`).
- `npm --prefix apps/mobile test` passed: 4 test suites, 19 tests.
- Manual/device smoke for body editor focus, keyboard appearance, bar appearance, horizontal scrolling, repeated taps at the visible cursor, and keyboard/focus stability was not feasible in this Debian worker: `command -v adb` exited 1 and `command -v xcrun` exited 1, so there was no Android device/emulator or iOS toolchain path available. Closest automated evidence is the provider test coverage, bridge command injection test coverage, mobile typecheck, and full mobile Jest suite.

## PR And Commits

Implementation branch: `lavender/lyricslab-jd5-5-keyboard-suggestions-insertion`

PR: pending push/open.

Commits: pending.

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.5` `in_progress` after selector chose it as the next ready phase.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 5 owns keyboard suggestions and insertion. Phase 6 owns offline bundling and final viability gate.
- Quality gates: suggestion provider tests, mobile typecheck, manual smoke for focus body editor, keyboard/bar appearance, horizontal scrolling, and repeated taps inserting at the visible cursor while focus/keyboard remain stable when feasible.
- Native suggestion taps call `EditorWebView.insertSuggestion(word)`, which injects the existing WebView `window.LyricsLabEditor.insertSuggestion({ word })` command. Native does not edit lyric body text directly.
- Real keyboard/device smoke remains for review or Phase 6 because this worker had no `adb` or `xcrun` runtime available.

## Closeout

Implementation gates passed locally; draft PR pending.
