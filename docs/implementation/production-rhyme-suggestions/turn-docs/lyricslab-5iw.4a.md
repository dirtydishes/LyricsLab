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

## Adaptations

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

## CI And Gates

Owner: clean-room implementation task `019f579a-c4d5-7030-80ee-235cdb924dab` for local/CI evidence; orchestrator for later hosted publication and independent review

State: `ci-unavailable-with-evidence`

Evidence:

- `npm test`: 24/24 suites, 190/190 tests passed.
- `npm run typecheck`: passed with no diagnostics.
- `npm run check:rhyme-production-sources` and `npm run test:rhyme-production-sources`: exact cache/repo/tar pins plus adversarial controls passed.
- `npm run check:rhyme-sources` and `npm run test:rhyme-sources`: 618/618 reviewed entries and all source/policy/non-activation controls passed. Two consecutive authoring runs reproduced the five accepted Phase 04 hashes exactly.
- `npm run test:rhyme-evaluation` and `npm run evaluate:rhyme-sources`: unchanged mode-`0444` gold SHA-256 `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7`; 128/128; policy and tamper controls passed.
- Fixture controls: `npm run build:rhyme-data`, `npm run check:rhyme-data`, and `npm run test:rhyme-data-compiler` passed; artifact remains 1,768 bytes / SHA-256 `5ee1917cd55635a9a486fe43d635ef402ae30ef7611f578f628360fd6c9985ca`.
- Production controls: `npm run check:rhyme-data:production` and `npm run test:rhyme-production-data` passed, including two clean byte-identical regenerations, committed byte comparison, embedded manifest hash, scale floors, temporary cleanup, and size/mtime preservation.
- `npm run test:rhyme-production-runtime`: non-default production-scale decode/load/query test passed through the public one-method engine seam.
- Runtime/decoder/platform/safety/cancellation tests are included in the 190-test default suite; targeted reruns passed.
- `npm run editor:test`: 3/3 files and 25/25 tests passed. `npm run build:editor-html` and `npm run check:editor-html` passed with fresh deterministic generated HTML.
- `npm run build:rhyme-artifact`, `npm run check:rhyme-artifact`, and `npm run smoke:rhyme-artifact` passed after the isolated harness repair. Legacy artifact SHA-256 remains `075fd521ac9f2660f6bc970e1beecb89216fea70d86a768f7190045396a32249`.
- `npm run perf:rhyme-ranking -- --compact` passed after the same harness repair; host-only legacy-index mixed lookup p50/p95 were 0.301/1.585 ms and slant-only p50/p95 were 3.305/8.353 ms. Phase 06 still owns release/device benchmarks.
- `npm ls expo-asset expo-file-system --package-lock-only --all`: direct SDK-compatible `expo-asset@56.0.17` and `expo-file-system@56.0.8` verified.
- `npx expo config --type public`: passed and resolved SDK `56.0.0`. `npx expo config --type introspect` contains `./assets/rhyme/production.rhymebin`; Metro/platform boundary tests passed.
- `git diff --check`: passed after implementation; rerun after final evidence update and before commit.
- Hosted automation cannot run for this local-only branch: the user forbids push/PR operations, no PR was created or inspected, and the repository contains no tracked `.github` workflow files. No claim of hosted green CI is made.

## PR And Commits

No push, PR creation/update, merge, or inspection was performed. Local implementation/evidence commit hashes are added at closeout and returned in the one final callback.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.4`; `lyricslab-5iw.5` depends on this issue.

- No Beads mutation, claim, export, or close was performed, per the user constraint. The orchestrator retains canonical state authority.
- No follow-up issue is required for in-scope work. Phase 05 already owns factory activation, proper-noun prefix gating in the provider, Settings/provider state, and editor suggestion behavior.

## Plan Amendments

This phase is the approved amendment; it does not silently replace any production source.

## Context To Keep

- Keep `data/rhyme-production/provenance.json`, `NOTICE.md`, the exact source tar/dictionary bytes, production manifest hash, artifact hash, and dormant factory in lockstep. Run acquisition check, source adversarial test, production check, and two-clean-build control after any source change.
- The fixture remains the default `build:rhyme-data`/`check:rhyme-data` path and must stay dormant. Production has explicit suffixed commands.
- Phase 05 must activate only `createProductionRhymeEngineRuntime`, retain the stable proxy, apply explicit-prefix proper-noun eligibility before display, and preserve safety-blocked anchor-only behavior. It must not parse raw sources or widen the bridge.
- The sealed gold file remains mode `0444` and SHA-256 `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7`; do not rewrite or tune against it.

## Closeout

Clean-room Phase 04A implementation is locally complete and pr-ready pending orchestrator-owned independent review/publication. Exact source pins/notices, complete production artifact, deterministic controls, production-scale cancellable loading, dormant Expo packaging, sealed evaluation, full local gates, and honest CI evidence are recorded above. No Phase 05 behavior was activated and no Beads or hosted state was mutated.
