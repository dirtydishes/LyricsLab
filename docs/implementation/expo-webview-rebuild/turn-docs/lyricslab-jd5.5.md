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

Not started.

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

Not started.

## PR And Commits

Not started.

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.5` `in_progress` after selector chose it as the next ready phase.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 5 owns keyboard suggestions and insertion. Phase 6 owns offline bundling and final viability gate.
- Quality gates: suggestion provider tests, mobile typecheck, manual smoke for focus body editor, keyboard/bar appearance, horizontal scrolling, and repeated taps inserting at the visible cursor while focus/keyboard remain stable when feasible.

## Closeout

Not started.
