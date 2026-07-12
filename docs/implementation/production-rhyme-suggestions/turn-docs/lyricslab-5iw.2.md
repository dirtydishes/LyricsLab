# Phase 02 Turn Doc: Pure Phonological Engine

Beads issue: `lyricslab-5iw.2`

Phase doc: `docs/implementation/production-rhyme-suggestions/02-pure-phonological-engine.md`

## Accepted Outcome

Build and verify the framework-independent pronunciation, perfect/slant/multisyllabic, filtering, and deterministic ranking core behind `RhymeEngine`.

## Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.2",
  "risk": "high",
  "strategy": "threads",
  "implementation_owner": "visible delegated implementation task on lavender/production-rhyme-phase-02",
  "review_independence": "fresh visible reviewer task using thermo-nuclear-code-quality-review after implementation",
  "delegation_plan": [
    "inspect the existing MVP rhyme seams and implement the production pure phonological core with fixture-sized tests",
    "independently review scoring, determinism, precision controls, module boundaries, tests, and CI evidence"
  ],
  "model_and_effort_rationale": "Use standard task speed and high reasoning because the phase is algorithmically dense, threshold-sensitive, and must preserve a deep framework-independent module boundary.",
  "required_evidence": [
    "symbolic branch and worktree preflight",
    "normalization/CMU/alternate/stress/syllable fixtures",
    "perfect and full-tail slant positive and negative controls",
    "0.86 balanced-slant threshold enforcement",
    "deterministic ranking, IDs, grouping, exclusions, and score breakdowns",
    "no React, WebView, SQLite, or Expo dependencies",
    "npm test and npm run typecheck",
    "independent strict review and terminal CI state"
  ],
  "user_constraints": [
    "run task remains orchestrator-only",
    "standard task speed; no fast mode",
    "exactly one final callback per delegated task to 019f5428-f2ea-74c2-abfb-e37349c96391",
    "one active implementation PR and one owner per mutable checkout"
  ]
}
```

## Adaptations

- The prepared worktree has no local root `node_modules`; gates used a temporary symlink to the already-installed canonical checkout dependencies. The symlink is not an implementation change and is removed before handoff.
- Git metadata at `/home/delta/dev/lyricslab/.git/worktrees/lyricslab4` and its index are read-only in this task sandbox. Per the delegation contract, this task completed source, tests, and documentation without waiting for approval; the orchestrator must commit, push, and create the PR from the completed working tree.
- `bd prime` succeeded, but `bd show lyricslab-5iw.2` could not acquire the read-only Dolt lock. Beads context was read from `.beads/issues.jsonl`; canonical status remains orchestrator-owned and unchanged.
- Independent review task `019f545e-5e11-7ae3-bc41-ca7645895eb7` also found the prepared worktree Git index read-only. It completed all review-time source, test, and turn-doc repairs for orchestrator commit/push rather than attempting a Git-state workaround.

## Discoveries And Decisions

- Canonical base is `lavender/expo-clean-rebuild` at `b679dcce`, containing the merged and closed Phase 01 work.
- Prepared symbolic branch `lavender/production-rhyme-phase-02` directly from that base.
- The MVP already had deterministic CMU parsing, an in-memory index, and candidate ranking, but editor code depended directly on `RhymeIndex` and finder functions. Its slant default and feature formula did not implement the accepted `0.86` balanced threshold or `55/30/15` full-tail weighting.
- The production seam is a deep synchronous `RhymeEngine.suggest(query)` interface. Editor callers now know only that interface and accepted suggestion/query types; lexicon construction, pronunciation pairing, phonological analysis, diagnostics, and the transitional MVP adapter remain behind it.
- Perfect-tail precedence is last primary stress, then last secondary stress, then final vowel nucleus. This deliberately changes the old behavior that returned no tail for entirely unstressed pronunciations.
- Stable suggestion IDs preserve the established `rhyme:<kind>:<normalized-word>` shape; phonological family remains separate metadata so alternate pairing cannot churn list identity. All alternate pronunciations remain indexed, and the strongest valid pairing is selected with deterministic phone-sequence tie-breaks.
- Source repetition is applied by normalized lemma only when `sourceTokens` are supplied. Explicit exclusions remain hard filters and are not converted into score penalties.

## Implementation And Delegation Evidence

- Implementation task: `019f544e-6427-7a52-a128-08733f65a456` on `lavender/production-rhyme-phase-02`.
- Preflight before file access proved exact worktree `/home/delta/.codex/worktrees/1295/lyricslab`, symbolic branch `lavender/production-rhyme-phase-02`, and clean tracking status against `origin/lavender/production-rhyme-phase-02`.
- Execution strategy remained `threads`: this implementation task owns the mutable checkout and the orchestrator will launch a fresh independent strict reviewer after the implementation handoff.
- The implementation inspected the MVP seams first, preserved the existing native suggestion-provider seam, and introduced a narrow legacy adapter rather than teaching editor code about index artifacts.

## Changed Behavior And Files

- `src/rhyme/RhymeEngine.ts`: the single accepted editor-facing engine, query, suggestion, kind, and score type module. Independent review removed the redundant pass-through `src/rhyme/public.ts` barrel.
- `src/rhyme/createRhymeEngine.ts`: immutable fixture-sized lexicon indexing, alternate pairing, lemma grouping, exclusions, current-song repetition analysis, exact/slant/multisyllabic/commonness scoring, stable IDs, casing, deterministic ordering, and score diagnostics.
- `src/rhyme/productionPhonology.ts`: pronunciation analysis, syllable spans, stable family keys, vowel-segment-aware full-tail alignment, dynamic consonant-cluster alignment, and the accepted `55%` vowel, `30%` coda/consonant, `15%` stress slant score.
- `src/rhyme/rhymeEngineTesting.ts`: fixture and diagnostic construction adapters without production data dependencies.
- `src/rhyme/legacyRhymeEngineAdapter.ts`: transitional adapter keeping the bundled MVP index behind `RhymeEngine`; it does not widen the public editor seam.
- `src/rhyme/rhymeTail.ts`: primary, then secondary, then final-nucleus tail fallback.
- `src/rhyme/cmuParser.ts`: malformed headword/phone lines are ignored; CMU vowel stress, consonant shape, numeric positive alternate suffixes, and non-nested headwords are validated while valid alternates remain preserved.
- `src/editor/suggestions.ts`, `src/editor/bundledSuggestionProvider.ts`: suggestion callers depend on `RhymeEngine`, while fallback, anchor, exclusion, prefix-filter, and provider behavior remain stable.
- `src/rhyme/__tests__/productionRhymeEngine.test.ts`, `src/rhyme/__tests__/productionBoundary.test.ts`: focused controls for weights, threshold positives/negatives, alternates, spans, commonness limits, lemma grouping, family diversity, exclusions, repetition, IDs, ordering, casing, and forbidden dependencies.
- Existing CMU, tail, index, public API, and editor-provider tests were updated for the accepted final-nucleus fallback and engine seam.
- No React, React Native, WebView, SQLite, Expo, UI, network, generated production artifact, or large-dataset dependency was added to the production core.

## Review

Independent review task: `019f545e-5e11-7ae3-bc41-ca7645895eb7`

Skill: `thermo-nuclear-code-quality-review`

Status: `repaired`; no in-scope findings remain.

Findings and repairs:

- The original “full-tail” scorer flattened vowels and consonants independently, allowing consonants moved across vowel boundaries to score as a perfect phonetic match. Scoring now preserves vowel-delimited tail segments and aligns consonant clusters within each segment with a deterministic global alignment; crossing a vowel boundary is a precision rejection.
- Phonetic similarity was rounded to three decimals before thresholding, so a raw `0.8596` could pass as `0.860`. Threshold comparison now uses the unrounded score, with a pinned negative control proving every raw score below `0.86` is rejected.
- Surface exclusions did not resolve indexed inflections to lemmas, allowing an excluded form to reappear through a sibling form. Exclusions now carry both normalized-word and resolved-lemma sets.
- `createRhymeEngine` typed diagnostics away but returned `diagnose` at runtime. The production object now exposes only `suggest`; diagnostics remain confined to the explicit fixture/diagnostic constructor.
- Omitted `maxResults` silently truncated the new engine to 12, contradicting the editor provider's filter-before-limit contract. Omission is now uncapped and explicit finite limits remain deterministic.
- IDs embedded the selected pronunciation family, creating churn across alternate pairings and diverging from the contained legacy adapter. IDs now preserve `rhyme:<kind>:<normalized-word>`, with family data retained in `familyKey`.
- Malformed alternate suffixes, invalid/empty lemmas, non-finite commonness, and mixed-case anchors had unsafe or surprising fallbacks. Parser and metadata normalization now reject or normalize those cases deterministically.
- Maintainability repairs removed the redundant public barrel, identity fixture wrappers, duplicated vowel inventory, a delimiter-built sort key, and a dead stress helper. The forbidden-import test now walks the real transitive TypeScript import graph, including the legacy adapter's dependencies.
- `createLegacyRhymeEngineAdapter` remains a contained transitional boundary: only the bundled provider constructs it; editor suggestion code imports only `RhymeEngine` types and cannot see `RhymeIndex` or artifact details.

## CI And Gates

Owner: delegated Phase 02 implementation task, then independent review task

State: `ci-unavailable-with-evidence`

Evidence:

- `npm test` — review-final passed: 18 suites, 146 tests, 0 snapshots.
- `npm run typecheck` — passed with `tsc --noEmit` and no diagnostics.
- Focused command covering production engine, transitive boundary, tail, parser, and editor provider — review-final passed: 5 suites, 51 tests.
- Deterministic controls cover repeated identical queries, reversed lexicon construction, reversed pronunciation order, stable IDs, exact `0.12` lemma repetition penalties, and explicit/omitted result limits.
- Forbidden-import control recursively scans the production and transitional adapter import graph for React, React Native, WebView, SQLite, Expo, network clients, and the generated CMU artifact; passed.
- `git diff --check` — passed.
- Local mergeability evidence: `origin/lavender/expo-clean-rebuild` is an ancestor of PR head `d75873e4`; local divergence is `0 3`, with no base-side divergence.
- Hosted state: `ci-unavailable-with-evidence`. The repository contains no checked-in `.github` workflow files. Review-final `gh pr view 24 ...` and `gh pr checks 24` both failed with `error connecting to api.github.com` under the task's restricted network. GitHub mergeability/check conclusions therefore remain unavailable; the orchestrator owns the post-push hosted recheck.

## PR And Commits

- Branch: `lavender/production-rhyme-phase-02`, tracking `origin/lavender/production-rhyme-phase-02`.
- Preparation commit: `c6c863ab` (`prepare production rhyme phase two`).
- Implementation commit: `50d15c6d` (`build production rhyme engine core`), committed and pushed by the orchestrator after the delegated task returned its complete working tree.
- PR: [#24](https://github.com/dirtydishes/lyricslab/pull/24), opened as exactly one PR with explicit base `lavender/expo-clean-rebuild` and head `lavender/production-rhyme-phase-02`.
- Review began at PR head `d75873e4` (`record phase two pull request`). Review repairs are complete in the working tree but uncommitted because Git metadata is read-only; the orchestrator must commit and push them to the same PR before hosted reinspection.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.1`.

- `.beads/issues.jsonl` records `lyricslab-5iw.2` as `in_progress`; this task did not close or mutate Beads.
- Phase 03 should consume the production construction seam behind `RhymeEngine` when it adds compiled data/loading; it must not expose artifact or loader types to editor callers.
- No new follow-up issue is recommended from implementation evidence. Independent review findings, if any, should remain Phase 02 repairs unless they belong to an already-planned later phase.

## Plan Amendments

None.

## Context To Keep

Fixture adapters may expose diagnostics, but editor callers must not learn artifact/index details.

The bundled provider intentionally uses `createLegacyRhymeEngineAdapter` until the later production data/loading phase replaces its backing implementation; this is containment, not the production scorer path. Stable suggestion IDs now match across that transition.

## Closeout

Implementation and strict independent review are complete locally. The repaired working tree is green with no remaining in-scope findings. Review repair commit/push, hosted reinspection, merge, and Beads closeout remain orchestrator-owned.
