# Phase 01: Foundation, Theme, and Editor Contract

Canonical Beads issue: `lyricslab-5iw.1`

Epic: `lyricslab-5iw`

Status is tracked in Beads. This document preserves accepted intent and is decision-complete, implementation-open.

## Outcome

Establish persisted System/Light/Dark theming, Settings visibility for engine state, end-to-end native/WebView theme propagation, prefix-replacement insertion semantics, and generated-editor freshness protection without widening the bridge envelope.

## Why This Phase Exists

The engine and result roles need a stable editor-facing contract and accessible visual system before phonological and data work begins.

## Scope

Allowed:

- Semantic theme tokens and the specified role colors/main text colors.
- A separate SQLite-backed `SettingsRepository` with `System` default.
- Settings route for theme, engine status/version, retry, and diagnostics visibility.
- Native, status-bar, WebView `setTheme`, and suggestion-bar propagation.
- Internal prefix replacement with exactly one trailing space.
- Generated-editor freshness checking and focused contract tests.

Out of scope:

- Rhyme scoring/data implementation, UI result integration, diagnostics implementation, highlighting, or any deferred milestone.

## Constraints

- Keep preferences out of song rows.
- Preserve the narrow bridge envelope; insertion behavior changes internally.
- Verified label/word combinations must meet WCAG 4.5:1.
- Theme behavior covers every native and WebView surface.

## Settled Decisions

Pills show one discreet label above the word. Two or more matched syllables use `2-syllable`, `3-syllable`, etc.; otherwise use `Perfect`, `Near`, or neutral `Prompt`. Use the exact accepted light/dark colors.

## Open Questions

None.

## Dependencies

- Depends on: none
- Parallel-safe: no

## Acceptance Evidence

Persistence tests, theme-resolution tests, native/WebView synchronization evidence, contrast verification, prefix-replacement/casing/selection/trailing-space tests, and generated-editor freshness evidence.

## Quality Gates

`npm test`; `npm run typecheck`; `npm run editor:test`; `npm run build:editor-html`; `npx expo config --type public`.

## Replanning Triggers

The canonical base lacks the Expo/WebView editor/provider prerequisites, the existing bridge cannot preserve its envelope, or the specified contrast cannot be achieved without changing accepted colors.

## Implementation Hypotheses

Validate the existing repository/provider/theme seams first. Prefer a small semantic token layer and repository abstraction over coupling preferences to screen components.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
