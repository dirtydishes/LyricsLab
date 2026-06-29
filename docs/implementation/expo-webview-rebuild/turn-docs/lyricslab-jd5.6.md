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
- Created branch `lavender/lyricslab-jd5-6-offline-bundle-viability-gate` from `lavender/expo-webview-rebuild-test` at `3242b97`.
- Added `scripts/build-editor-html.mjs`, which reads `apps/editor-web/dist/index.html`, inlines the built JS/CSS assets, escapes inline `</script>` substrings, preserves Vite's `type="module"` deferred execution semantics, and writes `apps/mobile/src/editor/generated/editorHtml.ts`.
- Added `npm --prefix apps/mobile run build:editor-html` as the mobile package command for rebuilding the embedded editor HTML.
- Changed `EditorWebView` to default to the generated local HTML source with `baseUrl: https://lyricslab.local/`.
- Kept explicit dev-server override support through the `editorUrl` prop, `Constants.expoConfig.extra.editorWebUrl`, or `EXPO_PUBLIC_EDITOR_WEB_URL`.
- Added bridge tests for local HTML source selection versus explicit remote URL selection.
- Generated `apps/mobile/src/editor/generated/editorHtml.ts` from the production `apps/editor-web` build. The generated artifact is about 411 KB because it embeds the Tiptap/ProseMirror editor bundle needed for offline WebView loading; it is chunked into deterministic string lines to keep reviews tractable.
- Viability recommendation recorded by implementation: continue Expo/WebView rebuild with follow-ups; real-device Expo runtime checklist remains required before Swift removal or main-lane cleanup.

## Subagent Swarms

No subagents used. Scope was narrow and implementation stayed inside the assigned Phase 6 files plus Beads follow-ups.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

2026-06-29 review thread completed.

- Findings remaining: none.
- Scope discipline: Phase 6 stayed inside offline/local WebView source selection, deterministic bundle generation, gates, viability evidence, and post-gate follow-up filing. No Swift app removal, migration cleanup, rhyme highlighting, or rhyme-backed suggestion implementation was added.
- Maintainability review: the generated HTML artifact is large at about 411 KB, but it is isolated under `apps/mobile/src/editor/generated/editorHtml.ts`, generated from `apps/editor-web/dist`, split into deterministic string chunks, and accompanied by a rebuild script. The missing freshness guard is correctly filed as `lyricslab-xoc` rather than hidden as an untracked risk.
- WebView source review: `EditorWebView` now defaults to `{ html, baseUrl: "https://lyricslab.local/" }`; explicit dev URL overrides still win through the prop, Expo `extra.editorWebUrl`, or `EXPO_PUBLIC_EDITOR_WEB_URL`.
- Repairs made by review: merged the current `lavender/expo-webview-rebuild-test` base into the PR head, resolved the `.beads/issues.jsonl` and turn-doc conflicts by preserving orchestrator callback state plus implementation detail, and recorded review gate evidence in this turn doc.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `ci-unavailable-with-evidence`; hosted GitHub checks are absent, and review-local gates passed.

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

Review rerun evidence:

- `npm ci` in `apps/editor-web` passed in this review worktree; 91 packages installed and 0 vulnerabilities reported.
- `npm ci` in `apps/mobile` passed in this review worktree with the existing Expo peer/deprecation warnings and 10 moderate audit findings.
- First `npm --prefix apps/editor-web run build` attempt failed before install because `tsc` was not present in this worktree; after `npm ci`, the same command passed. Vite built 52 modules and emitted JS 407.46 kB and CSS 1.08 kB.
- `npm --prefix apps/mobile run build:editor-html` passed, rebuilt editor-web, and wrote `apps/mobile/src/editor/generated/editorHtml.ts` with 2 inlined assets.
- Generated HTML freshness check: rerunning `build:editor-html` left `apps/mobile/src/editor/generated/editorHtml.ts` unchanged.
- `npm --prefix apps/editor-web test` passed: 1 test file, 4 tests.
- `npm --prefix apps/mobile run typecheck` passed.
- `npm --prefix apps/mobile test` passed: 4 suites, 20 tests.
- `git diff --check` passed.
- Offline/local editor smoke passed with `/usr/bin/chromium --headless=new --no-sandbox --disable-gpu --virtual-time-budget=10000 --dump-dom file:///tmp/lyricslab-phase6-offline-smoke.html`. The smoke page was generated from committed `editorHtml.ts`, had no external `assets/` references, initialized `window.LyricsLabEditor`, returned `true` from `loadSong({ bodyText: "alpha\nbeta" })` and `insertSuggestion({ word: "midnight" })`, emitted `editorReady`, `selectionChanged`, `contentChanged`, and `editorFocused`, and ended with text containing `betamidnight `.
- Hosted CI evidence: `gh pr view 15 --json statusCheckRollup` returned an empty `statusCheckRollup`, and `gh pr checks 15` reported no checks on the PR branch.
- Manual device checklist remains blocked in this Linux review worktree: `/usr/bin/chromium` is available, but `command -v adb` and `command -v xcrun` both exited 1 with no path; no Expo Go/development build session, Android device/emulator, iOS simulator, or real iPhone was attached.

## PR And Commits

- Branch: `lavender/lyricslab-jd5-6-offline-bundle-viability-gate`
- Draft PR: https://github.com/dirtydishes/lyricslab/pull/15
- Commits:
  - `20fda54879eb4391c8858a7eaa1ea6447caba9a1` - `add offline editor bundle gate`
  - `645c5e842c013fcf55e4f151e4cc54eb576fe5f7` - `record phase 6 pr state`

GitHub state observed by orchestrator after callback:

- Head: `lavender/lyricslab-jd5-6-offline-bundle-viability-gate`
- Base: `lavender/expo-webview-rebuild-test`
- Draft: yes
- Merge state: `CLEAN`
- Mergeable: `MERGEABLE`
- Status checks: empty `statusCheckRollup`

Orchestrator marked PR #15 ready and merged it into `lavender/expo-webview-rebuild-test` after receiving the review callback.

Merge commit: `b5b8d533ccb540c7ff8bacb74533be33c6039b21`

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.6` `in_progress` after selector chose it as the final ready phase.

2026-06-29: Implementation thread created follow-up Beads issues without advancing `lyricslab-jd5.6`.

2026-06-29: Orchestrator recorded the implementation callback in Beads before launching the review thread.

2026-06-29: Review thread verified follow-up issues `lyricslab-bhs`, `lyricslab-xoc`, and `lyricslab-gg4` exist and remain open without advancing `lyricslab-jd5.6`.

2026-06-29: Orchestrator recorded the review callback in Beads, marked PR #15 ready, merged PR #15, and closed `lyricslab-jd5.6` with review/CI evidence.

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

Phase 6 closed by orchestrator on 2026-06-29.

- PR: https://github.com/dirtydishes/lyricslab/pull/15
- PR state: merged into `lavender/expo-webview-rebuild-test`
- Merge commit: `b5b8d533ccb540c7ff8bacb74533be33c6039b21`
- Review status: `repaired`
- CI state: `ci-unavailable-with-evidence`
- Remaining findings: none
- Final viability decision: continue Expo/WebView rebuild with follow-ups; real-device Expo runtime validation remains required before Swift removal or main-lane migration cleanup.
- Stream state: all six phase children are closed; storyboard closeout remains.
