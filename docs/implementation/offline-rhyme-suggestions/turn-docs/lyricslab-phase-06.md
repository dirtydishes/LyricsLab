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
4. Added a private `WeakMap<RhymeIndex, SlantLookup>` cache in `src/rhyme/rhymeRanking.ts`. Slant queries use hydrated index data, narrow vowel/coda-family buckets, and bounded stratified bucket scans; they do not scan all lexemes on every lookup after the cache exists.
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

Thermo-nuclear reviewer pass used `/home/delta/.agents/skills/thermo-nuclear-code-quality-review/SKILL.md`.

Reviewer-owned repairs:

1. Split the slant lookup, `WeakMap` cache, scoring, and mixed candidate ranking helpers out of `src/rhyme/rhymeIndex.ts` into `src/rhyme/rhymeRanking.ts`. Final file sizes: `src/rhyme/rhymeIndex.ts` 578 lines, `src/rhyme/rhymeRanking.ts` 911 lines, so no Phase 06 runtime file crosses the 1k-line review bar.
2. Fixed mixed exact ranking so `findRhymeCandidates` applies repetition penalties before final `maxResults` slicing instead of truncating exact candidates first.
3. Fixed slant discovery so high-scoring late-bucket candidates are not missed by broad bucket prefixes. Slant lookup now tries narrow vowel+coda/family+coda and related specific keys before broad fallback keys, uses deterministic stratified scans, and only falls back to broad keys when specific buckets do not fill the requested slant budget.
4. Added fixture regressions for default mixed API behavior, exact repetition-before-slice behavior, and narrow slant bucket discovery.

Review result: repaired and approved. No findings remaining. This reviewer did not close Beads.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `ci-unavailable-with-evidence`

Evidence:

Local implementation gates:

- `npm test -- --runTestsByPath src/rhyme/__tests__/candidateRanking.integration.test.ts src/rhyme/__tests__/rhymeIndex.test.ts src/rhyme/__tests__/publicApi.test.ts src/rhyme/__tests__/runtimePrivacyGuard.test.ts src/editor/__tests__/suggestions.test.ts`: passed after review repairs, 5 suites, 48 tests.
- `npm test -- --runTestsByPath src/editor/__tests__/suggestions.test.ts src/rhyme/__tests__/candidateRanking.integration.test.ts`: passed after provider opted into mixed ranking, 2 suites, 33 tests.
- `npm run typecheck`: passed.
- `npm test`: passed after review repairs, 12 suites, 104 tests.
- `npm run editor:test`: passed, 2 files, 15 tests.
- `npm run smoke:rhyme-artifact -- --compact`: passed after review repairs; artifact fresh, 9,596,136 bytes, 125,213 lexemes, 135,166 pronunciations, 35,869 rhyme tails, 10/10 representative exact anchors hit, p50 0.075 ms, p95 0.614 ms.
- `npm run perf:rhyme-ranking -- --compact`: passed after review repairs; artifact fresh, mixed mode 600/600 hit lookups with p50 0.362 ms and p95 1.845 ms; slant-only mode 600/600 hit lookups with p50 3.499 ms and p95 9.015 ms on `deltaisland.io` / Node v22.23.1 / AMD EPYC-Genoa Processor. The `mind` slant-only sample includes repaired high-similarity candidates such as `headlined`, `mastermind`, and `nevermind`.
- `node --check scripts/perf-rhyme-ranking.mjs`: passed.
- `git diff --check`: passed.

Hosted CI evidence:

- PR: `https://github.com/dirtydishes/lyricslab/pull/21`
- Reviewer pre-push `gh pr view 21 --repo dirtydishes/lyricslab --json url,number,state,isDraft,mergeable,baseRefName,headRefName,headRefOid,statusCheckRollup,title`: open, non-draft, base `lavender/expo-clean-rebuild`, head `lavender/offline-rhyme-phase-06`, mergeable `MERGEABLE`, `statusCheckRollup` empty.
- Reviewer pre-push `gh pr checks 21 --repo dirtydishes/lyricslab`: no checks reported on the branch.
- Reviewer post-repair push `gh pr view 21 --repo dirtydishes/lyricslab --json url,number,state,isDraft,mergeable,baseRefName,headRefName,headRefOid,statusCheckRollup,title`: open, non-draft, base `lavender/expo-clean-rebuild`, head `lavender/offline-rhyme-phase-06`, head `fafbe7bef21083163915898f8cbdeaa09ca24a4b`, mergeable `MERGEABLE`, `statusCheckRollup` empty.
- Reviewer post-repair push `gh pr checks 21 --repo dirtydishes/lyricslab`: no checks reported on the branch.
- GitHub combined status for `fafbe7bef21083163915898f8cbdeaa09ca24a4b`: `statuses` empty.
- Final-head merge-tree evidence for repair commit: `git merge-tree --write-tree origin/lavender/expo-clean-rebuild HEAD` exited 0 and produced tree `da88c3844afd4536556dbdcb48c356be236dcff9`.

## PR And Commits

- PR: `https://github.com/dirtydishes/lyricslab/pull/21`
- Branch: `lavender/offline-rhyme-phase-06`
- Expected base: `lavender/expo-clean-rebuild`
- Implementation commit: `38fa93465f7c9afdf1af0aa3b2f07b108c375b5a add slant rhyme ranking guard`
- Turn-doc / PR-detail commit: `record phase six pr details`
- Review repair commit: `fafbe7bef21083163915898f8cbdeaa09ca24a4b repair phase six review findings`
- Review evidence commit: final turn-doc evidence commit on `lavender/offline-rhyme-phase-06`.
- Reviewer-observed PR state: repaired, open, non-draft, correct base/head, mergeable, hosted checks absent.

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

Closed.

- PR #21 merged into `lavender/expo-clean-rebuild` at merge commit `7b29c77598b8f0060ce80d4f46342eb28d63f3f0`.
- Final phase head: `1aac7fa4911d3f6b6700e2ef491b53f0e71bc8e8`, including the orchestrator review-callback export.
- Final reviewed head: `dc79ecd14d6899e64f23373841ddc5b154a1fa0e`.
- The `gpt-5.5`/`xhigh` closeout-selector reported `ready`, found no closeout risks, and authorized closure and continuation.
- Beads issue `lyricslab-8um.2` was closed with the merged PR, repaired thermo-nuclear review, `ci-unavailable-with-evidence`, all required gates, and no findings remaining recorded in the close reason.
- Phase 07 is not selected here; a separate selector runs after this closeout mirror is committed and pushed.
