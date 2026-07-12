# Phase 03: Deterministic Data Pipeline

Canonical Beads issue: `lyricslab-5iw.3`

Epic: `lyricslab-5iw`

Status is tracked in Beads. This document preserves accepted intent and is decision-complete, implementation-open.

## Outcome

Compile pinned CMU, SUBTLEX-US, project rap, safety, and proper-noun sources into a committed versioned binary artifact with source hashes, licensing, reproducible generation, and bounded asynchronous runtime loading.

## Why This Phase Exists

Production suggestion quality and speed require deterministic compact indexes without raw parsing, SQL, or large static JSON on the typing path.

## Scope

Allowed:

- Pinned inputs, licenses/NOTICE, compiler, binary format, source hashes, committed artifact, freshness/reproducibility commands, corruption/version tests, and Expo Asset/FileSystem loader.
- Numeric phone/word tables, pronunciation mappings/offsets, exact-tail indexes, compact slant buckets, rank, lemma, safety/proper-noun/rap flags, format version, and hashes.

Out of scope:

- Expanding lexicon editorial content beyond fixtures needed to prove the pipeline or integrating final UI behavior.

## Constraints

- `npm run build:rhyme-data` regenerates; `npm run check:rhyme-data` fails on byte/hash divergence.
- CI regenerates into a temporary location.
- Load after the first interactive frame, decode in bounded chunks, publish atomically.
- Never parse raw CMU, query SQLite, or statically parse large JSON on the typing path.

## Settled Decisions

SUBTLEX-US is the commonness source and requires its ISC attribution. The artifact is committed with pinned source versions and hashes.

## Open Questions

None.

## Dependencies

- Depends on: `lyricslab-5iw.2`
- Parallel-safe: no

## Acceptance Evidence

Two clean regenerations are byte/hash identical; license and source pins are reviewable; version mismatch/corruption fail safely; bounded asynchronous loading publishes only a complete ready engine; hot-path exclusions are verified.

## Quality Gates

`npm test`; `npm run typecheck`; `npm run build:rhyme-data`; `npm run check:rhyme-data`; `npx expo config --type public`.

## Replanning Triggers

Any source cannot be legally redistributed, deterministic bytes cannot be achieved, the accepted data cannot fit the bounded mobile loading model, or Expo SDK APIs differ materially from plan assumptions.

## Implementation Hypotheses

Prefer an explicit format header plus typed numeric sections and a thin runtime decoder; validate the exact encoding and chunking against measured repository/runtime constraints.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
