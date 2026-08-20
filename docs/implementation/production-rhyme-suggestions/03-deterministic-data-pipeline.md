# Phase 03: Deterministic Pipeline Framework

Canonical Beads issue: `lyricslab-5iw.3`

Epic: `lyricslab-5iw`

Status is tracked in Beads. This document preserves accepted intent and is decision-complete, implementation-open.

## Outcome

Build and verify the manifest-driven versioned binary compiler, decoder, and bounded asynchronous loader using only project-owned fixture inputs. This phase proves the production-capable format and loading behavior without claiming that the final production corpus exists.

## Why This Phase Exists

Production suggestion quality and speed require deterministic compact indexes without raw parsing, SQL, or large static JSON on the typing path.

## Scope

Allowed:

- A manifest contract, project-owned fixture inputs, compiler, binary format, source hashes, committed fixture artifact, freshness/reproducibility commands, corruption/version tests, and Expo Asset/FileSystem loader.
- Numeric phone/word tables, pronunciation mappings/offsets, exact-tail indexes, compact slant buckets, rank, lemma, safety/proper-noun/rap flags, format version, and hashes.

Out of scope:

- Acquiring or embedding CMU/SUBTLEX-US production bytes, authoring the Phase 04 project corpus, assembling the final production artifact, or integrating final UI behavior.

## Constraints

- `npm run build:rhyme-data` accepts an explicit manifest/output and regenerates the committed project-owned fixture artifact by default; `npm run check:rhyme-data` regenerates to a temporary output and fails on byte/hash divergence.
- CI regenerates into a temporary location.
- Load after the first interactive frame, decode in bounded chunks, publish atomically.
- Never parse raw CMU, query SQLite, or statically parse large JSON on the typing path.

## Settled Decisions

The format must represent all already accepted production tables and flags, but Phase 03 inputs are project-owned fixtures with explicit provenance. Phase 04A—not Phase 03—must establish the exact CMU pin and pin `words/subtlex-word-frequencies` release `2.0.0`, retaining its published ISC notice, Brysbaert & New citation, and the caveat that the Ghent original download page does not itself state ISC; Phase 04A also owns the complete NOTICE and final production source hashes.

## Open Questions

None.

## Dependencies

- Depends on: `lyricslab-5iw.2`
- Parallel-safe: no

## Acceptance Evidence

Two clean fixture regenerations are byte/hash identical; the manifest and fixture provenance are reviewable; version mismatch, truncation, section-bounds errors, and corruption fail safely; bounded asynchronous loading publishes only a complete ready engine; retry retains the last good state; hot-path exclusions are verified.

## Quality Gates

`npm test`; `npm run typecheck`; `npm run build:rhyme-data`; `npm run check:rhyme-data`; `npx expo config --type public`.

## Replanning Triggers

The generic format cannot represent the accepted production tables/flags, deterministic bytes cannot be achieved, the data cannot fit the bounded mobile loading model, or Expo SDK APIs differ materially from plan assumptions.

## Implementation Hypotheses

Prefer an explicit format header plus typed numeric sections and a thin runtime decoder; validate the exact encoding and chunking against measured repository/runtime constraints.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
