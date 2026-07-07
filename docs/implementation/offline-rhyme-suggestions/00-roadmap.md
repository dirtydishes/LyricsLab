# Offline Rhyme Suggestions MVP Roadmap

Canonical tracker: Beads epic `lyricslab-8um`

## Plan Source

This roadmap is compiled from the finalized chat plan for the next autonomous loop, the current Expo rebuild docs, and `docs/research/rhyme-engine-deep-research-report.md`.

## Outcome

Replace placeholder suggestion behavior with deterministic offline rhyme-backed suggestions while keeping the editor bridge narrow, preserving local-first storage, protecting cursor/selection behavior, and deferring post-MVP product areas.

## Phase Sequence

1. `lyricslab-8um.3` - Phase 00: Tracker and loop bootstrap
2. `lyricslab-8um.5` - Phase 01: Product scope lock
3. `lyricslab-xoc` - Phase 02: Editor baseline and suggestion contract
4. `lyricslab-8um.1` - Phase 03: Pure rhyme core with fixtures
5. `lyricslab-8um.4` - Phase 04: CMU artifact pipeline
6. `lyricslab-gg4` - Phase 05: Native suggestion integration
7. `lyricslab-8um.2` - Phase 06: Slant ranking and performance guard
8. `lyricslab-bhs` - Phase 07: Device evidence and closeout

## Dependencies

The loop is serialized:

`00 -> 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07`

The imported follow-ups `lyricslab-xoc`, `lyricslab-gg4`, and `lyricslab-bhs` are folded into this epic as Phase 02, Phase 05, and Phase 07. They retain their original historical dependency on the closed Expo WebView viability phase while also joining this loop's phase chain.

## Risks

- Beads was recovered by auto-importing `.beads/issues.jsonl`; future runners should verify `bd ready --json` before launching a worker.
- The worktree had pre-existing user changes when the loop was created: `agents.md` modified, `docs/implementation/expo-root-cleanup.md` deleted, and `docs/research/` untracked.
- The bridge is a product boundary. Do not widen it for highlighting in this loop.
- Full CMU data should not be parsed on every typing path.
- Real-device validation may require human/device evidence and may be unavailable to worker threads.

## Quality Gates

- `npm test`
- `npm run typecheck`
- `npm run editor:test`
- `npm run build:editor-html` when editor-web or WebView loading changes
- `npx expo config --type public` when Expo config or dependencies change

## Closeout

The final closeout artifact is:

`docs/implementation/offline-rhyme-suggestions/storyboard-post-run-mm-dd-yyyy.html`

