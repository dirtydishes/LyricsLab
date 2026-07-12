# Loop State

Canonical tracker: Beads epic `lyricslab-8um`

This file is a compact resume aid only. If this file disagrees with Beads, Beads wins.

Status: complete

Stream: `offline-rhyme-suggestions`

Workflow: `orchestrator-callback`

Current phase: none

Current Beads issue: none

Current PR: none

Last completed phase: 07 (`lyricslab-bhs`)

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
| 07 | `lyricslab-bhs` | closed | `https://github.com/dirtydishes/lyricslab/pull/22` | `turn-docs/lyricslab-phase-07.md` |

## Last Coordinator Update

Phase 07 and epic `lyricslab-8um` are closed after PR #22 merged into `lavender/expo-clean-rebuild` at merge commit `14ac4cf51fb175ab46cce158fe09205813dc1f7a`. Thermo-nuclear and Impeccable review repaired follow-up mappings and generator whitespace and reported `ci-unavailable-with-evidence`; all final product, artifact, storyboard, browser, and diff gates passed with no findings remaining. The verified storyboard is `storyboard-post-run-07-11-2026.html`, and all eight post-MVP follow-ups are filed. Physical-device validation is unavailable on this Debian host, so the manual checklist still blocks declaring the Expo lane primary even though the offline-rhyme implementation stream is complete.
