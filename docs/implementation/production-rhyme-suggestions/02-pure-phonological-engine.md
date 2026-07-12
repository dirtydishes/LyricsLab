# Phase 02: Pure Phonological Engine

Canonical Beads issue: `lyricslab-5iw.2`

Epic: `lyricslab-5iw`

Status is tracked in Beads. This document preserves accepted intent and is decision-complete, implementation-open.

## Outcome

Implement the framework-independent pronunciation, perfect/slant/multisyllabic candidate, filtering, and deterministic ranking core behind the production `RhymeEngine` interface using fixture-sized tests.

## Why This Phase Exists

Correct phonological behavior and ranking precision must be proven independently before production datasets, loading, and UI obscure failures.

## Scope

Allowed:

- Token normalization, CMU parsing, alternates, stress/syllable boundaries, perfect tails, full-tail slant alignment, stable family keys, lemma grouping, repetition analysis, casing, filtering, and deterministic ranking.
- Fixture and diagnostic adapters exposing internal score breakdowns.
- Positive, negative-control, and deterministic-ordering fixtures.

Out of scope:

- Production binary compilation/loading, React, WebView, SQLite, Expo, UI, or large production datasets.

## Constraints

- The editor-facing module exposes only `RhymeEngine` and accepted public types.
- Perfect keys begin at the last primary-stressed vowel, then secondary, then final nucleus.
- Slant score is 55% vowel, 30% coda/consonant, 15% stress; balanced slants require `>= 0.86`.
- Ranking weights and exclusions exactly match the accepted plan; no weak padding.

## Settled Decisions

Resolve every alternate pronunciation and keep the strongest valid pairing. Preserve phone sequences, syllable boundaries, and family keys for the later highlighting milestone without implementing highlighting now.

## Open Questions

None.

## Dependencies

- Depends on: `lyricslab-5iw.1`
- Parallel-safe: no

## Acceptance Evidence

Tests cover malformed CMU lines, alternate pronunciations, stress fallback, exact tails, syllable spans, slant positives and precision negatives, SUBTLEX tie-breaking limits, repetition penalties, family diversity, stable IDs, and deterministic ordering.

## Quality Gates

`npm test`; `npm run typecheck`.

## Replanning Triggers

Representative negative controls pass at the accepted threshold, the ranking formula cannot preserve deterministic precision, or the existing `SuggestionContext` cannot supply the required anchor semantics.

## Implementation Hypotheses

Use small immutable phonological value objects and indexed candidate operations, but let repository evidence determine internal types and file seams.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
