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

2026-06-29 implementation thread:

- Created branch `lavender/lyricslab-jd5-6-offline-bundle-viability-gate` from `lavender/expo-webview-rebuild-test` at `3242b97`.
- Added `scripts/build-editor-html.mjs`, which reads `apps/editor-web/dist/index.html`, inlines the built JS/CSS assets, escapes inline `</script>` substrings, preserves Vite's `type="module"` deferred execution semantics, and writes `apps/mobile/src/editor/generated/editorHtml.ts`.
- Added `npm --prefix apps/mobile run build:editor-html` as the mobile package command for rebuilding the embedded editor HTML.
- Changed `EditorWebView` to default to the generated local HTML source with `baseUrl: https://lyricslab.local/`.
- Kept explicit dev-server override support through the `editorUrl` prop, `Constants.expoConfig.extra.editorWebUrl`, or `EXPO_PUBLIC_EDITOR_WEB_URL`.
- Added bridge tests for local HTML source selection versus explicit remote URL selection.
- Generated `apps/mobile/src/editor/generated/editorHtml.ts` from the production `apps/editor-web` build. The generated artifact is about 411 KB because it embeds the Tiptap/ProseMirror editor bundle needed for offline WebView loading; it is chunked into deterministic string lines to keep reviews tractable.

## Subagent Swarms

No subagents used. Scope was narrow and implementation stayed inside the assigned Phase 6 files plus Beads follow-ups.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Not started. Review thread is owned by the orchestrator after this implementation callback.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `implementation-local-gates-passed`

Evidence:

- Install prerequisite: `npm ci` in `apps/editor-web` passed; 91 packages installed, 0 vulnerabilities reported.
- Install prerequisite: `npm ci` in `apps/mobile` passed; npm reported peer/deprecation/audit warnings and 10 moderate vulnerabilities.
- `npm --prefix apps/editor-web run build` passed. Vite built 52 modules; output included `dist/index.html`, `index-CFeqNU9l.css` at 1.08 kB, and `index-1u5Mtgjy.js` at 407.46 kB.
- `npm --prefix apps/mobile run build:editor-html` passed and wrote `apps/mobile/src/editor/generated/editorHtml.ts` with 2 inlined assets.
- `node scripts/build-editor-html.mjs` passed after the final standalone editor build, confirming the generated mobile artifact was synchronized.
- `npm --prefix apps/editor-web test` passed: 1 test file, 4 tests.
- `npm --prefix apps/mobile run typecheck` passed.
- `npm --prefix apps/mobile test` passed: 4 test suites, 20 tests.
- Offline/local editor smoke passed with `/usr/bin/chromium --headless=new --no-sandbox --disable-gpu --virtual-time-budget=5000 --dump-dom file://<tmp-html>`. The generated HTML had no external `assets/` references, initialized `window.LyricsLabEditor`, returned `true` from `loadSong({ bodyText: "alpha\nbeta" })` and `insertSuggestion({ word: "midnight" })`, emitted `editorReady`, `selectionChanged`, and `contentChanged`, and ended with text `alphabetamidnight `.

Manual device checklist:

- Environment: Debian/Linux worktree on `linux x64`; `uname -a` reported `Linux deltaisland.io 6.12.90+deb13.1-amd64 ... x86_64 GNU/Linux`.
- Expo runtime: not performed. No Expo Go or development build session was attached in this implementation environment.
- Simulator/device: not performed. `xcrun` was not present, and no real iPhone was attached to this Linux worktree. `adb` was also not present.
- Checklist items not manually verified here: create song, edit title, type 20+ lyric lines, move cursor inside body, tap suggestions repeatedly, background/reopen app, navigate away/back, search by body text, keyboard bar position, and cursor-jump behavior.
- Closest automated evidence: mobile repository/search tests remained green, and the Chromium local-file smoke proved the offline editor bundle initializes and accepts `loadSong` plus repeated bridge commands without a dev server.

## PR And Commits

Pending.

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.6` `in_progress` after selector chose it as the final ready phase.

2026-06-29: Implementation thread created follow-up Beads issues without advancing `lyricslab-jd5.6`.

## Follow-Ups Filed

- `lyricslab-bhs` - Run Expo WebView real-device viability checklist.
- `lyricslab-xoc` - Guard generated editor HTML freshness.
- `lyricslab-gg4` - Replace placeholder suggestions with offline rhyme-backed suggestions.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 6 owns offline editor bundling and the final viability decision.
- Manual checklist: create song, edit title, type 20+ lyric lines, move cursor, tap suggestions repeatedly, background/reopen, navigate away/back, search by body text, confirm keyboard bar position, and confirm no obvious cursor jumping.
- Device smoke was blocked in this Linux implementation worktree; use `lyricslab-bhs` to capture real Expo runtime evidence before any Swift removal or main-lane migration cleanup.
- The offline editor bundle is generated from `apps/editor-web/dist` and must be regenerated with `npm --prefix apps/mobile run build:editor-html` when editor-web output changes.
- Viability decision from this implementation pass: continue Expo/WebView rebuild with follow-ups. Automated offline loading passed; real-device checklist remains required follow-up evidence.

## Closeout

Implementation is PR-ready after commit/push/PR creation. Final review, CI inspection, and Beads phase closeout remain orchestrator/reviewer responsibilities.
