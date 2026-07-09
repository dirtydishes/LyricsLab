# Loop State

Canonical tracker: Beads epic `lyricslab-8um`

This file is a compact resume aid only. If this file disagrees with Beads, Beads wins.

Status: active

Stream: `offline-rhyme-suggestions`

Workflow: `orchestrator-callback`

Current phase: none

Current Beads issue: none

Current PR: none

Last completed phase: 02 (`lyricslab-xoc`)

Blocked: no

## Decisions

- MVP scope is offline CMU-backed native suggestions, not WebView highlighting.
- External APIs, AI collaborator room, IAP, sync, audio, neural ranking, and user-teachable slant preferences are follow-up work unless explicitly approved.
- The bridge remains narrow for this loop. No highlight span protocol or ProseMirror decoration work belongs here.
- One active implementation PR at a time.
- Callback targets are runtime-bound. Generated artifacts use `RUNTIME_ORCHESTRATOR_THREAD_ID` until `dirtyloops run` binds the real orchestrator callback target.

## Context To Keep

- Native owns songs, title input, persistence orchestration, and the suggestion bar.
- WebView owns body editing, selection/cursor context, and Tiptap JSON.
- Canonical lyric body state remains `bodyJson` plus `bodyText`; generated HTML is runtime bundle output only.
- `data/cmudict.txt` is product data for the offline rhyme engine.
- Do not log user lyric content.

## Phase Ledger

| Phase | Beads Issue | Status | PR | Turn Doc |
|---|---|---|---|---|
| 00 | `lyricslab-8um.3` | closed | none | `turn-docs/lyricslab-phase-00.md` |
| 01 | `lyricslab-8um.5` | closed | `https://github.com/dirtydishes/lyricslab/pull/16` | `turn-docs/lyricslab-phase-01.md` |
| 02 | `lyricslab-xoc` | closed | `https://github.com/dirtydishes/lyricslab/pull/17` | `turn-docs/lyricslab-phase-02.md` |
| 03 | `lyricslab-8um.1` | open | none | `turn-docs/lyricslab-phase-03.md` |
| 04 | `lyricslab-8um.4` | open | none | `turn-docs/lyricslab-phase-04.md` |
| 05 | `lyricslab-gg4` | open | none | `turn-docs/lyricslab-phase-05.md` |
| 06 | `lyricslab-8um.2` | open | none | `turn-docs/lyricslab-phase-06.md` |
| 07 | `lyricslab-bhs` | open | none | `turn-docs/lyricslab-phase-07.md` |

## Last Coordinator Update

Phase 02 closed after PR #17 merged into `lavender/expo-clean-rebuild` at merge commit `fca3a8313d65a3e40091b22ff88c28d942deaf62`. Thermo-nuclear review approved with `ci-unavailable-with-evidence`; `npm test`, `npm run typecheck`, `npm run editor:test`, `npm run check:editor-html`, and `git diff --check` passed. `bd ready --json` now selects Phase 03 (`lyricslab-8um.1`) as the next expected phase.
