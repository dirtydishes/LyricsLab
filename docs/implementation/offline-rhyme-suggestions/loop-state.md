# Loop State

Canonical tracker: Beads epic `lyricslab-8um`

This file is a compact resume aid only. If this file disagrees with Beads, Beads wins.

Status: active

Stream: `offline-rhyme-suggestions`

Workflow: `orchestrator-callback`

Current phase: none

Current Beads issue: none

Current PR: none

Last completed phase: 05 (`lyricslab-gg4`)

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
| 03 | `lyricslab-8um.1` | closed | `https://github.com/dirtydishes/lyricslab/pull/18` | `turn-docs/lyricslab-phase-03.md` |
| 04 | `lyricslab-8um.4` | closed | `https://github.com/dirtydishes/lyricslab/pull/19` | `turn-docs/lyricslab-phase-04.md` |
| 05 | `lyricslab-gg4` | closed | `https://github.com/dirtydishes/lyricslab/pull/20` | `turn-docs/lyricslab-phase-05.md` |
| 06 | `lyricslab-8um.2` | open | none | `turn-docs/lyricslab-phase-06.md` |
| 07 | `lyricslab-bhs` | open | none | `turn-docs/lyricslab-phase-07.md` |

## Last Coordinator Update

Phase 05 closed after PR #20 merged into `lavender/expo-clean-rebuild` at merge commit `8443b14581ba8fe0d93479f2b5189c40a4481499`. Thermo-nuclear review repaired candidate filtering and reported `ci-unavailable-with-evidence`; `npm test`, focused suggestion tests, `npm run typecheck`, `npm run editor:test`, `npm run smoke:rhyme-artifact`, and `git diff --check` passed with no findings remaining. `bd ready --json` now selects Phase 06 (`lyricslab-8um.2`) as the next expected phase, pending the required selector report.
