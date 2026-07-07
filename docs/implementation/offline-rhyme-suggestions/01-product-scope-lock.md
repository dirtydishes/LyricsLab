# Phase 01: Product Scope Lock

Canonical Beads issue: `lyricslab-8um.5`

Epic: `lyricslab-8um`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Align product, plan, architecture, and testing docs around the exact MVP boundary for offline rhyme suggestions.

## Scope

Allowed:

- Update `requirements.md`, `plan.md`, `architecture.md`, and `testing.md`.
- Define MVP as deterministic offline CMU-backed suggestions in the native suggestion bar.
- Document `src/rhyme/` as the pure TypeScript rhyme module boundary.
- Record constraints: offline-first, no external APIs, no lyric content logging, no hot-path SQL queries, typing responsiveness.
- Explicitly defer WebView highlighting, phrase-rhyme visualization, teachable slant preferences, neural ranking, AI, IAP, sync, and audio.

Out of scope:

- Implementing the rhyme engine.
- Widening the WebView bridge.
- Changing UI behavior beyond doc wording.

## Inputs

- `docs/research/rhyme-engine-deep-research-report.md`
- `requirements.md`
- `plan.md`
- `architecture.md`
- `testing.md`
- `agents.md`

## Implementation Notes

The research report recommends a broad engine. This phase translates it into a narrow MVP contract and follow-up list so implementation agents do not absorb post-MVP work by accident.

## Beads

- Epic: `lyricslab-8um`
- Issue: `lyricslab-8um.5`
- Depends on: `lyricslab-8um.3`
- Parallel-safe: `false`

## Expected Files Or Areas

- `requirements.md`
- `plan.md`
- `architecture.md`
- `testing.md`
- Maybe `docs/implementation/offline-rhyme-suggestions/00-roadmap.md`

## Suggested Swarms

- Scout docs for conflicting MVP/post-MVP statements.
- Slice-plan doc edits by product scope, architecture boundary, and test strategy.
- Implementation helpers may draft focused doc patches only.

## Quality Gates

- `npm test`
- `npm run typecheck`

## Completion Criteria

- Product docs agree on MVP versus post-MVP scope.
- Every major research recommendation maps to this loop or a follow-up.
- The next phase can rely on a stable suggestion contract target.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.

