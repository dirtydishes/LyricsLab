# Phase 06 Turn Doc: Slant Ranking And Performance Guard

Beads issue: `lyricslab-8um.2`

Phase doc: `docs/implementation/offline-rhyme-suggestions/06-slant-ranking-performance-guard.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by the orchestrator for Beads issue `lyricslab-8um.2` after Phase 05 closeout.

Implementation preflight:

- `pwd`: `/home/delta/dev/lyricslab`
- `git rev-parse --show-toplevel`: `/home/delta/dev/lyricslab`
- `git symbolic-ref --short HEAD`: `lavender/offline-rhyme-phase-06`
- `git status --short --branch`: `## lavender/offline-rhyme-phase-06...origin/lavender/offline-rhyme-phase-06` plus the expected pre-existing `.beads/issues.jsonl` export modification from the orchestrator restart note.
- Live Beads status confirmed `lyricslab-8um.2` is `IN_PROGRESS`, assigned to `delta`, depends on closed Phase 05 issue `lyricslab-gg4`, and blocks Phase 07.
- Existing phase doc: `docs/implementation/offline-rhyme-suggestions/06-slant-ranking-performance-guard.md`
- Prior phase context: Phase 05 closed after native provider integration, leaving `src/editor/suggestions.ts` as the canonical provider-policy seam and `src/editor/bundledSuggestionProvider.ts` as the thin CMU-backed runtime adapter.

## Scope

Add slant-aware ranking and performance evidence without slowing the default test suite or typing path.

Keep the phase bounded to ranking and evidence:

- Allowed: deterministic slant scoring, matched-syllable count, stress compatibility, repetition penalty, short reason labels if the current contract already supports them, focused ranking tests, and a non-default performance harness.
- Out of scope: bridge widening, WebView decorations, neural reranking, user-teachable preferences, phrase or mosaic rhyme expansion beyond tiny natural fallout from the existing model, and default-test full-artifact loading.

## Implementation Log

Integrated implementation:

1. Kept `findExactRhymeCandidates` exact-only and shape-stable. The existing exact candidate snapshots still contain only `id`, `kind`, `word`, `normalizedWord`, `rhymeTailKey`, `score`, and `slantSimilarity`.
2. Added additive mixed ranking through `findRhymeCandidates`. Mixed results include exact candidates plus bounded slant candidates, with deterministic metadata for `matchedSyllables`, `stressCompatibility`, and `repetitionPenalty`.
3. Added pure ARPAbet helpers in `src/rhyme/rhymeTail.ts` for vowel/stress parsing, syllable nuclei/counting, and tail comparison. No raw CMU parsing or generated artifact schema changes were added.
4. Added a private `WeakMap<RhymeIndex, SlantLookup>` cache in `src/rhyme/rhymeIndex.ts`. Slant queries use hydrated index data and bounded bucket scans; they do not scan all lexemes on every lookup after the cache exists.
5. Updated `src/editor/suggestions.ts` to use `findRhymeCandidates` by default while preserving the Phase 05 provider seam: early no-index guards, previous-token-first anchors, active-word fallback, deterministic fallback suggestions, active-prefix filtering before slicing, and `WordSuggestion` mapping.
6. Kept `src/editor/bundledSuggestionProvider.ts` unchanged as the thin runtime adapter over `getBundledCmuRhymeIndex`.
7. Added fixture-sized Jest coverage for exact API stability, exact-plus-slant ordering, matched syllables, stress compatibility, repetition penalty, public API exports, runtime privacy, provider guards, and slant fill-in behavior.
8. Added non-default `npm run perf:rhyme-ranking`, which checks artifact freshness and measures representative `findRhymeCandidates` lookups in mixed and slant-only modes.

### Slice Synthesis

Coherent slice plan used:

- `phonology-substrate`: ARPAbet vowel, stress, syllable, and tail comparison helpers.
- `mixed-candidate-api`: additive `findRhymeCandidates` public API while preserving exact API semantics.
- `slant-cache-ranker`: bounded slant lookup cache and deterministic scoring/tie-breaks.
- `provider-ranking`: provider default moves to mixed candidates without bridge/UI widening.
- `fixture-tests`: fast fixture tests for ranking behavior and provider guards.
- `performance-harness`: explicit full-artifact timing command outside default Jest.
- `turn-doc-pr-packaging`: record swarm, gates, PR, and callback evidence in this existing turn doc.

## Subagent Swarms

Implementation worker swarm counts:

- Scout agents: 8
- Slice-plan agents: 8
- Implementation-helper agents: 8
- Used less than default reason: none.

Scout synthesis:

- Preserve `findExactRhymeCandidates` as exact-only and add a sibling mixed API instead of overloading exact semantics with slants.
- Derive syllable and stress metadata from existing ARPAbet phones at index hydration/cache time; avoid generated artifact v2 unless performance evidence demands it.
- Keep reason/label data inside the existing provider contract only. `WordSuggestion.label` is safe only when it includes the insertable word because `SuggestionBar` renders label instead of word.
- Keep `src/editor/suggestions.ts` as the canonical provider-policy seam and keep the bundled provider thin.
- Make full-artifact timing non-default and keep default Jest fixture-sized.

Slice-plan synthesis:

- Land seven bounded slices: phonology helpers, mixed API, bounded slant cache/ranker, provider mapping, fixture tests, non-default performance harness, and turn-doc/PR packaging.
- Let exact candidates sort before slants; slants rank by deterministic phonetic similarity, matched syllables, stress compatibility, repetition penalty, and stable lexical tie-breaks.
- Treat provider `excludedWords` as hard exclusions and `sourceTokens` as a soft repetition penalty in the mixed API.
- Do not add neural models, user-taught preferences, phrase/mosaic expansion, WebView messages, decorations, or bridge metadata.

Implementation-helper synthesis:

- H1 added pure ARPAbet phonology helpers in `src/rhyme/rhymeTail.ts`.
- H2/H3 added the mixed candidate API, bounded slant cache, and deterministic ranker in `src/rhyme/rhymeIndex.ts` and `src/rhyme/index.ts`.
- H4/H6 wired and tested the provider seam without touching bridge/UI code.
- H5 added fixture-sized ranking, public API, and runtime privacy tests.
- H7 added `scripts/perf-rhyme-ranking.mjs`, `perf:rhyme-ranking`, and testing docs.
- H8 prepared this turn doc; the lead worker integrated and repaired the final combined diff.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Pending.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `not-run`

Evidence:

Local implementation gates:

- `npm test -- --runTestsByPath src/rhyme/__tests__/candidateRanking.integration.test.ts src/rhyme/__tests__/rhymeIndex.test.ts src/rhyme/__tests__/publicApi.test.ts src/rhyme/__tests__/runtimePrivacyGuard.test.ts src/editor/__tests__/suggestions.test.ts`: passed, 5 suites, 45 tests.
- `npm test -- --runTestsByPath src/editor/__tests__/suggestions.test.ts src/rhyme/__tests__/candidateRanking.integration.test.ts`: passed after provider opted into mixed ranking, 2 suites, 33 tests.
- `npm run typecheck`: passed.
- `npm test`: passed, 12 suites, 101 tests.
- `npm run editor:test`: passed, 2 files, 15 tests.
- `npm run smoke:rhyme-artifact -- --compact`: passed; artifact fresh, 9,596,136 bytes, 125,213 lexemes, 135,166 pronunciations, 35,869 rhyme tails, 10/10 representative exact anchors hit, p50 0.082 ms, p95 5.971 ms.
- `npm run perf:rhyme-ranking -- --compact`: passed; artifact fresh, mixed mode 600/600 hit lookups with p50 0.065 ms and p95 0.143 ms; slant-only mode 600/600 hit lookups with p50 2.868 ms and p95 8.163 ms on `deltaisland.io` / Node v22.23.1 / AMD EPYC-Genoa Processor.
- `node --check scripts/perf-rhyme-ranking.mjs`: passed.
- `git diff --check`: passed.

Hosted CI placeholder:

- PR checks: `TODO`
- If hosted checks are unavailable, record `ci-unavailable-with-evidence` with PR metadata and check output instead of treating missing checks as green.

## PR And Commits

- PR: `TODO`
- Branch: `lavender/offline-rhyme-phase-06`
- Expected base: `lavender/expo-clean-rebuild`
- Implementation commit: `TODO`
- Turn-doc / PR-detail commit: `TODO`
- Review repair commit: `TODO` if applicable.
- Reviewer-observed PR state: `TODO`

## Beads Updates

No Beads closeout by this implementation worker. The branch preserves the orchestrator's Phase 06 `.beads/issues.jsonl` export/restart note.

## Follow-Ups Filed

None.

## Context To Keep

- Ranking should be deterministic and explainable.
- Performance harness must be non-default if slow.
- Preserve the existing native suggestion provider contract.
- Do not add highlight spans, bridge messages, or WebView decoration work in this phase.
- Keep generated CMU artifact loading out of default Jest unless a reviewer explicitly approves a bounded exception.
- Record representative lookup timing only through opt-in evidence, not every typing refresh.

## Closeout

Open.
