# Loop State

Canonical tracker: Beads epic `lyricslab-jd5`

This file is a compact resume aid only. If this file disagrees with Beads, Beads wins.

Status: active

Stream: `expo-webview-rebuild`

Workflow: `orchestrator-callback`

Current phase: Phase 4 - WebView bridge and body persistence

Current Beads issue: `lyricslab-jd5.4`

Current PR: https://github.com/dirtydishes/lyricslab/pull/13

Last completed phase: Phase 3 - Tiptap editor web bundle (`lyricslab-jd5.3`)

Blocked: no

## Decisions

- Use Expo/React Native as a rebuild lane beside the Swift app.
- Use a WebView-hosted Tiptap editor for lyric body editing.
- Keep the first stream focused on editor viability and basic songs flow.
- Defer rhyme highlighting, iCloud, IAP, audio, AI, and theme parity.

## Context To Keep

- Loop topology is orchestrator-callback: orchestrator selects phases, spawns implementation/review threads, receives callbacks, updates Beads first, mirrors loop-state, then continues.
- Implementation thread callback: `implementation-callback` with status `pr-ready|blocked`.
- Review thread callback: `review-callback` with status `approved|repaired|blocked` and CI state.
- The first risk to prove is WebView editor + keyboard suggestion bar + insert-at-cursor.
- Native owns songs/title/navigation/persistence/suggestion bar.
- WebView owns body editing/cursor/selection/editor JSON.
- Store `bodyJson` and `bodyText`; do not store HTML as canonical state.
- Do not delete or restructure the Swift app in this stream.
- Continue the implementation stream from branch `lavender/expo-webview-rebuild-test`.
- `feat/expo-webview-rebuild` is only the original loop-doc base after the Phase 1 merge was moved off it.

## Phase Ledger

| Phase | Beads Issue | Status | PR | Turn Doc |
|---|---|---|---|---|
| 1 | `lyricslab-jd5.1` | closed; review repaired; CI unavailable with evidence; replayed on `lavender/expo-webview-rebuild-test` | https://github.com/dirtydishes/lyricslab/pull/10 | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.1.md` |
| 2 | `lyricslab-jd5.2` | closed; review repaired; CI unavailable with evidence; merged into `lavender/expo-webview-rebuild-test` | https://github.com/dirtydishes/lyricslab/pull/11 | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.2.md` |
| 3 | `lyricslab-jd5.3` | closed; review repaired; CI unavailable with evidence; merged into `lavender/expo-webview-rebuild-test` | https://github.com/dirtydishes/lyricslab/pull/12 | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.3.md` |
| 4 | `lyricslab-jd5.4` | implementation PR ready, review pending | https://github.com/dirtydishes/lyricslab/pull/13 | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.4.md` |
| 5 | `lyricslab-jd5.5` | pending | none | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.5.md` |
| 6 | `lyricslab-jd5.6` | pending | none | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.6.md` |

## Last Coordinator Update

2026-06-29: Implementation callback received for `lyricslab-jd5.4`. Draft PR #13 is open from `lavender/lyricslab-jd5-4-webview-bridge-body-persistence` into `lavender/expo-webview-rebuild-test`; mobile/editor-web local gates were reported green, manual Expo device/simulator smoke was unavailable, and GitHub status checks were empty at callback time. Review thread is being launched with `thermo-nuclear-code-quality-review` and CI ownership.
