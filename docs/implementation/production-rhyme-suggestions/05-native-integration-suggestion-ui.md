# Phase 05: Native Integration and Suggestion UI

Canonical Beads issue: `lyricslab-5iw.5`

Epic: `lyricslab-5iw`

Status is tracked in Beads. This document preserves accepted intent and is decision-complete, implementation-open.

## Outcome

Replace the static provider with background-initialized production rhyme suggestions and an accessible compact two-line semantic-role pill UI while preserving responsive editing and narrow bridge contracts.

## Why This Phase Exists

The reviewed engine and artifact must become a resilient suggestion-first writing experience without allowing asynchronous work or visual polish to destabilize editing.

## Scope

Allowed:

- App-level engine initialization, provider integration, `bodyText` repetition input, anchor/prefix caching, stale-result protection, prompt/loading/error behavior, Settings retry/status, casing, filtering, and the semantic-role pill UI.
- Dynamic Type, VoiceOver, minimum targets, pressed/focus states, reduced motion, and a brief 150-200 ms prompt-to-result crossfade.

Out of scope:

- New bridge messages, rhyme metadata payloads, highlight spans, decorative motion, persistent analysis, lyric logging, or diagnostics route implementation.

## Constraints

- Replace `staticSuggestionProvider` behind the existing provider seam.
- Expensive candidates recompute only when the completed anchor changes; prefix filtering stays cheap.
- Stale async initialization/results cannot replace newer state.
- Return no more than eight trustworthy results and never pad weak rhymes.
- Editing continues during loading/failure with deterministic prompts and subtle unavailable state.

## Settled Decisions

Anchor on the nearest completed token, keep it stable during the partial next word, apply prefix filtering only when a valid rhyme survives, hide on non-empty selection, and insert by replacing the prefix with exactly one trailing space.

## Open Questions

None.

## Dependencies

- Depends on: `lyricslab-5iw.4`
- Parallel-safe: no

## Acceptance Evidence

Provider/UI tests cover loading, ready, failure, retry, stale state, prompts, anchor stability, prefix filtering fallback, repetition, casing, selection hiding, replacement/trailing space, semantic roles, accessibility labels, Dynamic Type, theme contrast, reduced motion, and responsive typing.

## Quality Gates

`npm test`; `npm run typecheck`; `npm run editor:test`; `npm run build:editor-html`; `npx expo config --type public`.

## Replanning Triggers

The existing provider seam cannot carry the accepted input/output without bridge widening, async loading blocks editing, or accessible two-line pills cannot fit supported Dynamic Type sizes without a product change.

## Implementation Hypotheses

Keep policy in the canonical native provider and make the production artifact adapter thin. Use anchor-keyed memoization and monotonic request/version guards, subject to repository evidence.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
