# Loop State

Canonical tracker: Beads epic `lyricslab-jd5`

This file is a compact resume aid only. If this file disagrees with Beads, Beads wins.

Status: active

Stream: `expo-webview-rebuild`

Workflow: `orchestrator-callback`

Current phase: none

Current Beads issue: none

Current PR: none

Last completed phase: Phase 6 - Offline bundle and viability gate (`lyricslab-jd5.6`)

Blocked: no

## Decisions

- Use Expo/React Native as a rebuild lane beside the Swift app.
- Use a WebView-hosted Tiptap editor for lyric body editing.
- Keep the first stream focused on editor viability and basic songs flow.
- Defer rhyme highlighting, iCloud, IAP, audio, AI, and theme parity.
- Phase 6 implementation recommendation: continue the Expo/WebView rebuild with follow-ups. Offline/local editor loading passed automated Chromium smoke without a dev server; real-device Expo runtime checklist remains required before Swift removal or main-lane migration cleanup.

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
- Phase 6 generated offline HTML lives at `apps/mobile/src/editor/generated/editorHtml.ts` and is rebuilt with `npm --prefix apps/mobile run build:editor-html`.
- Phase 6 follow-ups filed: `lyricslab-bhs` real-device checklist, `lyricslab-xoc` generated HTML freshness guard, and `lyricslab-gg4` offline rhyme-backed suggestions.

## Phase Ledger

| Phase | Beads Issue | Status | PR | Turn Doc |
|---|---|---|---|---|
| 1 | `lyricslab-jd5.1` | closed; review repaired; CI unavailable with evidence; replayed on `lavender/expo-webview-rebuild-test` | https://github.com/dirtydishes/lyricslab/pull/10 | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.1.md` |
| 2 | `lyricslab-jd5.2` | closed; review repaired; CI unavailable with evidence; merged into `lavender/expo-webview-rebuild-test` | https://github.com/dirtydishes/lyricslab/pull/11 | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.2.md` |
| 3 | `lyricslab-jd5.3` | closed; review repaired; CI unavailable with evidence; merged into `lavender/expo-webview-rebuild-test` | https://github.com/dirtydishes/lyricslab/pull/12 | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.3.md` |
| 4 | `lyricslab-jd5.4` | closed; review repaired; CI unavailable with evidence; merged into `lavender/expo-webview-rebuild-test` | https://github.com/dirtydishes/lyricslab/pull/13 | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.4.md` |
| 5 | `lyricslab-jd5.5` | closed; review repaired; CI unavailable with evidence; merged into `lavender/expo-webview-rebuild-test` | https://github.com/dirtydishes/lyricslab/pull/14 | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.5.md` |
| 6 | `lyricslab-jd5.6` | closed; review repaired; CI unavailable with evidence; merged into `lavender/expo-webview-rebuild-test` | https://github.com/dirtydishes/lyricslab/pull/15 | `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.6.md` |

## Last Coordinator Update

2026-06-29: Review callback received for `lyricslab-jd5.6` with status `repaired` and CI state `ci-unavailable-with-evidence`. PR #15 was marked ready and merged into `lavender/expo-webview-rebuild-test` at merge commit `b5b8d533ccb540c7ff8bacb74533be33c6039b21`. Beads issue `lyricslab-jd5.6` was closed. All phase children are closed; stream is in storyboard closeout.
