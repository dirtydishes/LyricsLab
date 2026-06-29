# Phase 6 Turn Doc: Offline bundle and viability gate

Beads issue: `lyricslab-jd5.6`

Phase doc: `docs/implementation/expo-webview-rebuild/06-offline-bundle-viability-gate.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by selector subagent on 2026-06-29.

- Beads issue: `lyricslab-jd5.6`
- Phase: Offline bundle and viability gate
- Active stream branch: `lavender/expo-webview-rebuild-test`
- Expected PR base: `lavender/expo-webview-rebuild-test`
- Why ready: Beads reports `lyricslab-jd5.6` as the only ready child; blocker `lyricslab-jd5.5` is closed.

## Scope

Bundle `apps/editor-web` for local/offline WebView loading in `apps/mobile`, run automated gates, perform and document the manual editor viability checklist where possible, record the final Expo/WebView rebuild decision, and file follow-up Beads issues for post-gate work if the lane passes.

Out of scope: implementing post-gate follow-ups, rhyme highlighting, rhyme suggestions beyond placeholder suggestions, Swift app removal, and migration cleanup.

## Implementation Log

Implementation callback received on 2026-06-29.

- Status: `pr-ready`
- Branch: `lavender/lyricslab-jd5-6-offline-bundle-viability-gate`
- PR: https://github.com/dirtydishes/lyricslab/pull/15
- Commits:
  - `20fda54879eb4391c8858a7eaa1ea6447caba9a1`
  - `645c5e842c013fcf55e4f151e4cc54eb576fe5f7`
- Generated offline editor HTML is the default WebView source; explicit dev URL overrides still work through `editorUrl`, Expo `extra.editorWebUrl`, or `EXPO_PUBLIC_EDITOR_WEB_URL`.
- The generated artifact is about 411 KB because it embeds the Tiptap/ProseMirror bundle. The build script escapes inline `</script>` substrings and preserves `type=module` deferred execution.
- Viability recommendation recorded by implementation: continue Expo/WebView rebuild with follow-ups; real-device Expo runtime checklist remains required before Swift removal or main-lane cleanup.

## Subagent Swarms

Not started.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Not started.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `not-started`

Evidence:

- Implementation thread reported `npm --prefix apps/editor-web run build` passed; Vite built 52 modules with JS 407.46 kB and CSS 1.08 kB.
- Implementation thread reported `npm --prefix apps/mobile run build:editor-html` passed and wrote generated `editorHtml.ts` with 2 inlined assets.
- Implementation thread reported `npm --prefix apps/editor-web test` passed with 1 test file and 4 tests.
- Implementation thread reported `npm --prefix apps/mobile run typecheck` passed.
- Implementation thread reported `npm --prefix apps/mobile test` passed with 4 suites and 20 tests.
- Implementation thread reported offline/local WebView load smoke via `/usr/bin/chromium --headless` against `file://` generated HTML passed: `hasEditor true`, `loadSong true`, `insertSuggestion true`, and emitted `editorReady`, `selectionChanged`, and `contentChanged`.
- Manual device checklist was blocked in the Linux worktree: no Expo Go/dev-build session, no iOS simulator or real iPhone attached, `xcrun` and `adb` unavailable.

## PR And Commits

Draft PR: https://github.com/dirtydishes/lyricslab/pull/15

GitHub state observed by orchestrator after callback:

- Head: `lavender/lyricslab-jd5-6-offline-bundle-viability-gate`
- Base: `lavender/expo-webview-rebuild-test`
- Draft: yes
- Merge state: `CLEAN`
- Mergeable: `MERGEABLE`
- Status checks: empty `statusCheckRollup`

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.6` `in_progress` after selector chose it as the final ready phase.

2026-06-29: Orchestrator recorded the implementation callback in Beads before launching the review thread.

## Follow-Ups Filed

- `lyricslab-bhs` - real-device checklist.
- `lyricslab-xoc` - generated HTML freshness guard.
- `lyricslab-gg4` - offline rhyme-backed suggestions.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 6 owns offline editor bundling and the final viability decision.
- Manual checklist: create song, edit title, type 20+ lyric lines, move cursor, tap suggestions repeatedly, background/reopen, navigate away/back, search by body text, confirm keyboard bar position, and confirm no obvious cursor jumping.
- If device smoke is blocked, record exact blocker with evidence and use the closest automated smoke evidence available.
- Real-device Expo runtime checklist remains required before Swift removal or main-lane cleanup.

## Closeout

Not started.
