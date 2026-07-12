# Phase 04 Turn Doc: Rap Lexicon and Safety Data

Beads issue: `lyricslab-5iw.4`

Phase doc: `docs/implementation/production-rhyme-suggestions/04-rap-lexicon-safety-data.md`

## Accepted Outcome

Curate at least 500 reviewed contemporary US hip-hop forms and prove the 90% independent OOV, safety, profanity, and proper-noun policies.

## Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.4",
  "risk": "high",
  "strategy": "threads",
  "implementation_owner": "visible delegated source-curation task on lavender/production-rhyme-phase-04",
  "review_independence": "fresh independent evaluation task creates the sealed 250-case OOV set after source curation; a separate fresh reviewer then uses thermo-nuclear-code-quality-review",
  "delegation_plan": [
    "author and validate at least 500 project-owned reviewed rap entries plus safety and proper-noun source manifests without seeing the later acceptance set",
    "independently author the 250-case OOV gold set and measure coverage/negative controls after curation ownership returns",
    "strictly review provenance, policy behavior, evaluation independence, maintainability, tests, and CI evidence"
  ],
  "model_and_effort_rationale": "Use standard task speed and xhigh reasoning because regional language coverage, pronunciation evidence, safety policy, and evaluation independence require careful editorial and technical judgment; fast mode remains disabled.",
  "required_evidence": [
    "symbolic branch and worktree preflight",
    "at least 500 unique reviewed entries with surface, pronunciation/alias, category, region, provenance, and review state",
    "project-owned safety and proper-noun policy manifests",
    "schema/count/completeness and direct/alias pronunciation controls",
    "sealed independent 250-case OOV evaluation at or above 90 percent with ambiguous negatives",
    "ordinary profanity allowance, high-risk unsolicited suppression, and analyzable-anchor behavior",
    "proper-noun explicit-prefix behavior",
    "npm test, npm run typecheck, npm run check:rhyme-sources, strict review, and terminal CI state"
  ],
  "user_constraints": [
    "run task remains orchestrator-only",
    "standard delegated-task speed; no fast mode",
    "exactly one final callback per delegated task to 019f5428-f2ea-74c2-abfb-e37349c96391",
    "one active implementation PR and one owner per mutable checkout",
    "do not assemble the production binary or activate the provider in Phase 04",
    "do not tune source curation against the sealed acceptance set without disclosure"
  ]
}
```

## Adaptations

- User-approved 2026-07-12 sequence amendment keeps this phase focused on human-reviewable project-owned rap, safety, and proper-noun sources. New Phase 04A owns the external-source pins, NOTICE, and complete production artifact.
- Source curation and the sealed evaluation remain separate owners. This turn created, inspected, and validated only the curation corpus; it did not create, inspect, anticipate, or tune against the later 250-case set and makes no 90% coverage claim.
- The independent evaluation task was forked before Phase 04 and observed the sealed-set information barrier. It authored and persisted all 250 cases before reading this turn doc, `data/rhyme-sources/**`, `scripts/rhyme-sources/**`, `src/rhymeSources/**`, the Phase 04 diff, PR, corpus counts, policies, or hashes. No curation file was changed after the barrier opened.

## Discoveries And Decisions

Approved sequence amendment: `lyricslab-5iw.4a` now follows this issue, and native integration waits for that production artifact phase.

- Dropped final sounds cannot truthfully reuse the full CMU `-ing` pronunciation as an alias. Those records therefore carry direct ARPAbet with final `NG` removed. The existing repository `data/cmudict.txt` bytes at SHA-256 `81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22` were used only as a local transcription-validation aid; Phase 03 already established that the file has no exact upstream revision or retained notice. It was not newly acquired, pinned, copied into the source corpus, or claimed as a production source. Phase 04A must revalidate all 25 aliases and any CMU-assisted direct transcription against its exact licensed pin.
- Regional scopes are project-authored editorial relevance tags, not claims of linguistic origin or exclusivity. Category evidence records say so explicitly rather than inventing third-party provenance or licensing.
- Normalization removes edge apostrophes, so apostrophe-marked and unmarked spellings that collapse to one engine token cannot both be compiled. The catalog keeps one reviewed surface per normalized form and records its displayed category.
- High-risk spellings exist only in the narrowly necessary lexicon records. The policy manifest refers to five opaque maintained IDs; ordinary profanity remains `rap`-eligible and is not safety-blocked.
- Proper-name/place/acronym entries are a 25-entry maintained subset. Their dormant pure policy requires a non-empty normalized prefix for suggestions while keeping them analyzable as anchors.
- Known review ambiguities are direct editorial pronunciations, context-sensitive regional relevance, and words with multiple conversational realizations. These are intentionally handed to the independent evaluator instead of being tuned against its sealed cases.
- The sealed evaluator found a systematic dropped-sound transcription defect: many curated `-in` forms remove legacy `NG` without adding the pronounced final `N`; several other curated forms retain `NG`. This category scored `0/31` and is a concrete remediation blocker, not a gold-tuning request.
- The independently chosen set included 111 positive candidates already present in the repository legacy CMU bytes. They remain in the sealed file with exact matches and are excluded from the valid OOV denominator rather than silently replaced. One post-seal dispute (`oov-219`) lacks a vowel/stress and is excluded through the append-only correction log without changing gold bytes.

## Implementation And Delegation Evidence

- Canonical base is `lavender/expo-clean-rebuild` at `62c946b1`, containing closed Phases 01-03 and the approved seven-phase sequence.
- Prepared symbolic branch `lavender/production-rhyme-phase-04` directly from that base.
- Mandatory preflight passed before file inspection: `pwd` and `git rev-parse --show-toplevel` both returned `/home/delta/.codex/worktrees/1295/lyricslab`; `git symbolic-ref --short HEAD` returned `lavender/production-rhyme-phase-04`; `git status --short --branch` showed a clean branch tracking `origin/lavender/production-rhyme-phase-04`; both local and remote preparation heads were `6a79d72f`.
- The dirtyloops run contracts, repo Beads skill, implementation/roadmap/Phase 03/Phase 04/Phase 04A/loop documents, and existing turn doc were read before implementation. `bd prime` succeeded. `bd show lyricslab-5iw.4 --json` could not acquire the read-only Dolt lock, so `.beads/issues.jsonl` was used as the canonical tracked fallback; Beads was not mutated.
- TDD established the policy behavior and adversarial source contract before the final corpus pass. The module boundary stays deep: editor-facing code sees no source/manifest/policy types, while the build-time contract owns schema, contained paths, hashes, normalization, pronunciation, provenance, count, policy, and Phase 03 flag validation.
- The authoring tool deterministically emits the human-readable reviewed JSON and hashes. Two consecutive clean authoring runs produced the same combined manifest/lexicon digest `b03a56269332e36293aebdc1f6bc6da54e20b676b6be3196b93cff51d8e9aec3`.

## Changed Behavior And Files

- `data/rhyme-sources/manifest.json`: strict v1 four-role manifest, project ownership statement, SHA-256s, overall floor 500, per-category floors, and per-region floors.
- `data/rhyme-sources/lexicon.json`: 547 unique normalized, reviewed entries, each with stable ID, surface, direct or verified-alias pronunciation, category, regions, evidence IDs, review state, and flags.
- `data/rhyme-sources/evidence.json`: nine project-editorial evidence records that distinguish editorial judgment from external-source claims.
- `data/rhyme-sources/safety-policy.json`: exact opaque maintained high-risk subset plus analyzable-anchor, unsolicited-suppression, and ordinary-profanity-eligible policy.
- `data/rhyme-sources/proper-noun-policy.json`: exact maintained proper subset plus analyzable-anchor and explicit-prefix policy.
- `data/rhyme-sources/README.md`: ownership, provenance, source/policy, sealed-evaluation, and Phase 04A boundaries.
- `scripts/rhyme-sources/contract.mjs`: strict loader/validator, contained paths, declared-JSON enforcement, SHA-256 verification, exact schemas, canonical uniqueness, ARPAbet/stress bounds, alias verification phones, evidence/review/category/region/flag/count checks, exact policy coverage, summaries, and Phase 03 `WORD_FLAG` mapping.
- `scripts/rhyme-sources/author-phase04.mjs`: deterministic project editorial source authoring and local legacy-CMU transcription validation; it neither downloads nor compiles a production artifact.
- `scripts/check-rhyme-sources.mjs`, `scripts/test-rhyme-sources.mjs`, and `package.json`: source gate plus adversarial direct/alias, malformed data, ambiguity, provenance, review, enums, policy completeness, hash, sealed-boundary, count-floor, runtime non-activation, and Phase 03 flag controls.
- `src/rhymeSources/suggestionEligibility.ts` and its focused test: dormant pure eligibility policy proving ordinary profanity allowance, high-risk anchor analysis/unsolicited suppression, and normalized explicit-prefix proper-noun behavior without editor/provider activation.

Corpus summary:

| Dimension | Count |
| --- | ---: |
| Total / reviewed | 547 / 547 |
| Direct / verified alias | 522 / 25 |
| Ad-lib | 44 |
| Apostrophe variant | 94 |
| Colloquialism | 121 |
| Common inflection | 81 |
| Dropped sound | 97 |
| Fused phrase | 48 |
| Proper name/place/acronym | 25 |
| Stylized spelling | 37 |
| National | 529 |
| Midwest / Northeast / South / West Coast | 39 / 42 / 45 / 38 |
| Safety-blocked / proper-noun flags | 5 / 25 |

Committed source hashes are `evidence.json` `6f1c482158a2a4629169ea3a51d089102c6710e697f7c8a8eadf1a3e6be5f71c`, `lexicon.json` `dd611d0ae936bc5e59e933dd5a8ba6c2f1aa8c4210367ddc23d74a3e34bc6d2b`, `manifest.json` `5f76e59c9cd19fa95298d31ef1850baedb1a690628dca5587ff94448bbbd1bed`, `proper-noun-policy.json` `f802b484f8fd31284d9dc31e445b4fd7fed188d95e5d39b9038b194ca82a27b9`, and `safety-policy.json` `4a177bbac96385a13a81f2541b1a09ccf27887a81abb1aee2e01b0a13ee2bbd5`.

## Independent Sealed OOV Evaluation

The complete 250-case gold corpus was sealed at `2026-07-12T06:55:31Z`, made mode `0444`, and hashed as `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7`. The evaluator checks that hash before and after every run and fails if the file is writable or changes.

Candidate composition was fixed before the legacy baseline check: 45 dropped-sound, 35 apostrophe-variant, 40 fused-phrase, 35 stylized-spelling, 45 colloquialism, 25 ad-lib, 15 proper-name/place/acronym, and 10 ambiguous-negative cases. The corrected single-space legacy-CMU parser found 129 positive OOV candidates and 111 legacy-present positives; no case was replaced. The append-only correction log excludes one invalid consonant-only/no-stress expectation, leaving 128 valid positive OOV cases.

Acceptance result: **failed**, `29/128` correct pronunciations (`22.66%`) against a required `90%`.

| Category | Correct | Valid OOV | Coverage |
| --- | ---: | ---: | ---: |
| Ad-lib | 7 | 16 | 43.75% |
| Apostrophe variant | 4 | 17 | 23.53% |
| Colloquialism | 3 | 7 | 42.86% |
| Dropped sound | 0 | 31 | 0.00% |
| Fused phrase | 8 | 31 | 25.81% |
| Proper name/place/acronym | 3 | 10 | 30.00% |
| Stylized spelling | 4 | 16 | 25.00% |

The 99 misses comprise 71 missing curated entries and 28 pronunciation mismatches. Full per-region numerators/denominators/percentages, every miss and accepted pronunciation, all 10 unscored ambiguous negatives, the correction dispute, source summary, and policy controls are recorded in `evaluation/rhyme-sources/oov-evaluation-result-v1.json`.

Independent policy controls all passed against the actual `isCuratedEntryEligible` implementation: five ordinary-profane entries remain rap-eligible and unsolicited, all five maintained high-risk entries remain analyzable as anchors and suppressed with or without a matching suggestion prefix, and all 25 proper names/places/acronyms remain analyzable as anchors while requiring a normalized matching explicit prefix.

Evaluation-only files:

- `evaluation/rhyme-sources/oov-gold-v1.json` and `oov-gold-v1.schema.json`: sealed 250-case corpus and strict schema.
- `evaluation/rhyme-sources/oov-evaluation-manifest-v1.json`: seal timestamp/hash, baseline method, counts, and independence declaration.
- `evaluation/rhyme-sources/oov-gold-corrections-v1.jsonl`: append-only post-seal dispute; before/after gold hashes are identical.
- `scripts/evaluate-rhyme-sources.mjs`: source/alias resolver, coverage/breakdown reporter, ambiguous-negative/dispute reporter, actual policy adversarial checks, and before/after seal enforcement.
- `evaluation/rhyme-sources/oov-evaluation-result-v1.json`: complete machine-readable failed-acceptance evidence.
- `package.json`: `npm run evaluate:rhyme-sources` acceptance command.

## Review

The fresh independent sealed-set evaluator is complete and blocks acceptance at `22.66%`. It did not mutate the curated lexicon, policies, authoring scripts, or existing curation tests. A separately isolated strict reviewer remains required after a disclosed remediation turn returns the unchanged sealed set to at least `90%`; the current failed result must not be presented as review-ready Phase 04 completion.

## CI And Gates

Owner: independent evaluation task for local evaluation/gates; orchestrator/remediation task for publication and rerun; later strict-review task for hosted reinspection

State: `ci-blocked-with-cause`

Evidence:

- `npm test`: passed, 24 suites and 185 tests.
- `npm run typecheck`: passed.
- `npm run check:rhyme-sources`: passed with 547 reviewed entries and the distributions above.
- `npm run test:rhyme-sources`: passed all focused adversarial and boundary controls.
- `npm run evaluate:rhyme-sources`: wrote the complete result and exited `1` as designed because coverage was `29/128` (`22.66%`), below `90%`; policy controls passed and the gold hash was unchanged before/after.
- `git diff --check`: passed.
- Two consecutive `node scripts/rhyme-sources/author-phase04.mjs` runs were byte/hash stable and each reported 547 reviewed entries.
- Initial `npm test` found the prepared worktree had no dependencies; a temporary shared dependency link then exposed that the shared install predated the branch's Expo Asset/FileSystem additions. A lockfile-exact online install could not complete under restricted network, so the final run used a temporary symlink forest from the canonical install plus the exact cached `expo-asset@56.0.17` and `expo-file-system@56.0.8` tarballs. This dependency tree is not source and is removed before handoff.
- The evaluation task independently reproduced that setup: the no-install attempts failed only because `jest`/`tsc` were absent; the canonical link then exposed only the two known Expo modules; a temporary symlink forest plus cache-content-addressed extraction of exact `expo-asset@56.0.17` and `expo-file-system@56.0.8` produced final passes (`24/24` suites, `185/185` tests, and clean `tsc --noEmit`). The temporary tree and tarballs were removed before handoff.
- Hosted inspection could not authenticate or reach GitHub: `gh auth status` reported the `dirtydishes` token invalid, and `gh pr list --state all --head lavender/production-rhyme-phase-04 --base lavender/expo-clean-rebuild ...` returned `error connecting to api.github.com`. No hosted checks can exist for the unpushed working tree. The orchestrator owns commit/push/explicit PR creation or update; the independent evaluator/reviewer owns the next hosted-check inspection.
- The evaluation task repeated hosted inspection after sealing: `gh auth status` still reported the `dirtydishes` token invalid; `gh pr checks 26` and `gh pr view 26 --json ...statusCheckRollup` both failed to connect to `api.github.com`. Hosted state is unavailable, but CI is classified blocked by the local acceptance failure rather than green or merely unavailable.

## PR And Commits

- Preparation commit: `6a79d72f` (`prepare production rhyme phase four`).
- Curation commit: `19594887` (`curate production rhyme source corpus`), committed and pushed by the orchestrator after the delegated task returned the complete working tree.
- PR [#26](https://github.com/dirtydishes/lyricslab/pull/26) is the only exact-head PR, opened with explicit base `lavender/expo-clean-rebuild` and head `lavender/production-rhyme-phase-04`.
- The delegated worktree Git metadata was read-only; independent evaluation, strict review, and hosted reinspection remain orchestrator-owned.
- Evaluation artifacts and this evidence update are complete in the prepared worktree. Publication state is recorded below after the Git-metadata write probe; PR #26 remains the target and no second PR is permitted.
- Git metadata is read-only in this delegated worktree. Exact publication probe: `git add <evaluation files> package.json <turn doc>` failed with `fatal: Unable to create '/home/delta/dev/lyricslab/.git/worktrees/lyricslab4/index.lock': Read-only file system`. No evaluation commit or push was created. The orchestrator must stage these exact files, commit with a lowercase human message, push `lavender/production-rhyme-phase-04`, and update existing PR #26; it must not open a second PR.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.3`.

- Do not close or mutate `lyricslab-5iw.4` until the independent evaluator authors the sealed 250 cases and reports the actual coverage/negative-control result, then the strict reviewer completes review.
- Phase 04A must revalidate all aliases and CMU-assisted direct phones against its exact CMU pin, retain required license/notice evidence, combine SUBTLEX and reviewed sources, and assemble the production artifact. It must not treat the legacy local CMU hash as the accepted pin.
- Disputed pronunciations or regional scopes found by the evaluator should be repaired as explicit source-review changes with disclosure; the curation owner must not retroactively claim the sealed set was unseen after such feedback.
- Recommended follow-up Beads work for a separately disclosed remediation turn: repair the systematic final-`N` dropped-sound transcriptions; adjudicate the 28 exact-phone mismatches; decide which of the 71 missing independent OOV forms belong within accepted Phase 04 categories; rerun the unchanged sealed evaluator; and only then request strict review. The evaluator did not mutate Beads.

## Plan Amendments

None.

## Context To Keep

Gold-set independence and disputed-pronunciation review must be preserved; the lexicon cannot be tuned against the acceptance set without disclosure. Keep source manifests compatible with the Phase 03 format, but do not claim a complete production artifact in this phase.

The sealed gold hash must remain `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7` across remediation. The existing result is a blocking baseline and must remain reviewable even after a later result passes.

Normal app startup remains unchanged. No source manifest, fixture, safety source, or eligibility module is imported by `app`, `src/editor`, `src/platform`, or `src/settings`; Phase 04A owns assembly and Phase 05 owns provider activation.

## Closeout

Source curation and PR #26 publication are complete, but the independent acceptance evaluation is blocked at `22.66%`. Phase 04 and Beads must remain open. The next action is a separately disclosed curation-remediation turn against the immutable gold set, followed by a new evaluation result and independent strict review.
