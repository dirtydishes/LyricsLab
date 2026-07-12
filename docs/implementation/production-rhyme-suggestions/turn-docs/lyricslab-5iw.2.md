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

## Discoveries And Decisions

- Canonical base is `lavender/expo-clean-rebuild` at `b679dcce`, containing the merged and closed Phase 01 work.
- Prepared symbolic branch `lavender/production-rhyme-phase-02` directly from that base.
- The MVP already had deterministic CMU parsing, an in-memory index, and candidate ranking, but editor code depended directly on `RhymeIndex` and finder functions. Its slant default and feature formula did not implement the accepted `0.86` balanced threshold or `55/30/15` full-tail weighting.
- The production seam is a deep synchronous `RhymeEngine.suggest(query)` interface. Editor callers now know only that interface and accepted suggestion/query types; lexicon construction, pronunciation pairing, phonological analysis, diagnostics, and the transitional MVP adapter remain behind it.
- Perfect-tail precedence is last primary stress, then last secondary stress, then final vowel nucleus. This deliberately changes the old behavior that returned no tail for entirely unstressed pronunciations.
- Stable suggestion IDs contain kind, normalized lexeme, and a phonological family key. All alternate pronunciations remain indexed; the strongest valid anchor/candidate pairing is selected with deterministic phone-sequence tie-breaks.
- Source repetition is applied by normalized lemma only when `sourceTokens` are supplied. Explicit exclusions remain hard filters and are not converted into score penalties.

## Implementation And Delegation Evidence

- Implementation task: `019f544e-6427-7a52-a128-08733f65a456` on `lavender/production-rhyme-phase-02`.
- Preflight before file access proved exact worktree `/home/delta/.codex/worktrees/1295/lyricslab`, symbolic branch `lavender/production-rhyme-phase-02`, and clean tracking status against `origin/lavender/production-rhyme-phase-02`.
- Execution strategy remained `threads`: this implementation task owns the mutable checkout and the orchestrator will launch a fresh independent strict reviewer after the implementation handoff.
- The implementation inspected the MVP seams first, preserved the existing native suggestion-provider seam, and introduced a narrow legacy adapter rather than teaching editor code about index artifacts.

## Changed Behavior And Files

- `src/rhyme/RhymeEngine.ts`, `src/rhyme/public.ts`: accepted editor-facing engine, query, suggestion, kind, and score types only.
- `src/rhyme/createRhymeEngine.ts`: immutable fixture-sized lexicon indexing, alternate pairing, lemma grouping, exclusions, current-song repetition analysis, exact/slant/multisyllabic/commonness scoring, stable IDs, casing, deterministic ordering, and score diagnostics.
- `src/rhyme/productionPhonology.ts`: pronunciation analysis, syllable spans, stable family keys, full-tail alignment, and the accepted `55%` vowel, `30%` coda/consonant, `15%` stress slant score.
- `src/rhyme/rhymeEngineTesting.ts`: fixture and diagnostic construction adapters without production data dependencies.
- `src/rhyme/legacyRhymeEngineAdapter.ts`: transitional adapter keeping the bundled MVP index behind `RhymeEngine`; it does not widen the public editor seam.
- `src/rhyme/rhymeTail.ts`: primary, then secondary, then final-nucleus tail fallback.
- `src/rhyme/cmuParser.ts`: malformed headword/phone lines are ignored; CMU vowel stress and consonant shape are validated while alternates remain preserved.
- `src/editor/suggestions.ts`, `src/editor/bundledSuggestionProvider.ts`: suggestion callers depend on `RhymeEngine`, while fallback, anchor, exclusion, prefix-filter, and provider behavior remain stable.
- `src/rhyme/__tests__/productionRhymeEngine.test.ts`, `src/rhyme/__tests__/productionBoundary.test.ts`: focused controls for weights, threshold positives/negatives, alternates, spans, commonness limits, lemma grouping, family diversity, exclusions, repetition, IDs, ordering, casing, and forbidden dependencies.
- Existing CMU, tail, index, public API, and editor-provider tests were updated for the accepted final-nucleus fallback and engine seam.
- No React, React Native, WebView, SQLite, Expo, UI, network, generated production artifact, or large-dataset dependency was added to the production core.

## Review

Pending the fresh independent `thermo-nuclear-code-quality-review` task owned by the orchestrator. The implementation self-check found no remaining in-scope blocker; the reviewer should challenge full-tail alignment, deterministic tie-breaks, family-key stability, and the transitional adapter boundary.

## CI And Gates

Owner: delegated Phase 02 implementation task, then independent review task

State: `ci-unavailable-with-evidence`

Evidence:

- `npm test` — passed: 18 suites, 138 tests, 0 snapshots.
- `npm run typecheck` — passed with `tsc --noEmit` and no diagnostics.
- Focused command covering production engine, boundary, tail, parser, and editor provider — passed: 5 suites, 43 tests.
- Deterministic repetition and reversed-input controls execute repeated identical queries, apply the exact `0.12` lemma repetition penalty, and compare forward versus reversed lexicon construction.
- Forbidden-import control scans the production core import graph for React, React Native, WebView, SQLite, Expo, network clients, and the generated CMU artifact; passed.
- `git diff --check` — passed.
- Hosted state: `ci-unavailable-with-evidence`. This repository/base contains no checked-in `.github` workflow files, and `gh pr list --state all --base lavender/expo-clean-rebuild --head lavender/production-rhyme-phase-02 ...` failed with `error connecting to api.github.com` under the task's restricted network. No implementation PR exists from this uncommitted read-only worktree; hosted CI and PR inspection transfer explicitly to the orchestrator and then the independent reviewer.

## PR And Commits

- Branch: `lavender/production-rhyme-phase-02`, tracking `origin/lavender/production-rhyme-phase-02` at preparation commit `c6c863ab` before the implementation working tree.
- Implementation commits: none from this task because the delegated worktree Git index and metadata are read-only.
- PR: not created from this task. Orchestrator action required: commit the complete working tree with lowercase human commit message(s), push `lavender/production-rhyme-phase-02`, then open exactly one PR with explicit `--base lavender/expo-clean-rebuild --head lavender/production-rhyme-phase-02` (or update the exact-head PR if one becomes visible).

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.1`.

- `.beads/issues.jsonl` records `lyricslab-5iw.2` as `in_progress`; this task did not close or mutate Beads.
- Phase 03 should consume the production construction seam behind `RhymeEngine` when it adds compiled data/loading; it must not expose artifact or loader types to editor callers.
- No new follow-up issue is recommended from implementation evidence. Independent review findings, if any, should remain Phase 02 repairs unless they belong to an already-planned later phase.

## Plan Amendments

None.

## Context To Keep

Fixture adapters may expose diagnostics, but editor callers must not learn artifact/index details.

The bundled provider intentionally uses `createLegacyRhymeEngineAdapter` until the later production data/loading phase replaces its backing implementation; this is containment, not the production scorer path.

## Closeout

Implementation source and local evidence complete. Commit, push, explicit PR creation, hosted inspection, and independent review remain orchestrator-owned because this task's Git metadata is read-only and GitHub API access is unavailable.
