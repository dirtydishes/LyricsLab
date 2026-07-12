# Loop State

Canonical tracker: Beads epic `lyricslab-8um`

This file is a compact resume aid only. If this file disagrees with Beads, Beads wins.

Status: active

Stream: `offline-rhyme-suggestions`

Workflow: `orchestrator-callback`

Current phase: none

Current Beads issue: none

Current PR: none

Last completed phase: 06 (`lyricslab-8um.2`)

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
| 06 | `lyricslab-8um.2` | closed | `https://github.com/dirtydishes/lyricslab/pull/21` | `turn-docs/lyricslab-phase-06.md` |
| 07 | `lyricslab-bhs` | open | none | `turn-docs/lyricslab-phase-07.md` |

## Last Coordinator Update

Phase 06 closed after PR #21 merged into `lavender/expo-clean-rebuild` at merge commit `7b29c77598b8f0060ce80d4f46342eb28d63f3f0`. Thermo-nuclear review repaired module depth, exact repetition ranking, and bounded slant discovery and reported `ci-unavailable-with-evidence`; default tests, typecheck, editor tests, artifact smoke, the non-default ranking benchmark, script syntax, and diff checks passed with no findings remaining. `bd ready --json` now selects Phase 07 (`lyricslab-bhs`) as the next expected phase, pending the required selector report.
