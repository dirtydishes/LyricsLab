# Loop State

Canonical tracker: Beads epic `lyricslab-jd5`

This file is a compact resume aid only. If this file disagrees with Beads, Beads wins.

Status: active

Stream: `expo-webview-rebuild`

Workflow: `orchestrator-callback`

Current phase: none

Current Beads issue: none

Current PR: none

Last completed phase: none

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

## Phase Ledger

| Phase | Beads Issue | Status | PR | Turn Doc |
|---|---|---|---|---|
| 1 | `lyricslab-jd5.1` | pending | none | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.1.md` |
| 2 | `lyricslab-jd5.2` | pending | none | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.2.md` |
| 3 | `lyricslab-jd5.3` | pending | none | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.3.md` |
| 4 | `lyricslab-jd5.4` | pending | none | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.4.md` |
| 5 | `lyricslab-jd5.5` | pending | none | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.5.md` |
| 6 | `lyricslab-jd5.6` | pending | none | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.6.md` |

## Last Coordinator Update

Loop created and phased. Corrected workflow to `orchestrator-callback`; implementation not started.
