# Phase 04 Turn Doc: CMU Artifact Pipeline

Beads issue: `lyricslab-8um.4`

Phase doc: `docs/implementation/offline-rhyme-suggestions/04-cmu-artifact-pipeline.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by orchestrator-callback runtime for Beads issue `lyricslab-8um.4`.

Preflight passed before Beads/file/app action:

- `pwd`: `/home/delta/dev/lyricslab`
- `git rev-parse --show-toplevel`: `/home/delta/dev/lyricslab`
- `git symbolic-ref --short HEAD`: `lavender/offline-rhyme-phase-04`
- `git status --short --branch`: `## lavender/offline-rhyme-phase-04...origin/lavender/offline-rhyme-phase-04` plus pre-existing `M .beads/issues.jsonl`

## Scope

Prepare `data/cmudict.txt` for runtime use through a deterministic artifact pipeline and lookup indexes.

## Implementation Log

Swarm-first planning completed before broad implementation edits.

Integrated plan:

1. Keep Phase 03 public APIs stable while adding a new artifact loader seam in `src/rhyme/artifact.ts`.
2. Generate a committed compact JSON artifact at `src/rhyme/generated/cmuRhymeArtifact.json`, not a multi-megabyte TypeScript literal, so Expo/Metro can use the JSON transform and TypeScript does not parse the full dictionary payload.
3. Keep the full generated CMU import out of `src/rhyme/index.ts`; expose it through `src/rhyme/defaultCmuIndex.ts` for Phase 05 native integration.
4. Preserve raw `data/cmudict.txt` parsing as build-time-only work in `scripts/build-cmu-artifact.mjs`.
5. Add fixture-sized Jest coverage for object-shaped and compact artifact hydration, runtime dependency/privacy boundaries, and default-test fast-path guarantees.
6. Add non-default `npm run smoke:rhyme-artifact` evidence for full-dictionary artifact loading, index hydration, and representative lookup timings.

Implemented:

- `scripts/build-cmu-artifact.mjs` parses `data/cmudict.txt`, mirrors Phase 03 CMU parsing/normalization/tail extraction behavior, emits deterministic compact JSON, and supports `--check`.
- `src/rhyme/generated/cmuRhymeArtifact.json` is the committed full-dictionary runtime artifact. It records source/build metadata and contains compact `phoneInventory`, `tails`, `words`, and `pronunciations` tables.
- `src/rhyme/artifact.ts` validates and hydrates both small object-shaped fixture artifacts and compact generated artifacts into the existing Phase 03 `RhymeIndex`.
- `src/rhyme/defaultCmuIndex.ts` lazily hydrates the bundled CMU artifact and exposes its deterministic build info without adding the full payload to the root `src/rhyme/index.ts` import path.
- `scripts/smoke-cmu-rhyme-artifact.mjs` loads the committed artifact through the public loader, builds lookup indexes, probes representative anchors, and reports artifact size/counts/timings.
- `package.json` adds `build:rhyme-artifact`, `check:rhyme-artifact`, and `smoke:rhyme-artifact`.
- `src/rhyme/__tests__/artifact.test.ts` covers artifact hydration, compact artifact support, precomputed tail usage, mutation isolation, malformed artifact rejection, and the default test script boundary.
- `src/rhyme/__tests__/runtimePrivacyGuard.test.ts` guards the runtime source and artifact lookup path against editor/native/SQLite/filesystem/network imports and console logging.
- `testing.md` documents the Phase 04 artifact regeneration, freshness, and smoke commands.

## Subagent Swarms

Completed required swarm-first workflow:

- Scout agents: 8
- Slice-plan agents: 8
- Implementation-helper agents: 8

Scout synthesis:

- Phase 04 should choose the simplest deterministic Expo-practical artifact, not the full numeric typed-array architecture from the research report.
- Generated JSON plus a small typed loader is safer than a huge TypeScript literal for Metro/TypeScript, given the full CMU payload size.
- The current Phase 03 index builder already accepts precomputed rhyme tails, which is the clean runtime seam.
- CMU source edge cases include `(2)+` alternates, punctuation-bearing words, inline comments, and no-tail pronunciations; artifact generation must preserve usable pronunciations and skip no-tail entries only from tail buckets.
- Default Jest must stay fixture-sized; full-dictionary artifact checks and timing belong to explicit non-default scripts.

Slice-plan synthesis:

- `runtime-artifact-contract`: versioned artifact types, validation, and hydration into the existing `RhymeIndex`.
- `generator`: deterministic build/check script, no timestamps or absolute paths, stable codepoint sorting, source and payload checksums.
- `generated-payload`: committed `src/rhyme/generated/cmuRhymeArtifact.json` with compact tables.
- `default-runtime-entry`: lazy bundled CMU index in a separate module for Phase 05.
- `tests`: fixture-only loader and boundary tests in default Jest.
- `smoke`: non-default full-dictionary load/index/query evidence.
- `docs`: `testing.md` and this turn doc only.
- `package-wiring`: build/check/smoke scripts matching existing `build:editor-html` and `check:editor-html` style.

Implementation-helper synthesis:

- Helper output was integrated into one coherent path: compact JSON artifact, pure loader, lazy default CMU index, fixture-based tests, runtime privacy guard, and non-default smoke.
- Earlier helper prototypes that emitted TypeScript artifact literals were superseded after Expo/Metro scouts found JSON to be the lower-risk artifact carrier.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Pending.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `not-run`

Evidence:

- `npm run build:rhyme-artifact`: passed; wrote `src/rhyme/generated/cmuRhymeArtifact.json` with 125,213 lexemes, 135,166 pronunciations, and 35,869 rhyme tails.
- `npm test`: passed, 12 suites, 83 tests.
- `npm run typecheck`: passed.
- `npm run check:rhyme-artifact`: passed; generated CMU artifact is fresh.
- `npm run smoke:rhyme-artifact -- --compact`: passed; artifact size 9,596,136 bytes, SHA-256 `075fd521ac9f2660f6bc970e1beecb89216fea70d86a768f7190045396a32249`, 125,213 lexemes, 135,166 pronunciations, 35,869 tail keys, 96 no-tail pronunciations, 10/10 representative lookup anchors hit, p50 0.052 ms, p95 0.422 ms.
- `git diff --check`: passed.
- `node --check scripts/build-cmu-artifact.mjs && node --check scripts/smoke-cmu-rhyme-artifact.mjs`: passed.

## PR And Commits

Pending implementation PR creation.

## Beads Updates

Claimed `lyricslab-8um.4` with `bd update lyricslab-8um.4 --claim`.

The implementation worker did not close Beads issues; closeout remains the orchestrator's responsibility after review and merge.

## Follow-Ups Filed

Pending.

## Context To Keep

- Do not parse raw CMU data on the typing path.
- Keep default tests fast.
- Preserve the Phase 03 pure `src/rhyme/` boundary; do not import React Native, WebView, SQLite, editor modules, filesystem/runtime raw-data loading, network calls, or logging into the artifact/runtime lookup path.
- `src/rhyme/generated/cmuRhymeArtifact.json` is committed product data generated from `data/cmudict.txt`; regenerate with `npm run build:rhyme-artifact` and verify with `npm run check:rhyme-artifact`.
- `src/rhyme/defaultCmuIndex.ts` is the Phase 05 import seam for native suggestion integration.
- Full-dictionary smoke belongs in the Phase 04 artifact gate; broader suggestion integration waits for Phase 05, and slant/performance ranking waits for Phase 06.

## Closeout

Open.
