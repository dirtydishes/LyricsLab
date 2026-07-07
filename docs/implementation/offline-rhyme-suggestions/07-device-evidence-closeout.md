# Phase 07: Device Evidence And Closeout

Canonical Beads issue: `lyricslab-bhs`

Epic: `lyricslab-8um`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Close the loop with automated evidence, available physical-device evidence, follow-up filing, and storyboard generation.

## Scope

Allowed:

- Run automated gates.
- Run `npx expo config --type public` when relevant.
- Attempt or record physical-device checklist evidence.
- Record whether physical-device evidence is unavailable.
- File follow-up Beads issues for highlighting, phrase rhymes, audio, IAP, sync, AI collaborator room, neural reranking, and user-teachable slant preferences if they are not already filed.
- Generate `storyboard-post-run-mm-dd-yyyy.html` after the epic is complete.

Out of scope:

- Implementing follow-up features.
- Declaring the Expo rebuild primary without device evidence.
- Removing Swift or historical implementation artifacts.

## Inputs

- `testing.md`
- `docs/implementation/offline-rhyme-suggestions/turn-docs/`
- Final PRs/commits from this loop
- Beads epic `lyricslab-8um`

## Implementation Notes

This phase inherits the existing real-device viability checklist requirement: create a song, edit title/body, type lyric lines, move cursor inside body, tap suggestions repeatedly, background/reopen, navigate away/back, search by body text, check keyboard bar position, and verify offline/airplane-mode core writing behavior.

## Beads

- Epic: `lyricslab-8um`
- Issue: `lyricslab-bhs`
- Depends on: `lyricslab-8um.2`
- Parallel-safe: `false`

## Expected Files Or Areas

- `testing.md`
- `docs/implementation/offline-rhyme-suggestions/`
- `.beads/issues.jsonl`
- `package.json` only if closeout installs `@pierre/diffs`

## Suggested Swarms

- Scout final Beads/PR/gate state.
- Review/CI agents own any final gate repair.
- Storyboard synthesis swarm can summarize phase deltas and evidence.

## Quality Gates

- `npm test`
- `npm run typecheck`
- `npm run editor:test`
- `npm run build:editor-html`
- `npx expo config --type public`
- Physical-device checklist when available

## Completion Criteria

- All loop phases are closed or explicitly blocked with evidence.
- Review/CI state is resolved.
- Device evidence is recorded or explicitly unavailable.
- Follow-ups are filed instead of widened into this loop.
- Storyboard is generated and verified.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.

