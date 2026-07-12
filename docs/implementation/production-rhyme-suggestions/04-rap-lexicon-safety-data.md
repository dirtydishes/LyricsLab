# Phase 04: Rap Lexicon and Safety Data

Canonical Beads issue: `lyricslab-5iw.4`

Epic: `lyricslab-5iw`

Status is tracked in Beads. This document preserves accepted intent and is decision-complete, implementation-open.

## Outcome

Deliver a reviewed contemporary US hip-hop lexicon and explicit safety/proper-noun policies that improve anchor coverage without emitting unsafe unsolicited candidates.

## Why This Phase Exists

CMU-only coverage misses common writing vocabulary, while unreviewed additions and indiscriminate candidate emission create correctness and safety risks.

## Scope

Allowed:

- At least 500 reviewed entries spanning the accepted categories and regions.
- Surface form, CMU alias or direct ARPAbet, category, regional scope, evidence/provenance, and review state.
- Independent 250-case OOV gold set, ambiguous negative controls, coverage tooling, safety/proper-noun flags and tests.

Out of scope:

- G2P, fuzzy spelling, personalized vocabulary, phrase-rhyme generation, or external runtime lookup.

## Constraints

- At least 90% correct pronunciation coverage on the independent OOV set.
- Ordinary profanity is permitted.
- Maintained high-risk slurs are suppressed from unsolicited candidates but remain analyzable as typed anchors.
- Names, places, and acronyms require explicit active-prefix matching to appear as suggestions.

## Settled Decisions

The implementation team owns initial curation; the writer resolves disputed cases and later reviews ranking output. Entries cover dropped sounds, apostrophe variants, fused phrases, stylized spellings, colloquialisms, ad-libs, and common inflections.

## Open Questions

None.

## Dependencies

- Depends on: `lyricslab-5iw.3`
- Parallel-safe: no

## Acceptance Evidence

Schema validation, count and completeness checks, provenance review, independent gold-set score, ambiguous negatives, direct/alias pronunciation tests, profanity allowance, slur suppression, and proper-noun prefix tests.

## Quality Gates

`npm test`; `npm run typecheck`; `npm run build:rhyme-data`; `npm run check:rhyme-data`.

## Replanning Triggers

Provenance is insufficient, the independent OOV score remains below 90%, the review set is not meaningfully independent, or the safety policy requires a product decision absent from the plan.

## Implementation Hypotheses

Keep authored source data human-reviewable and compile it through Phase 03's deterministic pipeline; separate gold evaluation cases from training/curation decisions.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
