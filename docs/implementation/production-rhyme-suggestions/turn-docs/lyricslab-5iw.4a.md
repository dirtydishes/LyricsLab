# Phase 04A Turn Doc: Production Artifact Assembly

Beads issue: `lyricslab-5iw.4a`

Phase doc: `docs/implementation/production-rhyme-suggestions/04a-production-artifact-assembly.md`

## Accepted Outcome

Produce the complete licensed, pinned, reproducible production artifact from the proven Phase 03 pipeline and reviewed Phase 04 project sources, then publish it through the bounded production loader.

## Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.4a",
  "risk": "high",
  "strategy": "direct",
  "implementation_owner": "clean-room implementation task 019f579a-c4d5-7030-80ee-235cdb924dab on lavender/production-rhyme-phase-04a-sol-redo",
  "review_independence": "implementation owner performs strict in-scope self-review; the orchestrator retains ownership of any later fresh independent review",
  "delegation_plan": [],
  "model_and_effort_rationale": "Direct execution preserves the user-required sole mutable-checkout owner and clean-room information barrier. The task uses gpt-5.6-sol with high scrutiny because provenance, untrusted archive parsing, binary arithmetic, production-scale loading, and cancellation races are release-critical.",
  "required_evidence": [
    "exact starting worktree, branch, clean status, and Phase 04 closeout HEAD",
    "independently verified CMUSphinx CMUdict revision, bytes, hash, license, and acknowledgement",
    "independently verified subtlex-word-frequencies 2.0.0 npm/tarball identity, SRI and hashes, internal files, ISC notice, citation, and Ghent-page caveat",
    "negative-first acquisition, normalization, compiler, binary, decoder, runtime, cancellation, and platform tests",
    "complete production manifest, NOTICE, source hashes, artifact, and two byte-identical clean regenerations",
    "unchanged sealed Phase 04 gold bytes/mode and 128/128 evaluation",
    "dormant fixture and no provider, settings, editor, app-startup, or bridge activation",
    "full local gates, packaging/config evidence, git diff check, commit hashes, and honest hosted-CI state"
  ],
  "user_constraints": [
    "clean-room implementation from exact commit 0d1d188f without inspecting PR 27, the prior Phase 04A/05 branches, or later commits",
    "use only independently verified bytes from the specified local acquisition cache",
    "use dirtyloops and vertical red-green TDD faithfully",
    "do not mutate or close Beads",
    "do not push or create, update, or merge a PR",
    "send exactly one final callback to orchestrator task 019f5428-f2ea-74c2-abfb-e37349c96391"
  ]
}
```

## Independent Review Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.4a",
  "risk": "high",
  "strategy": "direct",
  "implementation_owner": "completed clean-room implementation on lavender/production-rhyme-phase-04a-sol-redo",
  "review_independence": "fresh zero-history reviewer task on lavender/production-rhyme-phase-04a-sol-review at b0202dfbcf80b29f4b2cf6cafd7cdc7e56e8c925; no PR 27, prior Phase 04A branch/history, Phase 05, or prior-run memory consulted",
  "delegation_plan": [],
  "model_and_effort_rationale": "Single-owner direct review preserves the clean-room boundary and exact mutable-checkout ownership. Full thermonuclear scrutiny is proportionate to external-source provenance, hostile archive parsing, binary integrity, production-scale asynchronous loading, cancellation, and publication risks.",
  "required_evidence": [
    "exact preflight for worktree, repository root, symbolic branch, clean status, and starting HEAD",
    "independent authoritative verification of CMU and SUBTLEX pins, licenses, notices, provenance, and reproducible acquisition",
    "test-first adversarial review of parsing, normalization, deterministic merging, phonology parity, binary encoding, corruption controls, and archive/path defenses",
    "bounded yielding decode and runtime lifecycle evidence covering atomic publication, cancellation, retry, listeners, proxy identity, and cleanup",
    "fixture separation, dormant pre-Phase05 packaging, Expo SDK 56 asset/config evidence, sealed evaluator integrity, and architecture-quality review",
    "npm ci, full Jest, typecheck, production acquisition/build/check/compiler/adversarial gates, two byte-identical regenerations, Phase 04 source/evaluator gates, runtime/platform/editor gates, and git diff --check",
    "local repair commits, exact changed files, remaining findings, blockers, and honest hosted-CI state"
  ],
  "ci_owner": "independent reviewer for all local evidence; hosted CI unavailable because push and PR operations are forbidden",
  "user_constraints": [
    "work only in the assigned worktree and branch at the exact clean starting HEAD",
    "block without repair on preflight mismatch",
    "do not inspect PR 27, the old Phase 04A branch, Phase 05, or old Phase 04A implementation history",
    "repair every safe in-scope finding test-first",
    "update only this existing Phase 04A turn doc and do not mutate Beads",
    "commit locally with lowercase human messages; do not push or open or merge PRs",
    "return exactly one compact review callback to orchestrator task 019f5428-f2ea-74c2-abfb-e37349c96391"
  ]
}
```

## Adaptations

### Clean-room runtime remediation orchestration brief

```json
{
  "phase_issue_id": "lyricslab-5iw.4a",
  "risk": "high",
  "strategy": "direct",
  "implementation_owner": "clean-room remediation task 019f57db-d871-72f2-bb85-062b87d42c3d on lavender/production-rhyme-phase-04a-sol-runtime",
  "review_independence": "fresh Sol findings at 2851640e are the independent review input; the remediation owner performs focused self-review and the orchestrator retains final independent-review authority",
  "delegation_plan": [],
  "model_and_effort_rationale": "gpt-5.6-sol high reasoning in fast mode was explicitly requested; direct sole ownership preserves the clean-room branch and makes the indexed runtime, policy, seal, and measurement slices locally testable without cross-owner mutation",
  "required_evidence": [
    "unchanged public RhymeEngine behavior with compiled exact/slant indexes used for bounded candidate retrieval",
    "production retained-memory, startup/decode, warm-query latency, and bounded-I/O probes that reject the reviewed eager architecture",
    "retained safety, proper-noun, and rap signals with deterministic positive and negative policy tests",
    "clean-checkout-compatible deterministic gold seal/setup/check contract preserving exact bytes and 128/128",
    "two byte-identical production regenerations plus all requested source, runtime, editor, Expo, legacy, and diff gates",
    "local lowercase commit and honest hosted-CI state"
  ],
  "ci_owner": "this remediation task for local gates; hosted CI is unavailable because push and PR mutation are forbidden",
  "user_constraints": [
    "do not inspect PR 27 or the old 5.5 Phase 04A branch",
    "keep production dormant and fixture explicit; do not activate Phase 05",
    "update only this existing turn doc and do not mutate Beads",
    "do not push, open or update a PR, or merge",
    "send exactly one new final callback to orchestrator 019f5428-f2ea-74c2-abfb-e37349c96391"
  ]
}
```

- Created by the user-approved 2026-07-12 sequence amendment after Phase 03 proved that final artifact assembly could not precede Phase 04 source curation.
- The worktree opened detached but clean at the explicitly accepted Phase 04 closeout commit. Because the requested branch already existed at that exact commit, the implementation owner attached only `lavender/production-rhyme-phase-04a-sol-redo` and re-proved unchanged HEAD before inspection.
- Direct execution with no delegates preserved the clean-room information barrier and sole mutable-checkout ownership. No prior Phase 04A/05 branch, PR 27, later commit, diff, or implementation file was inspected.
- The existing Phase 03 decoder rebuilt the entire engine synchronously after otherwise chunked validation. Production-scale testing therefore deepened the existing module with cancellable, yielding sort/index/map construction while keeping `RhymeEngine` unchanged.
- The checked-out gold file had the accepted bytes but owner-writable filesystem permissions. Mode `0444` was restored before the unchanged evaluator ran; the before/after seal hash remained exact.

## Discoveries And Decisions

- Authoritative CMU source is `https://github.com/cmusphinx/cmudict.git` branch `master` at revision `74790861f652b15e4ac49015a90074ad62a27690`, independently corroborated against the live upstream ref and commit page. The clean cache checkout contains `cmudict.dict` at 3,618,488 bytes / 135,166 lines / SHA-256 `81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22`; license SHA-256 is `bd4ce8e44170a5f9f481310ca85c51de3c4f851a65e679b40e603b143bd3542a`; README/acknowledgement SHA-256 is `00c34e7564f1f6a68de02e12c123d801471da92bc3091f7d89b605f238bf8554`.
- CMUdict includes a small set of standard-phone consonant-only pronunciations with no vowel nucleus. Exact source bytes remain committed and pinned, but the deterministic compiler excludes only those unrhymable pronunciations because the accepted rhyme format requires a valid tail. Other alternates for the same normalized word remain.
- The exact `subtlex-word-frequencies@2.0.0` tarball is 434,552 bytes, SHA-1 `4db4b01acf768d27162edbc3fe0930da19a5ca9a`, SHA-256 `442a0e90c3f783c008c4721f035be7a003531185233584ea27c80af6c3d0654e`, SHA-512 `37ff2e0c3578cc3f8f64d3822af8417ce7d2428d8200a6ff89c291b16429441370f678743edf8fb7f7d0211684a5a6b05483d29724de91ff731d7ff3422d3e62`, and npm SRI `sha512-N/8uDDV4zD+PZNOCKvhBfOfSQo2CAKb/icKRsWQpRBNw9nh0Pt+Pt/fQIRaEpaawVIPSlyTekf9zHX/zQi0+Yg==`. Its registry metadata reports four files and 3,615,908 unpacked bytes.
- The four package members are pinned independently: `index.json` 3,611,586 bytes / SHA-256 `271c5a5fbf332f60762cfa34b11394427c220099d96c589751b6bc77e5b32c1a`; `license` 768 / `91e895a27ad580d04ab7b2e14774756c684bf341f4e3bd8b488e9fd612b709e6`; `package.json` 1,492 / `3f72dea8a87a647c538c8b4babe0244f6bc7927531b3d617d8231d1401823d4c`; `readme.md` 2,062 / `cc4e190964273b286bd47c7cb6e24c340547a1aa10586a4f9635be5a51913301`. All 74,286 records are strict, unique, positive safe integers in non-increasing count order.
- The package carries the ISC notice Copyright (c) 2015 Zeke Sikelianos and links its counts to SUBTLEX-US. Retained citation: Brysbaert, M., & New, B. (2009), *Behavior Research Methods* 41, 977-990, DOI `10.3758/BRM.41.4.977`. Ghent documents the 51-million-word corpus and 74,286-word download but does not state ISC; `NOTICE.md` explicitly preserves that provenance/relicensing caveat rather than representing the Ghent page as the grant.
- SUBTLEX surface collisions after the accepted NFC/lowercase/apostrophe/edge normalization are combined with safe-integer addition. Production commonness is deterministic log-count normalization to fixed millionths; rank is descending normalized count then canonical code-unit word order. CMU alternates and reviewed direct phones are deduplicated and canonically sorted. All 22 aliases in the reviewed Phase 04 corpus must match an exact pronunciation in the pinned CMU bytes.

## Implementation And Delegation Evidence

- Mandatory preflight before repository inspection: `pwd` and repo root both `/home/delta/.codex/worktrees/4049/lyricslab`; clean detached HEAD `0d1d188f8d28c06555165036ebdaf3b9bf922d4d`; requested redo branch resolved to that same commit and was attached without repair or base movement.
- Beads state was read only from tracked `.beads/issues.jsonl` because the user explicitly retained Beads mutation/closeout authority. Issue `lyricslab-5iw.4a` was open, serially dependent on closed Phase 04, with Phase 05 downstream.
- Negative-first TDD slices covered tar traversal, non-regular entries, checksum corruption, duplicate members, malformed/duplicate/numeric frequency records, exact package identity, pinned-CMU alias disagreement, production-manifest rejection before enablement, decoder cancellation, runtime generation propagation, bounded asynchronous construction, safety-blocked anchor/candidate behavior, and dormant Expo packaging.
- `npm ci` installed the root lockfile exactly; `npm ci --prefix packages/editor-web` installed the editor lockfile exactly. No dependency version or lockfile change was needed.
- Source acquisition reads only `${HOME}/.cache/lyricslab-phase04a`, verifies clean CMU repo/root/origin/branch/revision plus every source pin, verifies the exact SUBTLEX archive, and then materializes or byte-compares committed sources. Normal builds use only committed bytes and have no cache or network dependency.
- Production assembly revalidates the complete Phase 04 source contract, its direct declared hashes, all 618 reviewed entries, policy files, and exact aliases before combining with CMU and SUBTLEX.
- Production artifact: `assets/rhyme/production.rhymebin`; manifest SHA-256 `b6b827989c4af5d0d15eea519d6726ebf52044f9a76dfa14ae5b9240226fab1c`; artifact SHA-256 `f938c952d60059b7339e2777c62237d3b7fc330eb15c28c97e77c281fe821dbc`; payload SHA-256 `292f3c6ca611f9ff03e82b2388cefb6cc7c54f46770895d7ea46042ed938b04`; size 19,406,176 bytes.
- Artifact scale: 125,558 words, 134,760 pronunciations, 860,174 flattened phone references, 212,727 canonical strings, 69 phones, and 12 complete source/provenance records. It remains below the 64 MiB reader/compiler limit.
- Two explicit clean production builds and the committed artifact are byte-identical at the artifact hash above. `check:rhyme-data:production` and its dedicated control regenerate only to temporary paths and preserve committed size/mtime.
- Runtime acquisition retains 64 KiB maximum reads and the 64 MiB artifact limit. Every large decode/validation/lexeme/sort/index/map pass yields at a bounded cadence, observes the generation cancellation predicate, and closes the reader through one `finally`. Publication remains atomic; retry retains the last good engine; stale generations cannot publish; listener exceptions remain isolated; the stable proxy identity remains unchanged.
- Safety-blocked records stay analyzable as typed anchors but carry internal candidate ineligibility so they are never emitted unsolicited. Proper-noun explicit-prefix activation remains Phase 05 provider policy; this phase only preserves the binary flag/policy data.
- Expo SDK 56 packaging uses `Asset.fromModule`, local `downloadAsync`, read-only `File` handles, bounded `readBytes`, Expo Crypto SHA-256, Metro `rhymebin` registration, a dormant static production factory, and the `expo-asset` config plugin to embed the binary without activating it.
- Execution summary: `{"strategy":"direct","rationale":"clean-room sole-owner implementation with vertical red-green slices","delegations":[],"adaptations":["added production-only manifest branch while preserving fixture defaults","deepened engine construction for production-scale yielding/cancellation","embedded but did not activate the production asset"]}`.

## Changed Behavior And Files

- Production source/provenance data: `data/rhyme-production-manifest.json`, `data/rhyme-production/{cmudict.dict,CMUDICT-LICENSE.txt,CMUDICT-README.txt,subtlex-word-frequencies-2.0.0.tgz,provenance.json,NOTICE.md,README.md}`.
- `.gitattributes` preserves the exact upstream CMUdict README bytes while disabling only its upstream blank-at-EOF whitespace warning.
- Production artifact and packaging: `assets/rhyme/production.rhymebin`, `app.json`, `src/rhymeData/productionArtifact.ts`, `src/platform/createProductionRhymeEngineRuntime.ts`.
- Acquisition/compiler controls: `scripts/acquire-production-rhyme-sources.mjs`, `scripts/rhyme-data/{manifest.mjs,productionSources.mjs}`, `scripts/test-production-rhyme-sources.mjs`, `scripts/test-production-rhyme-data.mjs`, and production scripts in `package.json`.
- Runtime: `src/rhyme/createRhymeEngine.ts`, `src/rhymeData/{decodeRhymeData.ts,rhymeEngineRuntime.ts}`, and `src/platform/createExpoRhymeEngineRuntime.ts`.
- Tests: focused existing tests under `src/rhyme/__tests__` and `src/rhymeData/__tests__`, plus the non-default production-scale runtime test under `src/rhymeData/__production_tests__`.
- Gate harness repair: `scripts/smoke-cmu-rhyme-artifact.mjs` and `scripts/perf-rhyme-ranking.mjs` now copy the shared `normalizeCore.cjs` into their temporary compiled runtimes.
- Normal `app`, editor provider, Settings state, routes, bridge, suggestion behavior, and fixture defaults are unchanged. The production factory is dormant; Phase 05 owns activation.

## Review

Strict clean-room self-review completed against the full redo diff without inspecting the excluded prior Phase 04A implementation or review.

- Repaired a substantive inherited loader-policy defect: Phase 03 dropped safety-blocked words from the engine entirely. The deep engine module now separates anchor analysis from candidate eligibility, preserving analyzable anchors and unsolicited suppression without widening `RhymeEngine`.
- Consolidated production provenance validation into one module and cross-checked CMU source hashes/bytes against provenance as well as the outer production manifest.
- Replaced repeated linear CMU alias lookup with one canonical map.
- Repaired the legacy smoke and performance harnesses after both exposed the Phase 04 shared-normalizer copy omission.
- Rechecked archive traversal/types/links/checksums/duplicates/end markers, exact internal file set/hashes, JSON/package identity, numeric bounds, CMU ASCII/ARPAbet/stress/alternate handling, normalization collisions, safe rank/count arithmetic, compiler bounds, binary validation, cancellation races, stale publication, listener isolation, handle cleanup, and transitive non-activation. No remaining in-scope finding is known.
- Fresh independent review remains orchestrator-owned after this implementation callback.

### Fresh Independent Thermonuclear Review

Review task started from clean symbolic branch `lavender/production-rhyme-phase-04a-sol-review` at exact HEAD `b0202dfbcf80b29f4b2cf6cafd7cdc7e56e8c925`. Mandatory preflight proved the assigned worktree/repository root, symbolic branch, clean status, and HEAD before file inspection. The reviewer did not inspect PR #27, any prior Phase 04A branch/history, Phase 05, or prior-run memory.

Outcome: **blocked**. The implementation is not safe to activate or advance into Phase 05.

- Blocker: the decoder validates the compiled exact/slant indexes and then discards them, expands all 125,558 words and 134,760 pronunciations into the Phase 02 analysis model, and linearly scans the full corpus for every query. An explicit forced-GC production probe retained approximately 1,371,608,208 bytes of V8 heap and 1,632,612,352 bytes RSS after decode; decode took 7,633 ms and one `cat` query took 734 ms on the review host. This is not a bounded mobile runtime and directly triggers the phase replanning condition that production loading exceeds the accepted mobile model. The legacy indexed artifact on the same host remained dramatically smaller/faster operationally, with current mixed lookup p50/p95 0.365/1.770 ms and slant-only p50/p95 3.286/8.607 ms.
- High finding: binary `proper-noun` and `rap` flags are validated but discarded by `decodeRhymeData`; only `safety-blocked` reaches engine eligibility. Consequently the dormant production engine has no retained signal through which the accepted explicit-prefix proper-name policy can be applied without widening/reworking the engine boundary in Phase 05. This must be resolved as part of the blocked indexed-runtime redesign, not papered over in the provider.
- CI reproducibility finding: a fresh Git worktree materialized the sealed gold file as mode `0664`; Git cannot preserve a read-only `0444` worktree mode. The unchanged accepted SHA-256 was verified before a local `chmod 0444`, after which both evaluator modes passed 128/128 and preserved the exact hash. A clean-checkout gate needs an explicit sealing/setup mechanism or a seal contract that does not claim Git can carry non-executable write-bit state.
- Safe repairs committed in `6d7cf51dc0a946af9b7725eef4f4dfb2bf5e9dd3` (`harden production rhyme validation`): canonical CMU/SUBTLEX metadata is now exact rather than shallowly shaped; SUBTLEX internal-file pins are schema-checked; rank tables must be a unique contiguous permutation in compiler and decoder; and adversarial coverage now includes absolute/Windows/backslash traversal, hardlinks, symlinks, directories, PAX/special entries, link targets on regular entries, truncated/end-marker/trailing-data attacks, unsafe/fractional/out-of-order numeric records, and additional ARPAbet/stress failures.
- Thermonuclear structure review found no changed code file crossing 1,000 lines and no reason to split the approximately 500-line production-source verifier solely by size. The thin production Expo factory earns its boundary by isolating static asset packaging. The dominant structural regression is instead the discarded-index/full-expansion runtime architecture; rearranging its current helpers would not delete that complexity.

## CI And Gates

Owner: fresh independent reviewer for local evidence; orchestrator retains hosted publication and replanning authority

State: `ci-blocked-with-cause`

Evidence:

- `npm ci` and `npm ci --prefix packages/editor-web`: passed from both lockfiles. Root audit reported 10 moderate transitive findings and the existing Expo worklets peer warning; editor audit reported zero vulnerabilities. No dependency mutation was made.
- `npm test`: 24/24 suites, 191/191 tests passed after review repairs.
- `npm run typecheck`: passed with no diagnostics.
- `npm run check:rhyme-production-sources` and `npm run test:rhyme-production-sources`: exact live-authoritative/cache/repo/tar pins plus expanded adversarial controls passed. Live `refs/heads/master` remained `74790861f652b15e4ac49015a90074ad62a27690`; all three raw CMU file hashes and npm registry version/integrity/shasum/file-count metadata matched the committed pins. Ghent and the primary DOI source corroborated the corpus/citation while providing no ISC statement on the Ghent page.
- `npm run check:rhyme-sources` and `npm run test:rhyme-sources`: 618/618 reviewed entries and all source/policy/non-activation controls passed. Two consecutive authoring runs reproduced the five accepted Phase 04 hashes exactly.
- `npm run test:rhyme-evaluation` initially failed because the fresh checkout produced mode `0664`. After hash-first verification and local mode restoration, `npm run test:rhyme-evaluation` and `npm run evaluate:rhyme-sources` passed with unchanged mode-`0444` gold SHA-256 `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7`; 128/128; policy and tamper controls passed.
- Fixture controls: `npm run build:rhyme-data`, `npm run check:rhyme-data`, and `npm run test:rhyme-data-compiler` passed; artifact remains 1,768 bytes / SHA-256 `5ee1917cd55635a9a486fe43d635ef402ae30ef7611f578f628360fd6c9985ca`.
- Production controls: `npm run build:rhyme-data:production`, `npm run check:rhyme-data:production`, and `npm run test:rhyme-production-data` passed. Two additional explicit temporary regenerations and the committed artifact were byte-identical at SHA-256 `f938c952d60059b7339e2777c62237d3b7fc330eb15c28c97e77c281fe821dbc`.
- `npm run test:rhyme-production-runtime` passes its current functional assertion, but the independent timing/forced-GC probe above proves that test is too weak to establish mobile viability. A passing functional test does not clear the runtime blocker.
- Runtime/decoder/platform/safety/cancellation tests are included in the 191-test default suite; focused repaired decoder tests passed 20/20.
- `npm run editor:test`: 3/3 files and 25/25 tests passed. `npm run build:editor-html` and `npm run check:editor-html` passed with fresh deterministic generated HTML.
- `npm run build:rhyme-artifact`, `npm run check:rhyme-artifact`, and `npm run smoke:rhyme-artifact` passed after the isolated harness repair. Legacy artifact SHA-256 remains `075fd521ac9f2660f6bc970e1beecb89216fea70d86a768f7190045396a32249`.
- `npm run perf:rhyme-ranking -- --compact` passed after the same harness repair; current host-only legacy-index mixed lookup p50/p95 were 0.365/1.770 ms and slant-only p50/p95 were 3.286/8.607 ms. Phase 06 still owns release/device benchmarks, but the new production engine is already far outside this indexed baseline.
- `npm ls expo-asset expo-file-system expo-crypto --package-lock-only --all`: direct SDK-compatible `expo-asset@56.0.17`, `expo-file-system@56.0.8`, and `expo-crypto@56.0.4` verified.
- `npx expo config --type public`: passed and resolved SDK `56.0.0`. `npx expo config --type introspect` contains `./assets/rhyme/production.rhymebin`; Metro/platform boundary tests passed.
- `git diff --check`: passed after implementation; rerun after final evidence update and before commit.
- Hosted automation cannot run for this local-only branch: the user forbids push/PR operations, no PR was created or inspected, and the repository contains no tracked `.github` workflow files. Independently, local CI is blocked by the retained-memory/full-scan design and clean-checkout seal-mode defect. No claim of hosted green CI is made.

## PR And Commits

No push, PR creation/update, merge, or inspection was performed.

- Implementation commit: `9e38d437fc3b424d7d09792188821d4f5112c929` (`build production rhyme artifact from pinned sources`).
- Independent review repair commit: `6d7cf51dc0a946af9b7725eef4f4dfb2bf5e9dd3` (`harden production rhyme validation`).
- This turn-doc evidence update is committed separately; its exact hash is returned in the one final callback.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.4`; `lyricslab-5iw.5` depends on this issue.

- No Beads mutation, claim, export, or close was performed, per the user constraint. The orchestrator retains canonical state authority.
- No Beads follow-up was created because mutation is forbidden. The orchestrator must keep Phase 04A open/blocked and replan the indexed runtime, retained flag/policy boundary, and reproducible evaluator seal before Phase 05 activation.

## Plan Amendments

This phase is the approved amendment; it does not silently replace any production source. Independent review fired the existing replanning trigger for production loading that exceeds the accepted mobile model.

## Context To Keep

- Keep `data/rhyme-production/provenance.json`, `NOTICE.md`, the exact source tar/dictionary bytes, production manifest hash, artifact hash, and dormant factory in lockstep. Run acquisition check, source adversarial test, production check, and two-clean-build control after any source change.
- The fixture remains the default `build:rhyme-data`/`check:rhyme-data` path and must stay dormant. Production has explicit suffixed commands.
- Do not begin Phase 05 activation from this runtime. Redesign production decode/query around the compiled indexes or an equivalently compact candidate-retrieval model; establish a realistic retained-memory ceiling and query guard; preserve alternate-pronunciation/Phase 02 scoring parity; and retain proper-noun/safety policy signals behind the stable proxy.
- The sealed gold bytes remain SHA-256 `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7`; do not rewrite or tune against them. A fresh Git checkout will not reproduce `0444` without an explicit local sealing step.

## Independent Review Closeout (Superseded)

Fresh clean-room independent review is **blocked**. Exact sources/notices, deterministic artifact bytes, cancellation/publication behavior, dormant Expo packaging, repaired provenance/rank controls, and most local gates are sound, but the production runtime retains approximately 1.37 GB heap, scans the entire corpus per query, discards proper-noun policy signal, and cannot reproduce the evaluator's read-only mode from a clean Git checkout. Phase 04A is not pr-ready and Phase 05 must not activate it. No Beads, PR, push, merge, or hosted state was mutated.

## Clean-room Runtime Remediation

Remediation task `019f57db-d871-72f2-bb85-062b87d42c3d` resumed only after the prepared worktree was symbolically attached to `lavender/production-rhyme-phase-04a-sol-runtime`. The mandatory rerun proved the exact repository/worktree, clean status, tracking branch, and starting HEAD `2851640e329cbc6ac2036d8a7c5bcb9e2df46d50` before inspection. No PR #27 or old Phase 04A branch was inspected, and no delegate, Beads mutation, push, PR, or merge was used.

### Indexed runtime and policy repair

- `decodeRhymeData` retains the validated compact string/word/pronunciation tables and the artifact bytes, but no longer expands 125,558 words and 134,760 pronunciations into the Phase 02 analysis graph. Anchor lookup is a binary search over the canonical word table; exact and slant candidates are range-lookups over the compiled indexes. Only the anchor, referenced exclusions/source tokens, and the bounded candidate bucket are lazily decoded into Phase 02 inputs.
- The deep internal candidate-index module reuses the unchanged Phase 02 scoring, alternate-pronunciation pairing, stable IDs/family keys, exclusions, lemma grouping, repetition penalties, commonness weights, and deterministic tie-breaks. It caches one default-policy working set only; a future dynamic proper-noun policy deliberately rebuilds the bounded set so prefix changes cannot reuse stale eligibility. The external editor-facing interface remains exactly `RhymeEngine.suggest`.
- Slant index keys now use coarse accepted vowel-family buckets while pronunciation records retain the original exact family keys. This is a semantic binary change, so the format was honestly bumped from v1 to v2. The decoder rejects legacy v1 rather than interpreting it ambiguously.
- Word flags remain compact and queryable through the decoded engine/provider policy seam. Safety-blocked forms are analyzable anchors and cannot be enabled as candidates. Proper nouns are suppressed by default; an internal lazy `isProperNounEligible` callback allows Phase 05 to supply explicit-prefix eligibility without widening the editor bridge or activating production now. Rap metadata is retained alongside both policy bits.
- Runtime lifecycle behavior remains unchanged and covered: after-first-frame scheduling, bounded 64 KiB reads/yields, cancellation at generation boundaries, atomic last-good publication, stable proxy identity, retry, listener isolation, and reader cleanup. A loaded runtime performs no further artifact reads for repeated queries.

### Mobile host guardrails

The reproducible production runtime command now launches Jest under `node --expose-gc` and enforces conservative host-only ceilings: retained heap below 256 MiB, retained RSS below 384 MiB, startup below 5,000 ms, warm p50 below 50 ms, and warm p95 below 100 ms. These guards fail the independently measured 1.37 GB / 1.63 GB / 7,633 ms / 734 ms eager architecture. Final release-device evidence remains Phase 06.

Final host measurement on this remediation branch:

- Retained heap delta: `43,000,232` bytes.
- Retained RSS delta: `31,928,320` bytes.
- Decode/startup: `4,192.805 ms`.
- Warm query p50: `10.483 ms`.
- Warm query p95: `36.227 ms`.

### Reproducible seal and artifact change

- `npm run seal:rhyme-evaluation` is an explicit hash-first clean-checkout setup step that establishes local mode `0444`; `npm run check:rhyme-evaluation-seal` verifies content and mode without mutation. The adversarial test starts from a writable copy, proves check rejection, proves deterministic setup/check success, and proves tampered bytes cannot be sealed.
- Gold bytes remain exact at SHA-256 `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7`. Both evaluator modes remain 128/128 and preserve before/after identity.
- Fixture v2 artifact: 2,252 bytes / SHA-256 `d801df20ca474657d9d3d4b96fbb5e0f7714ca1640db60d2699032c72cc55418`. The explicit fixture adds near-rhyme and policy tracer bullets only; it remains the default non-production build.
- Production v2 artifact: 20,804,672 bytes / SHA-256 `abf3ac561c41937a01642d3cb46e6391905d9c894c514329265c9a09902094d9`; payload SHA-256 `d7e8bb6b38415709c07ea31ca823336c10b1a0db424d8ddb4c86e36b5285463d`. Two clean temporary regenerations and the committed artifact were byte-identical. The production manifest hash and all source pins remain unchanged.

### Remediation gates

CI owner: clean-room remediation task for local evidence. Terminal state: `ci-unavailable-with-evidence` for hosted CI because push/PR operations are forbidden and no tracked GitHub workflow exists; every requested local gate is green.

- Dependency installation: root `npm ci` passed with the existing Expo worklets peer warning and 10 moderate transitive audit findings; editor `npm ci --prefix packages/editor-web` passed with zero vulnerabilities.
- Core: `npm test` passed 24/24 suites and 194/194 tests; `npm run typecheck` passed.
- Production sources: acquisition check and adversarial source tests passed with exact canonical CMU/SUBTLEX metadata, internal pins, traversal/link/special/truncation/numeric/ARPAbet controls, and contiguous ranks preserved.
- Phase 04: source check/test passed for 618/618 entries; seal setup/check/adversarial tests passed; evaluator self-test and evaluation passed 128/128 with unchanged gold hash.
- Fixture/compiler: build/check/compiler controls passed at the v2 fixture hash above.
- Production: build/check/data controls, decoder/runtime/platform/policy/cancellation tests, forced-GC runtime probe, and two clean regeneration comparisons passed at the v2 production hash above.
- Editor: 3/3 files and 25/25 tests passed; editor HTML build and freshness check passed.
- Legacy: build/check/smoke passed at unchanged SHA-256 `075fd521ac9f2660f6bc970e1beecb89216fea70d86a768f7190045396a32249`; compact host perf passed with mixed p50/p95 `0.370/1.972 ms` and slant p50/p95 `3.558/8.776 ms`.
- Expo/package: public config passed at SDK 56; introspected config contains the dormant `production.rhymebin`; direct `expo-asset@56.0.17`, `expo-file-system@56.0.8`, and `expo-crypto@56.0.4` were verified.
- `git diff --check` is rerun after this evidence update and before the local remediation commit.

### Remediation closeout

The four independent-review blockers are repaired and Phase 04A is **pr-ready locally**. Production remains dormant and the fixture remains explicit; no Phase 05 UI/provider activation or bridge widening occurred. Final device/release proof remains Phase 06. No Beads, hosted CI, PR, push, or merge state was mutated.
