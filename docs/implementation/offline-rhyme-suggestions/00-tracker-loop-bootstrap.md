# Phase 00: Tracker And Loop Bootstrap

Canonical Beads issue: `lyricslab-8um.3`

Epic: `lyricslab-8um`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Make the offline-rhyme-suggestions loop durable and runnable before any app code changes begin.

## Scope

Allowed:

- Verify Beads is usable from this checkout.
- Preserve the imported Beads state and update it with this loop's epic, child issues, dependencies, and metadata.
- Generate `docs/implementation/offline-rhyme-suggestions/` docs, prompts, schemas, and turn-doc placeholders.
- Keep generated paths repo-relative.
- Keep callback targets as `RUNTIME_ORCHESTRATOR_THREAD_ID` placeholders.
- Treat `docs/research/rhyme-engine-deep-research-report.md` as a loop input.

Out of scope:

- App code changes.
- Product scope changes beyond recording the finalized plan.
- Starting implementation/review threads.

## Inputs

- Finalized chat plan for the offline rhyme suggestions loop.
- `docs/research/rhyme-engine-deep-research-report.md`
- `requirements.md`
- `plan.md`
- `architecture.md`
- `testing.md`
- Existing Beads issues `lyricslab-xoc`, `lyricslab-gg4`, and `lyricslab-bhs`

## Implementation Notes

This phase may be completed by the loop-creation thread. Do not create an implementation PR unless repo policy requires one for docs/tracker setup. Record the initial dirty worktree state in the turn doc.

## Beads

- Epic: `lyricslab-8um`
- Issue: `lyricslab-8um.3`
- Depends on: none
- Parallel-safe: `false`

## Expected Files Or Areas

- `.beads/issues.jsonl`
- `docs/implementation/offline-rhyme-suggestions/`

## Suggested Swarms

Tiny-phase exception allowed: this phase is bootstrap/docs/tracker setup. If a worker runs it, a small scout can verify Beads and docs consistency, but full implementation swarms are not required.

## Quality Gates

- `bd ready --json`
- `bd show lyricslab-8um --json`
- `bd export -o .beads/issues.jsonl`

## Completion Criteria

- Beads routes the first ready phase.
- Loop docs and prompts exist.
- Schemas exist under `docs/implementation/offline-rhyme-suggestions/schemas/`.
- No concrete callback target is baked into generated artifacts.
- No app code is changed.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.

