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

## Research Recommendation Map

| Research recommendation | Loop phase or follow-up | Boundary |
|---|---|---|
| Exact-tail core | Phase 03 `lyricslab-8um.1` | MVP core inside `src/rhyme/`: strict last-stressed-vowel tail candidate generation with small fixtures. |
| CMU pronunciation base and artifact | Phase 04 `lyricslab-8um.4` | MVP data pipeline: deterministic generated artifact/indexes from `data/cmudict.txt`; no raw CMU parsing or hot-path SQL lookup while typing. |
| Native suggestion bar UX | Phase 02 `lyricslab-xoc` and Phase 05 `lyricslab-gg4` | MVP product surface: typed provider contract first, native integration second, with stable IDs, fallback behavior, and no bridge widening. |
| Weighted slant and explainable ranking | Phase 06 `lyricslab-8um.2` | MVP ranking guard: bounded deterministic slant scoring, matched-syllable/stress/repetition signals, and non-default performance evidence where useful. |
| Privacy and local-first operation | All MVP phases | No lyric body text, cursor context, search text, rhyme queries, or suggestion candidates should be logged or sent to external services. |
| Active rhyme or scheme prediction | MVP-lite in Phase 05/06; stronger model follow-up | Use only simple local anchor/family signals if they fit the native provider shape; defer HMM/EM-style section templates and broader scheme modeling. |
| Evaluation and performance | Phases 03, 06, and 07; broader corpus follow-up | MVP gates cover fixtures, lookup/performance guardrails, and device evidence; annotated corpora, acceptance-rate metrics, and trust studies are post-MVP. |
| WebView highlighting and decoration spans | Follow-up | Deferred: no ProseMirror/Tiptap decorations, highlight/span packets, or bridge widening in this loop. |
| Phrase or mosaic rhyme visualization | Follow-up | Deferred: no phrase-rhyme visualization, selected-span extraction UI, or density analysis view in the MVP typing path. |
| Teachable slant preferences | Follow-up | Deferred: no Strict/Balanced/Loose controls, persistent user-trained families, or learning signals in this loop. |
| Neural ranking, model inference, and AI collaborator flows | Follow-up | Deferred: MVP remains deterministic, explainable, offline, and CMU-backed with no model or external API dependency. |
| Sync, IAP, and audio | Follow-up outside this loop | Deferred: Phase 07 may file or confirm follow-ups, but monetization, cloud sync, and recording/audio stay separate from offline rhyme suggestions. |

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
