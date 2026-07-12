# Phase 03 Turn Doc: Deterministic Data Pipeline

Beads issue: `lyricslab-5iw.3`

Phase doc: `docs/implementation/production-rhyme-suggestions/03-deterministic-data-pipeline.md`

## Accepted Outcome

Produce a pinned, licensed, reproducible binary artifact and bounded asynchronous mobile loader with no raw parsing, SQL, or large static JSON on the typing path.

## Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.3",
  "risk": "high",
  "strategy": "threads",
  "implementation_owner": "visible delegated implementation task on lavender/production-rhyme-phase-03",
  "review_independence": "fresh visible reviewer task using thermo-nuclear-code-quality-review after implementation",
  "delegation_plan": [
    "audit every proposed input's local availability, redistribution terms, version pin, and hash before choosing the committed artifact corpus",
    "implement and verify a deterministic binary compiler plus bounded Expo loader behind the Phase 02 RhymeEngine seam",
    "independently challenge provenance, byte reproducibility, binary validation, loading atomicity, hot-path boundaries, and CI evidence"
  ],
  "model_and_effort_rationale": "Use standard task speed and xhigh reasoning because source licensing, deterministic binary design, and asynchronous mobile publication create coupled correctness and provenance risks; fast mode remains disabled.",
  "required_evidence": [
    "symbolic branch and worktree preflight",
    "reviewable source versions, redistribution terms, attribution, and SHA-256 pins",
    "two byte-identical clean regenerations and a temporary-output freshness check",
    "format header, numeric tables/indexes/flags, version, and source hashes",
    "corruption and version-mismatch safe failures",
    "bounded post-first-frame Expo Asset/FileSystem loading with atomic publication",
    "no raw CMU parsing, SQLite, network, or large static JSON on the typing path",
    "npm test, npm run typecheck, build:rhyme-data, check:rhyme-data, and Expo public config",
    "independent strict review and terminal CI state"
  ],
  "user_constraints": [
    "run task remains orchestrator-only",
    "standard delegated-task speed; no fast mode",
    "exactly one final callback per delegated task to 019f5428-f2ea-74c2-abfb-e37349c96391",
    "one active implementation PR and one owner per mutable checkout",
    "stop for approval if a required source cannot be legally redistributed or accepted provenance cannot be established"
  ]
}
```

## Adaptations

- Canonical base is `lavender/expo-clean-rebuild` at `7edb3ca8`, containing merged and closed Phase 01 and Phase 02 work.
- Prepared symbolic branch `lavender/production-rhyme-phase-03` directly from that base.
- The mandatory source/provenance gate ran before pipeline implementation. Required inputs and redistribution evidence were not complete, triggering the authored replanning rule and stopping broad implementation.
- `bd prime` succeeded, but `bd show lyricslab-5iw.3 --json` could not acquire the read-only Dolt lock. `.beads/issues.jsonl` was used only as a tracked read-only fallback; this task did not mutate or close Beads.

## Discoveries And Decisions

### Required source audit

| Category | Local availability and exact pin | SHA-256 | Redistribution/licensing evidence | Attribution | May be committed/compiled now? |
|---|---|---|---|---|---|
| CMU | `data/cmudict.txt`, 3,618,488 bytes and 135,166 lines. Git introduced the file in `4e95dde7d248644fb28b5a47595275f7754c37c4` on 2026-01-22, then renamed it without content changes. The file has no header, upstream URL, tag, commit, release, or exact version. | `81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22` | The authoritative [CMUSphinx CMUdict license](https://github.com/cmusphinx/cmudict/blob/master/LICENSE) permits source and binary redistribution with the copyright, conditions, and disclaimer retained/reproduced. None of that license text is committed with the local corpus, and repository history does not establish which licensed upstream revision produced these bytes. | Carnegie Mellon University and CMUdict acknowledgement are required/requested by the authoritative repository. | **No for a newly claimed pinned production artifact.** Redistribution appears available if provenance and notice are repaired, but the exact local source revision is not established and must not be invented. |
| SUBTLEX-US | No SUBTLEX file, archive, version manifest, or source pin exists in the worktree or canonical checkout. | unavailable | The authoritative [Ghent University SUBTLEX-US page](https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus) exposes several downloads and describes the 74,286-word text corpus, but the page does not grant or state redistribution terms. The accepted plan's required “ISC attribution” is not present locally and could not be corroborated from that primary source. Third-party pages report mutually different licenses or special permission and are not sufficient authority for this product. | Brysbaert & New (2009), plus the exact accepted license/permission notice once established. | **No.** Exact bytes/hash are absent and redistribution permission for committing/embedding the data has not been established from an authoritative grant. |
| Project rap | No source file or authored record exists. Phase 04 is explicitly responsible for initial curation of at least 500 reviewed entries. | unavailable | No project source license, provenance manifest, or reviewed authored content exists. | unavailable | **No.** Creating placeholder content or provenance here would invent source contents and widen into Phase 04. |
| Safety | No maintained safety/slur input or policy data file exists. Phase 04 owns the maintained high-risk suppression data and review. | unavailable | No source ownership/license/provenance record exists. | unavailable | **No.** A fabricated empty or guessed list would weaken the accepted safety outcome. |
| Proper noun | No proper-name/place/acronym input or review manifest exists. Existing CMU inline comments are not a pinned proper-noun policy source. | unavailable | No source ownership/license/provenance record exists. | unavailable | **No.** The Phase 04 reviewed proper-noun policy/source must exist before its flags can be compiled truthfully. |

### Consequence

- The required production artifact cannot truthfully contain source versions and hashes for all five accepted categories.
- NOTICE/license documentation cannot be completed without an authoritative SUBTLEX redistribution grant and an exact CMU source pin.
- Rank, lemma, rap, safety, and proper-noun flag sections cannot be populated from accepted sources because four categories are absent.
- `build:rhyme-data`, `check:rhyme-data`, two production-corpus regenerations, artifact size/hash evidence, and the Expo loader would prove a materially incomplete substitute rather than the accepted Phase 03 outcome.
- Per the delegation and Phase 03 replanning trigger, no binary layout, compiler, committed artifact, or runtime loader was implemented after this evidence was established.

## Implementation And Delegation Evidence

- Implementation task `019f5472-18f2-7cf2-8102-3dd76496a3e1` proved the exact worktree, repo root, symbolic branch, and clean tracking status before file access.
- Execution strategy remained a single visible implementation thread owning the mutable checkout. No helper received mutation ownership.
- Source audit commands included repository-wide required-source/license inventory, Git history for `data/cmudict.txt`, byte/line counts, SHA-256, Beads JSONL fallback, and authoritative CMUdict/SUBTLEX publisher pages.
- Broad implementation stopped at the source gate as required; no accepted interface or runtime source was changed.

## Changed Behavior And Files

- No application behavior changed.
- Only this existing Phase 03 turn doc was updated with blocker evidence and plan-amendment requirements.

## Review

Independent implementation review did not start because the accepted source gate blocked implementation before source changes. The orchestrator should resolve the provenance/plan decision before launching a code reviewer.

## CI And Gates

Owner: delegated Phase 03 implementation task, then independent review task

State: `ci-blocked-with-cause`

Evidence:

- No implementation gates were run: the required production corpus is incomplete, so compiler/loader gates and regeneration comparisons would validate a substitute outcome.
- Source audit itself completed: local CMU SHA-256/size/history were measured; missing required categories were confirmed across the worktree and canonical checkout; authoritative publisher/license pages were inspected.
- Hosted CI is not applicable until an accepted implementation exists. CI ownership returns to the orchestrator after the blocker is resolved and a replacement implementation task completes.

## PR And Commits

- No implementation commit, push, or PR was created because the phase stopped at its mandatory provenance gate.
- Branch remains `lavender/production-rhyme-phase-03`, tracking `origin/lavender/production-rhyme-phase-03` from preparation commit `c7cf129b`.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.2`.

- Beads now records `lyricslab-5iw.3` as `blocked` with the provenance evidence and the two required decision paths. The issue remains open and assigned; it was not closed.

## Plan Amendments

User/orchestrator decision is required; do not choose silently between these materially different outcomes:

1. Supply a pinned, redistribution-authorized SUBTLEX-US source plus exact license/permission text; identify the exact upstream CMU revision matching the committed bytes (or replace it with a pinned authoritative revision and its license); and supply reviewed project rap/safety/proper-noun source manifests before resuming Phase 03.
2. Amend phase ordering so Phase 03 first delivers only a fixture-driven binary/compiler/loader framework, Phase 04 authors and reviews the project sources, and a later explicit phase produces and verifies the complete committed production artifact. This changes the current Phase 03 acceptance outcome and cannot be assumed by an implementation delegate.

Do not substitute another frequency corpus, infer a license from third-party redistribution, fabricate empty policy sources, or call the existing CMU-only JSON artifact the accepted production artifact.

## Context To Keep

SUBTLEX-US attribution and every committed artifact source hash are acceptance evidence, not optional documentation.

The prior CMU-only generated JSON is useful historical implementation evidence but does not satisfy this phase's five-source, binary-format, licensing, or asynchronous-loader acceptance criteria.

## Closeout

Blocked at the mandatory source/provenance gate before broad implementation. The blocker is canonical in Beads and requires a user decision on source supply versus phase ordering.
