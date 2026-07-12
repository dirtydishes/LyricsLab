# Phase 03 Turn Doc: Deterministic Pipeline Framework

Beads issue: `lyricslab-5iw.3`

Phase doc: `docs/implementation/production-rhyme-suggestions/03-deterministic-data-pipeline.md`

## Accepted Outcome

Prove the manifest-driven versioned binary compiler, decoder, and bounded asynchronous mobile loader with project-owned fixtures and no raw parsing, SQL, network, or large static JSON on the typing path. Final production corpus assembly is deferred to Phase 04A.

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
- On 2026-07-12 the user approved the documented sequence amendment. Beads now resumes Phase 03 for project-owned fixture framework work, keeps Phase 04 responsible for reviewed project sources, and adds Phase 04A for external rights and final production artifact assembly.

## Resumption Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.3",
  "risk": "high",
  "strategy": "threads",
  "implementation_owner": "visible delegated implementation task on lavender/production-rhyme-phase-03",
  "review_independence": "fresh visible reviewer task using thermo-nuclear-code-quality-review after implementation",
  "delegation_plan": [
    "implement the manifest-driven format, deterministic compiler/decoder, project-owned fixture artifact, and bounded atomic loader",
    "independently challenge binary bounds, deterministic bytes, runtime publication, retry behavior, hot-path boundaries, and CI evidence"
  ],
  "model_and_effort_rationale": "Continue at standard task speed with xhigh reasoning because binary format correctness and asynchronous atomic publication remain tightly coupled; external source licensing is explicitly deferred to Phase 04A.",
  "required_evidence": [
    "symbolic branch and worktree preflight",
    "project-owned fixture manifest and provenance",
    "two byte-identical clean fixture regenerations and temporary-output freshness",
    "format header, numeric tables/indexes/flags, version, and source hashes",
    "truncation, corruption, section-bounds, and version-mismatch failures",
    "bounded post-first-frame Expo loading, last-good retention, retry, and atomic publication",
    "no raw CMU, SQLite, network, or large static JSON on the typing path",
    "npm test, typecheck, build:rhyme-data, check:rhyme-data, Expo config, strict review, and terminal CI state"
  ],
  "user_constraints": [
    "run task remains orchestrator-only",
    "standard delegated-task speed; no fast mode",
    "exactly one final callback per delegated task to 019f5428-f2ea-74c2-abfb-e37349c96391",
    "one active implementation PR and one owner per mutable checkout",
    "do not acquire, embed, or claim production CMU/SUBTLEX/project data in Phase 03"
  ]
}
```

## Discoveries And Decisions

### Required source audit

| Category | Local availability and exact pin | SHA-256 | Redistribution/licensing evidence | Attribution | May be committed/compiled now? |
|---|---|---|---|---|---|
| CMU | `data/cmudict.txt`, 3,618,488 bytes and 135,166 lines. Git introduced the file in `4e95dde7d248644fb28b5a47595275f7754c37c4` on 2026-01-22, then renamed it without content changes. The file has no header, upstream URL, tag, commit, release, or exact version. | `81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22` | The authoritative [CMUSphinx CMUdict license](https://github.com/cmusphinx/cmudict/blob/master/LICENSE) permits source and binary redistribution with the copyright, conditions, and disclaimer retained/reproduced. None of that license text is committed with the local corpus, and repository history does not establish which licensed upstream revision produced these bytes. | Carnegie Mellon University and CMUdict acknowledgement are required/requested by the authoritative repository. | **No for a newly claimed pinned production artifact.** Redistribution appears available if provenance and notice are repaired, but the exact local source revision is not established and must not be invented. |
| SUBTLEX-US | No SUBTLEX file, archive, version manifest, or source pin exists locally. The plan-designated package is [`words/subtlex-word-frequencies`](https://github.com/words/subtlex-word-frequencies) release `2.0.0`, whose published package contains 74,286 SUBTLEX-US counts. | Pin during Phase 04A from the exact package tarball/integrity. | The package registry/repository explicitly publishes release `2.0.0` as ISC © Zeke Sikelianos. The Ghent original download page itself does not state ISC, so the package license is supported while an upstream relicensing/provenance caveat remains and must be recorded rather than erased. | Retain the package ISC notice and Brysbaert & New (2009) citation. | **Yes in Phase 04A after exact package pinning and notice capture.** It remains intentionally outside amended Phase 03 fixture scope. |
| Project rap | No source file or authored record exists. Phase 04 is explicitly responsible for initial curation of at least 500 reviewed entries. | unavailable | No project source license, provenance manifest, or reviewed authored content exists. | unavailable | **No.** Creating placeholder content or provenance here would invent source contents and widen into Phase 04. |
| Safety | No maintained safety/slur input or policy data file exists. Phase 04 owns the maintained high-risk suppression data and review. | unavailable | No source ownership/license/provenance record exists. | unavailable | **No.** A fabricated empty or guessed list would weaken the accepted safety outcome. |
| Proper noun | No proper-name/place/acronym input or review manifest exists. Existing CMU inline comments are not a pinned proper-noun policy source. | unavailable | No source ownership/license/provenance record exists. | unavailable | **No.** The Phase 04 reviewed proper-noun policy/source must exist before its flags can be compiled truthfully. |

### Consequence

- The required production artifact cannot truthfully contain source versions and hashes for all five accepted categories.
- Production NOTICE/license documentation cannot be completed until Phase 04A pins the ISC-licensed package and exact CMU source, retains the package ISC notice and Brysbaert & New citation, and records the upstream Ghent caveat.
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

Independent implementation review did not start during the blocked attempt. A fresh reviewer remains required after the resumed fixture-framework implementation.

## CI And Gates

Owner: delegated Phase 03 implementation task, then independent review task

State: `unresolved` after approved resumption

Evidence:

- No implementation gates were run during the blocked attempt. Under the approved amendment, fixture-based compiler/loader gates now validate the amended Phase 03 outcome and must run before completion.
- Source audit itself completed: local CMU SHA-256/size/history were measured; missing required categories were confirmed across the worktree and canonical checkout; authoritative publisher/license pages were inspected.
- Hosted CI ownership returns to the resumed implementation task and then the independent reviewer.

## PR And Commits

- No implementation commit, push, or PR was created because the phase stopped at its mandatory provenance gate.
- Branch remains `lavender/production-rhyme-phase-03`, tracking `origin/lavender/production-rhyme-phase-03` from preparation commit `c7cf129b`.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.2`.

- Beads records `lyricslab-5iw.3` as `in_progress` under the approved fixture-framework outcome.
- New issue `lyricslab-5iw.4a` owns external rights and final production artifact assembly after Phase 04.

## Plan Amendments

Approved on 2026-07-12: Phase 03 delivers the fixture-driven binary/compiler/decoder/loader framework, Phase 04 authors and reviews project sources, and explicit Phase 04A resolves external rights and produces the complete committed production artifact.

This amendment designates `words/subtlex-word-frequencies` `2.0.0` as the accepted package source and requires its ISC notice, Brysbaert & New citation, exact package integrity, and upstream caveat. It does not authorize a different frequency corpus, fabricated policy sources, or calling the existing CMU-only JSON artifact the accepted production artifact.

## Context To Keep

SUBTLEX-US attribution and every committed artifact source hash are acceptance evidence, not optional documentation.

The prior CMU-only generated JSON is useful historical implementation evidence but does not satisfy this phase's five-source, binary-format, licensing, or asynchronous-loader acceptance criteria.

## Resumed Fixture-Framework Implementation

The approved amendment was implemented without acquiring or claiming any production corpus. Two bounded read-only helper audits challenged the binary layout, SDK 56 APIs, publication model, and hot-path boundary; this implementation task retained sole mutation ownership.

### Manifest and fixture provenance

- `data/rhyme-fixture/manifest.json` is a strict `lyricslab.rhyme-data-manifest` schema v1 manifest. It requires `production: false`, project-authored ownership, unique stable source IDs, contained relative paths, exact source SHA-256 values, and one fixture lexicon source.
- The six-word/eight-pronunciation fixture in `data/rhyme-fixture/lexemes.json` was authored only to test tables, alternates, ranks, commonness, and a rap flag. It is not CMU, SUBTLEX-US, a production rap corpus, a safety source, or a proper-noun source. `data/rhyme-fixture/README.md` makes that boundary explicit.
- Fixture lexicon SHA-256: `467d12f776b343bc45a5c0e27b54646b0ae6875e24b9543bfe3c513eb4722a76`.
- Manifest SHA-256: `6d84f8a41c7bbbfc19f6e3a40ae4800add86a7eefb1cf317e868a13fd9b9ecd2`.
- The compiler rejects hash drift, path escape, external/unreviewed ownership, production claims, duplicate words/source IDs, unsupported fields, malformed pronunciations, invalid ranks/commonness, and invalid/duplicate flags.

### Versioned binary format

Format v1 is little-endian and deterministic:

- A fixed 96-byte header contains `LLRHYME\0`, format version, header/total/directory sizes, section count/flags, the 32-byte manifest SHA-256, the 32-byte payload SHA-256, and zeroed reserved bytes.
- A fixed 24-byte descriptor per section contains section ID, record width, absolute aligned offset, byte length, record count, and zeroed reserved fields.
- Twelve required, ascending, four-byte-aligned sections encode metadata, UTF-8 string bytes, string ranges, phone IDs, word/lemma/pronunciation ranges, pronunciation phone IDs and derived exact/family keys, flattened phone IDs, exact-tail index entries, slant-family index entries, fixed-point rank/commonness records, rap/safety/proper-noun flags, and source ID/kind/version/path/hash/license/ownership references.
- Canonical code-unit sorting, fixed-point millionths, stable numeric IDs, sorted alternate phone sequences, sorted exact/slant members, zero-filled padding, and explicit source order avoid locale, timestamp, filesystem-enumeration, and absolute-checkout-path nondeterminism.
- The runtime validates magic/version/sizes/reserved fields, required and unique canonical sections, widths/counts/alignment/overlap/bounds, payload and expected manifest hashes, strict/contiguous UTF-8 strings, every cross-reference/range, alternate ordinals, exact/slant key membership and ordering, ranks/commonness, flags, and source hashes before creating a `RhymeEngine`.

The committed artifact is `assets/rhyme/fixture.rhymebin`: format version `1`, artifact version `fixture-1`, 1,752 bytes, SHA-256 `68f98b225c352fd228c8cea480aa07fc1a43ccb7fbb30af274159aff4e0ec0ed`.

### Build and freshness commands

- `npm run build:rhyme-data` uses the project fixture manifest/artifact by default. The underlying command accepts `--manifest` and `--output`/`--out` explicitly.
- `npm run check:rhyme-data` compiles into an OS temporary directory, byte-compares that output with the committed artifact, and deletes the temporary directory. Artifact mtime/size remained exactly `1783834815:1752` before and after the final check.
- `npm run test:rhyme-data-compiler` independently proves two explicit clean outputs are byte-identical and exercises source-hash drift and malformed-manifest rejection.

### Bounded loader and publication boundary

- `src/rhymeData/rhymeEngineRuntime.ts` owns a stable `RhymeEngine` proxy, fixed maximum 64 KiB reads, maximum artifact size, yielding between reads, generation-token retry semantics, observable loading/ready/error snapshots, atomic replacement only after decode and engine construction complete, stale-attempt rejection, and last-known-good retention after reload failure.
- `src/rhymeData/decodeRhymeData.ts` decodes and validates word/pronunciation records in configurable bounded record chunks, yielding to the host. The current Phase 02 `createRhymeEngine` construction happens only after all bytes and records validate, so no partial engine is published.
- `src/platform/createExpoRhymeEngineRuntime.ts` is the dormant SDK 56 construction boundary: a caller supplies a bundled Metro module ID and expected manifest hash; Expo Asset downloads/resolves that bundled asset locally; Expo FileSystem opens it read-only and returns bounded `FileHandle.readBytes` chunks; Expo Crypto verifies SHA-256.
- `src/platform/afterFirstFrameScheduler.ts` requires two animation-frame turns followed by an idle callback before acquisition begins. Cancellation and the three scheduling stages are deterministic and directly tested.
- Expo SDK evidence required direct `expo-asset ~56.0.17` and `expo-file-system ~56.0.8` dependencies. Metro's default asset list did not contain `rhymebin`, so `metro.config.js` registers that extension and `assets.d.ts` defines its module type.
- The generic settings adapter maps runtime loading/ready/error and retained-last-good diagnostics into the existing engine settings snapshot without exposing manifest, artifact, decoder, or index types to editor callers.

### Provider integration scope decision

The shipped `bundledSuggestionProvider -> createLegacyRhymeEngineAdapter -> getBundledCmuRhymeIndex` path remains unchanged. An implementation-time proposal to activate the tiny fixture through `app/_layout.tsx`, Settings, and the bundled provider was explicitly rejected and removed before final gates. Activating the fixture would degrade existing suggestions and masquerade as production integration. Phase 03 therefore proves a dormant construction boundary; Phase 04A owns the production artifact and Phase 05 owns provider/settings activation. A boundary test locks this decision.

The new generic loader path itself never parses CMU, imports a large JSON artifact, queries SQLite, or accesses network APIs. The already-shipped legacy path is intentionally preserved under the explicit scope correction until Phase 05.

## Resumed Changed Files And Behavior

- Manifest/compiler/artifact: `data/rhyme-fixture/{README.md,manifest.json,lexemes.json}`, `scripts/build-rhyme-data.mjs`, `scripts/test-rhyme-data.mjs`, `scripts/rhyme-data/{format.mjs,manifest.mjs,compile.mjs}`, `assets/rhyme/fixture.rhymebin`.
- Runtime/platform: `src/rhymeData/{binaryFormat.ts,decodeRhymeData.ts,rhymeEngineRuntime.ts}`, `src/platform/{afterFirstFrameScheduler.ts,createExpoRhymeEngineRuntime.ts}`, `metro.config.js`, `assets.d.ts`.
- Tests/settings boundary: four focused tests under `src/rhymeData/__tests__`, plus `src/settings/engineSettings.ts` and its existing test.
- Dependency/scripts: `package.json` and `package-lock.json` add exact SDK-compatible Asset/FileSystem dependencies and build/check/focused-test commands.
- Documentation: only this existing Phase 03 turn doc was updated. No side review doc or Beads mutation was created.
- Normal application suggestions, navigation, Settings rendering, and app startup remain behaviorally unchanged because the fixture runtime is dormant.

## Resumed Gates And Evidence

Final local state is green:

- `npm test` — 22 suites, 162 tests passed.
- `npm run typecheck` — passed with no diagnostics.
- `npm run build:rhyme-data` — produced 1,752 bytes at SHA-256 `68f98b225c352fd228c8cea480aa07fc1a43ccb7fbb30af274159aff4e0ec0ed`.
- `npm run check:rhyme-data` — passed using temporary regeneration; committed artifact bytes and mtime were unchanged.
- `npm run test:rhyme-data-compiler` — passed deterministic-output, source-hash, and malformed-manifest controls.
- Focused runtime/binary/settings tests — 5 suites, 18 tests passed, covering corruption, truncation, version, manifest/payload hashes, duplicate/overlapping/out-of-bounds sections, bounded reads/chunk yields, first-frame scheduling, atomic publication, last-good retention, retry, stale attempts, and provider/platform boundaries.
- `npx expo config --type public` — exited 0 and resolved `LyricsLab`, `lyricslab-mobile`, SDK `56.0.0`.
- `git diff --check` — passed.
- Two explicit clean outputs — both 1,752 bytes and both SHA-256 `68f98b225c352fd228c8cea480aa07fc1a43ccb7fbb30af274159aff4e0ec0ed`; `cmp` passed against each other and the committed artifact.
- `npm ls expo-asset expo-file-system --package-lock-only --all` — exited 0 with direct versions `56.0.17` and `56.0.8` and compatible Expo resolution.

## Resumed CI, PR, And Git State

CI state: `ci-unavailable-with-evidence`.

- `gh pr list --repo dirtydishes/lyricslab --head lavender/production-rhyme-phase-03 --base lavender/expo-clean-rebuild --state all ...`, commit-status lookup, and check-run lookup all failed on 2026-07-12 with `error connecting to api.github.com`.
- Hosted checks and PR mergeability therefore could not be truthfully inspected from this environment. Independent review owns rechecking them after the orchestrator publishes the completed tree.
- Git metadata resolves to `/home/delta/dev/lyricslab/.git/worktrees/lyricslab4` and is read-only. Source/test/doc work is complete, but this task cannot stage, commit, push, or open/update the explicit-base PR.
- Local and remote branch tips remain amendment commit `a9e661befd2893d7b05814cfc7441675ab353418`; no implementation commit exists yet. The orchestrator must commit the working tree with a lowercase human message, push `lavender/production-rhyme-phase-03`, and open/update exactly one PR with base `lavender/expo-clean-rebuild` and head `lavender/production-rhyme-phase-03`.
- Temporary worktree dependency links were used only to run local gates and were removed before handoff.

## Resumed Follow-Ups And Context

- Phase 04A must still pin exact CMU and `words/subtlex-word-frequencies` 2.0.0 bytes/integrities, preserve all required notices/citations/caveats, assemble the complete production artifact, and measure production-scale decode/index construction. This fixture does not reduce those obligations.
- Phase 05 must activate the production runtime in the existing provider/settings seams. It must not activate this fixture as user-facing suggestion data.
- No additional Beads issue was created: these responsibilities already belong to accepted Phase 04A and Phase 05 scope.

## Original Blocked-Attempt Closeout

The original production-corpus attempt stopped correctly at the mandatory provenance gate. The user approved the sequence amendment, Beads and docs are updated, and Phase 03 is resumed for fixture-driven framework implementation.

## Implementation Closeout

The amended Phase 03 fixture framework is fully implemented and locally verified. The only remaining publication actions are the orchestrator-owned commit, push, explicit-base PR creation/update, and hosted-CI inspection, followed by a fresh independent strict review.
