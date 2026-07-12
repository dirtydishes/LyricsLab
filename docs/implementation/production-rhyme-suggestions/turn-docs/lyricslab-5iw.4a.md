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
  "strategy": "threads",
  "implementation_owner": "visible delegated production-artifact task on lavender/production-rhyme-phase-04a",
  "review_independence": "fresh visible reviewer task using thermo-nuclear-code-quality-review after implementation",
  "delegation_plan": [
    "establish exact package/source pins, notices, citations, hashes, and the upstream SUBTLEX caveat before compiling production bytes",
    "assemble and verify the complete artifact from CMU, SUBTLEX package counts, and reviewed Phase 04 sources through the Phase 03 framework",
    "independently challenge licensing evidence, reproducibility, production-scale bounds, loader atomicity, data-policy mapping, and CI evidence"
  ],
  "model_and_effort_rationale": "Use standard task speed and xhigh reasoning because source provenance, deterministic large-scale compilation, cross-source precedence, and bounded mobile loading are release-critical and tightly coupled; fast mode remains disabled.",
  "required_evidence": [
    "symbolic branch and worktree preflight",
    "exact CMU revision/hash/license/acknowledgement",
    "subtlex-word-frequencies 2.0.0 tarball integrity/hash, ISC notice, Brysbaert and New citation, and Ghent upstream caveat",
    "complete production manifest/NOTICE/source hashes and reviewed Phase 04 source mapping",
    "two byte-identical clean production regenerations and temporary-output freshness",
    "production artifact size/hash/version and all corruption/version/bounds controls",
    "bounded post-first-frame loading, atomic publication, last-good retention, retry, and production-scale measurements",
    "no raw parsing, SQLite, network, or large JSON on the typing path; no provider activation",
    "npm test, typecheck, source gates, build/check rhyme data, Expo config, strict review, and terminal CI state"
  ],
  "user_constraints": [
    "run task remains orchestrator-only",
    "standard delegated-task speed; no fast mode",
    "exactly one final callback per delegated task to 019f5428-f2ea-74c2-abfb-e37349c96391",
    "one active implementation PR and one owner per mutable checkout",
    "retain the designated package ISC notice and citation without claiming the Ghent page itself grants ISC",
    "do not activate the provider/settings runtime or widen into Phase 05"
  ]
}
```

## Adaptations

- Created by the user-approved 2026-07-12 sequence amendment after Phase 03 proved that final artifact assembly could not precede Phase 04 source curation.
- Canonical base is `lavender/expo-clean-rebuild` at `0d1d188f`, containing closed Phases 01-04 and the reviewed source/evaluation corpus.
- Prepared symbolic branch `lavender/production-rhyme-phase-04a` directly from that base.

## Discoveries And Decisions

- Mandatory preflight passed before file inspection: `pwd` and `git rev-parse --show-toplevel` both returned `/home/delta/.codex/worktrees/1295/lyricslab`; `git symbolic-ref --short HEAD` returned `lavender/production-rhyme-phase-04a`; `git status --short --branch` returned a clean tracking branch; `git rev-parse HEAD` returned setup commit `1d5ec84252696d04e0a2e3e14e8e5d039c5cd831`.
- `bd prime` succeeded, but `bd show lyricslab-5iw.4a` could not acquire the embedded Dolt lock because the Beads database path is read-only: `failed to load database "lyricslab": openat LOCK: read-only file system`. The tracked `.beads/issues.jsonl` record was used only as read-only fallback issue evidence; this task did not mutate or close Beads.
- Primary browser-visible source evidence was reachable: CMUSphinx `cmudict` repository, `cmudict.dict`, `LICENSE`, and `README`; `words/subtlex-word-frequencies` repository, release `2.0.0` at commit `1b16b4c`, `package.json`, `license`, and `index.json` metadata; and the Ghent SUBTLEXus page documenting 74,286 downloadable words and 51 million source-token counts.
- The reachable browser evidence verifies the accepted source identities, licenses/notices, and SUBTLEX/Ghent caveat direction, but not the exact npm registry tarball bytes/integrity required by Phase 04A acceptance. The shell cannot resolve external hosts, and no local installed package, tarball, or npm-cache entry for `subtlex-word-frequencies@2.0.0` exists.
- Because the exact package tarball/integrity and source bytes cannot be acquired in this sandbox, compiling a production artifact would require fabricating a pin or substituting an unapproved source. The phase therefore stops at the accepted source-acquisition replanning trigger.

## Implementation And Delegation Evidence

- Execution strategy remained direct in this single delegated task. No helper agents received read or mutation ownership.
- Repo-local `AGENTS.md` was not present under the worktree by `rg --files -g 'AGENTS.md'`; the server-level safety guidance and dirtyloops/Beads skill guidance were applied.
- Dirtyloops run references read: `common.md`, `beads.md`, `review-ci.md`, `turn-docs.md`, `run-loop.md`, `delegation.md`, and `launch-safety.md`.
- Required phase/context documents read: `IMPLEMENT.md`, `loop-state.md`, `04a-production-artifact-assembly.md`, this turn doc, Phase 03 and Phase 04 docs/turn docs, `.beads/issues.jsonl`, and the Phase 03/04 compiler/source files needed to assess the implementation path.
- Existing local CMU file remains the historical unpinned file: `data/cmudict.txt` SHA-256 `81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22`. It still has no retained header, upstream URL, commit, release, or license notice in the file itself, so this task did not claim it as the authoritative Phase 04A CMU pin.
- External source acquisition probes:
  - `git ls-remote https://github.com/cmusphinx/cmudict.git HEAD refs/heads/master` failed with `Could not resolve host: github.com`.
  - `npm view subtlex-word-frequencies@2.0.0 dist license name version description repository --json` failed with `EAI_AGAIN registry.npmjs.org`.
  - `npm view cmudict@latest dist license name version repository --json` failed with `EAI_AGAIN registry.npmjs.org`.
  - `npm cache ls subtlex-word-frequencies --json` and `npm cache ls cmudict --json` returned no package entries.
  - `find /home/delta -path '*/node_modules/subtlex-word-frequencies' -type d -print` and `find /home/delta -name 'subtlex-word-frequencies-2.0.0.tgz' -o -name 'subtlex-word-frequencies'` found no local package directory or tarball.
- Browser-visible primary source probes:
  - `https://github.com/cmusphinx/cmudict` shows CMUdict maintained by Carnegie Mellon's Speech Group and requests acknowledgement when redistributing.
  - `https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict` exposes the authoritative dictionary file, but shell DNS prevented byte acquisition/hash verification into the checkout.
  - `https://github.com/words/subtlex-word-frequencies/releases/tag/2.0.0` identifies release `2.0.0` at commit `1b16b4c`.
  - `https://github.com/words/subtlex-word-frequencies/blob/master/package.json` states version `2.0.0`, license `ISC`, main `index.json`, and package files limited to `index.json`.
  - `https://github.com/words/subtlex-word-frequencies/blob/master/license` carries the ISC notice for Zeke Sikelianos.
  - `https://github.com/words/subtlex-word-frequencies/blob/master/index.json` reports the 3.44 MB package data file, but the browser page does not provide npm tarball integrity and cannot persist source bytes into the checkout.
  - `https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus` documents the SUBTLEXus 51 million word corpus and the 74,286-word download, but does not state the package's ISC grant.

## Changed Behavior And Files

Resumed implementation after the orchestrator cleared the source-acquisition blocker added the real Phase 04A production artifact path while preserving the prior blocker record above as historical evidence.

Behavior changes:

- `npm run build:rhyme-data` and `npm run check:rhyme-data` now target the Phase 04A production manifest and `assets/rhyme/production.rhymebin`.
- Explicit fixture-only commands remain available as `npm run build:rhyme-data:fixture` and `npm run check:rhyme-data:fixture`; fixture bytes remain dormant.
- Production source assembly validates pinned CMUdict, pinned `subtlex-word-frequencies@2.0.0`, and reviewed Phase 04 project sources before compiling the existing Phase 03 binary format.
- The decoded engine now accepts an internal `suggestionEligible` input bit. Production safety/proper-noun flags can remain analyzable as anchors while flagged lexemes are not returned as candidates by the dormant decoded engine until Phase 05 supplies provider/prefix activation.
- A dormant platform factory addresses `assets/rhyme/production.rhymebin` through the existing Expo runtime seam. No app/editor/provider/settings activation was added.

Changed files and artifacts:

- `assets/rhyme/production.rhymebin`
- `data/rhyme-production/manifest.json`
- `data/rhyme-production/NOTICE.md`
- `data/rhyme-production/README.md`
- `data/rhyme-production/cmudict-LICENSE.txt`
- `data/rhyme-production/cmudict-README.txt`
- `data/rhyme-production/subtlex-word-frequencies-2.0.0.tgz`
- `package.json`
- `scripts/build-rhyme-data.mjs`
- `scripts/rhyme-data/manifest.mjs`
- `scripts/rhyme-data/production-sources.mjs`
- `scripts/test-rhyme-data.mjs`
- `src/platform/createProductionRhymeEngineRuntime.ts`
- `src/platform/__tests__/createProductionRhymeEngineRuntime.test.ts`
- `src/rhyme/createRhymeEngine.ts`
- `src/rhyme/__tests__/productionRhymeEngine.test.ts`
- `src/rhymeData/decodeRhymeData.ts`
- `src/rhymeData/__tests__/productionRhymeData.test.ts`
- `src/rhymeData/__tests__/runtimeBoundary.test.ts`
- `docs/implementation/production-rhyme-suggestions/turn-docs/lyricslab-5iw.4a.md`
- `evaluation/rhyme-sources/oov-gold-v1.json` mode repaired from `0600` to `0444`; bytes unchanged at SHA-256 `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7`.

Production artifact evidence:

- CMUdict pin: `cmusphinx/cmudict@74790861f652b15e4ac49015a90074ad62a27690`, commit date `2025-10-24T13:40:26-04:00`.
- Existing `data/cmudict.txt` bytes match authoritative `cmudict.dict` SHA-256 `81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22`; dictionary bytes were preserved.
- CMUdict license SHA-256 `bd4ce8e44170a5f9f481310ca85c51de3c4f851a65e679b40e603b143bd3542a`; README/acknowledgement SHA-256 `00c34e7564f1f6a68de02e12c123d801471da92bc3091f7d89b605f238bf8554`.
- SUBTLEX tarball SHA-256 `442a0e90c3f783c008c4721f035be7a003531185233584ea27c80af6c3d0654e`; SHA-512/SRI `sha512-N/8uDDV4zD+PZNOCKvhBfOfSQo2CAKb/icKRsWQpRBNw9nh0Pt+Pt/fQIRaEpaawVIPSlyTekf9zHX/zQi0+Yg==`; SHA-1 shasum `4db4b01acf768d27162edbc3fe0930da19a5ca9a`.
- SUBTLEX package file list verified exactly: `package/index.json`, `package/license`, `package/package.json`, `package/readme.md`; `index.json` contains 74,286 unique `{word,count}` entries with max count `2134713`.
- SUBTLEX notice retains ISC © Zeke Sikelianos, Brysbaert & New citation, and the caveat that the Ghent original download page itself does not state ISC.
- Phase 04 source manifest SHA-256 `d8e2acb3b352a2589da8f71dd9ab082bc50c495698ab4359ad21d6c095fc9b29`; reviewed source count remains 618.
- Production manifest SHA-256 `9df2e79105888978c3c89b0304cd2f6e8815a353b8c311a9c564b47c3379280a`.
- Production artifact SHA-256 `204a1471633da57ef447006b8d45128358b993deb085b4243c7067b7b61ab12d`; size `19,405,408` bytes, below the 64 MiB loader cap.

## Review

Pending independent review.

## CI And Gates

Owner: delegated Phase 04A implementation task, then independent strict review task

State: `ci-unavailable-with-evidence`; all local gates pass after the orchestrator supplied dependency/network access. Hosted checks remain unavailable until publication.

Evidence:

- `npm run build:rhyme-data` passed; production artifact `19,405,408` bytes, SHA-256 `204a1471633da57ef447006b8d45128358b993deb085b4243c7067b7b61ab12d`.
- `npm run check:rhyme-data` passed with the same production artifact hash.
- `npm run check:rhyme-data:fixture` passed; fixture artifact remains `1,768` bytes, SHA-256 `5ee1917cd55635a9a486fe43d635ef402ae30ef7611f578f628360fd6c9985ca`.
- `npm run test:rhyme-data-compiler` passed, including two byte-identical production regenerations and production manifest drift controls.
- `npm run check:rhyme-sources` passed with 618 reviewed entries and expected category/region/flag counts.
- `npm run test:rhyme-sources` passed.
- `npm run evaluate:rhyme-sources` passed: gold hash unchanged before/after, 128/128 coverage, policy passed.
- `npm run test:rhyme-evaluation` passed with the same 128/128 and unchanged gold hash.
- `npm run editor:test` passed: 3 files, 25 tests.
- `npm run build:editor-html` passed; editor web build completed and `src/editor/generated/editorHtml.ts` was regenerated unchanged.
- `git diff --check` passed.
- Final integrity check: gold SHA-256 `40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7`, mode `0444`; production artifact SHA-256 `204a1471633da57ef447006b8d45128358b993deb085b4243c7067b7b61ab12d`; production manifest SHA-256 `9df2e79105888978c3c89b0304cd2f6e8815a353b8c311a9c564b47c3379280a`.
- The delegated sandbox initially could not install dependencies (`EAI_AGAIN` / `ENOTCACHED`); the orchestrator resolved that environmental blocker with `npm ci`, which installed the locked dependency tree successfully.
- Orchestrator `npm test -- --runInBand` passed: 26 suites, 189 tests.
- Orchestrator `npm run typecheck` passed with no diagnostics.
- Orchestrator `npx expo config --type public` passed for LyricsLab / `lyricslab-mobile`, SDK `56.0.0`, with `expo-sqlite` and `expo-router` configured.
- Orchestrator repeated two clean production builds; both were byte-identical at `19,405,408` bytes and SHA-256 `204a1471633da57ef447006b8d45128358b993deb085b4243c7067b7b61ab12d`.
- Orchestrator reran production and fixture freshness, reviewed-source checks, source adversarial controls, sealed evaluation, evaluation self-tests, and `git diff --check`; all passed.
- Hosted PR/CI evidence remains pending publication. The delegated sandbox could not reach `api.github.com`; the orchestrator owns the post-push reinspection.

## PR And Commits

Implementation is ready for the orchestrator to commit and push on `lavender/production-rhyme-phase-04a`, then open exactly one PR with explicit base `lavender/expo-clean-rebuild` and explicit head `lavender/production-rhyme-phase-04a`.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.4`; `lyricslab-5iw.5` depends on this issue.

- Beads CLI mutation/inspection beyond `bd prime` is unavailable in this sandbox because the embedded Dolt lock path is read-only. The orchestrator retains canonical Beads authority.
- Follow-up: orchestrator publishes the completed implementation, records hosted PR/check evidence, and launches the independent strict reviewer before merge/closeout.

## Plan Amendments

This phase is the approved amendment; it does not silently replace any production source.

## Context To Keep

The designated source is `words/subtlex-word-frequencies` `2.0.0`, which publishes the 74,286 SUBTLEX-US counts under ISC © Zeke Sikelianos. Retain that ISC notice and Brysbaert & New citation, pin the exact package integrity, and document that the Ghent original download page does not itself state ISC. Source acquisition and all local dependency-backed gates are resolved; only normal publication and independent review remain.

## Closeout

Resumed implementation produced the production artifact, manifests, notices, source validation, deterministic compiler checks, dormant production runtime factory, and complete local source/evaluation/editor/runtime evidence. The orchestrator cleared the delegated sandbox's dependency blocker and confirmed all remaining local gates; implementation is PR-ready pending publication and independent strict review.
