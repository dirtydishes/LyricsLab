# Phase 04A: Production Artifact Assembly

Canonical Beads issue: `lyricslab-5iw.4a`

Epic: `lyricslab-5iw`

Status is tracked in Beads. This document preserves the user-approved 2026-07-12 sequence amendment and is decision-complete, implementation-open.

## Outcome

Pin the designated ISC-licensed `words/subtlex-word-frequencies` `2.0.0` package and exact CMU revision, then combine those sources with the reviewed Phase 04 project manifests to produce the complete committed production rhyme artifact and app-ready loader wiring.

## Why This Phase Exists

The final artifact cannot truthfully precede the project data authored in Phase 04, and pipeline mechanics should not be blocked by unresolved production-corpus rights. This phase reunites the proven Phase 03 framework with the complete authorized corpus before native UI integration.

## Scope

Allowed:

- Pin the exact CMU revision and retain its required license/acknowledgement.
- Pin `words/subtlex-word-frequencies` release `2.0.0` by package integrity/hash; retain its ISC © Zeke Sikelianos notice and the Brysbaert & New citation; document that the Ghent original download page does not itself state ISC, preserving the upstream relicensing/provenance caveat.
- Finalize source manifests, hashes, NOTICE text, and attribution.
- Compile reviewed Phase 04 rap, safety, and proper-noun inputs with the external sources into the versioned binary.
- Commit the production artifact, wire the production loader/engine factory, and verify reproducibility, integrity, bounded loading, and hot-path exclusions.

Out of scope:

- New lexicon curation, final suggestion UI, highlighting, phrase rhymes, G2P, fuzzy spelling, personalization, AI, audio, sync, IAP, Android, TestFlight, or lyric logging.

## Constraints

- Do not treat the Ghent download page itself as the ISC grant. The accepted distributable source is the pinned third-party package release and its published ISC notice, with the upstream provenance caveat retained.
- Do not silently replace `words/subtlex-word-frequencies` or SUBTLEX-US; a replacement changes the accepted commonness source and requires explicit approval.
- Two clean production regenerations must be byte-identical, and `check:rhyme-data` must regenerate to a temporary path.
- Production loading starts after the first interactive frame, decodes in bounded chunks, and atomically publishes only a complete engine.
- The typing path never parses raw CMU, queries SQLite, uses network access, or statically parses large JSON.

## Settled Decisions

The user approved this explicit later assembly phase on 2026-07-12. Phase 03 owns the generic framework, Phase 04 owns reviewed project sources, Phase 04A owns production source authorization and artifact assembly, and Phase 05 consumes the completed production engine.

## Open Questions

None for implementation. If the exact package tarball/integrity, its ISC notice, or the mapping from the packaged 74,286 counts to the cited SUBTLEX-US source cannot be verified, record the upstream caveat and stop for a release decision rather than choosing a replacement.

## Dependencies

- Depends on: `lyricslab-5iw.4`
- Parallel-safe: no

## Acceptance Evidence

The `subtlex-word-frequencies` `2.0.0` package integrity, ISC notice, Brysbaert & New citation, and upstream caveat are reviewable; the exact CMU pin/license and all project-source hashes are recorded; all Phase 04 source checks remain green; two clean production regenerations are byte-identical; version/corruption/bounds controls fail safely; bounded asynchronous loading and atomic publication pass; the app-ready artifact is committed; hot-path exclusions and all phase gates pass.

## Quality Gates

`npm test`; `npm run typecheck`; `npm run build:rhyme-data`; `npm run check:rhyme-data`; `npx expo config --type public`.

## Replanning Triggers

The pinned package contents/integrity or its upstream provenance cannot be verified well enough for release, the exact CMU source cannot be pinned, reviewed Phase 04 inputs do not satisfy the format/safety contract, deterministic production bytes cannot be achieved, or production loading exceeds the accepted mobile model.

## Implementation Hypotheses

Reuse the Phase 03 manifest/format/decoder without widening editor-facing types. Production-specific work should be data manifests, attribution, artifact generation, and a thin engine-construction adapter.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
