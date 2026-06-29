# Phase 4 Turn Doc: WebView bridge and body persistence

Beads issue: `lyricslab-jd5.4`

Phase doc: `docs/implementation/expo-webview-rebuild/04-webview-bridge-body-persistence.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by selector subagent on 2026-06-29.

- Beads issue: `lyricslab-jd5.4`
- Phase: WebView bridge and body persistence
- Active stream branch: `lavender/expo-webview-rebuild-test`
- Expected PR base: `lavender/expo-webview-rebuild-test`
- Why ready: Beads reports `lyricslab-jd5.4` as the only ready child; blocker `lyricslab-jd5.3` is closed. Phases 5-6 remain dependency-blocked.

## Scope

Load the Phase 3 Tiptap editor inside the Expo React Native WebView, add narrow typed native bridge parsing/sending helpers, send current song body after `editorReady`, debounce `contentChanged` persistence into `bodyJson` / `bodyText`, store latest `selectionChanged` context for later phases, and make previews/search use `bodyText`.

Out of scope: keyboard suggestions, suggestion insertion, offline bundling, and rhyme highlighting/decorations.

## Implementation Log

Implementation callback received on 2026-06-29.

- Status: `pr-ready`
- Branch: `lavender/lyricslab-jd5-4-webview-bridge-body-persistence`
- PR: https://github.com/dirtydishes/lyricslab/pull/13
- Commits:
  - `f0d308ee2f0f91150d9b7a81143388765fe36845`
  - `6e756486499f3db2e5ae5a995e1621e764c3e8e1`
- `EditorWebView` loads a dev editor URL from `EXPO_PUBLIC_EDITOR_WEB_URL` or Expo `extra.editorWebUrl` first, then Expo host metadata, then `http://127.0.0.1:5174/`. Phase 6 still owns offline bundling.
- Latest `selectionChanged` context is stored in `LyricsEditorScreen` for Phase 5, but no suggestion UI or `insertSuggestion` interaction was added.
- Body persistence debounces `contentChanged` snapshots and guards stale in-flight saves so older saves cannot clear newer pending body edits.
- Created `apps/mobile/src/editor/bridge.ts` with native-side parsing for Phase 3 WebView bridge envelopes and a typed `loadSong` JavaScript sender helper.
- Created `apps/mobile/src/editor/EditorWebView.tsx` using `react-native-webview`; it waits for `editorReady`, then injects `window.LyricsLabEditor.loadSong({ bodyJson, bodyText })`.
- Replaced the editor body placeholder in `apps/mobile/src/editor/LyricsEditorScreen.tsx` with `EditorWebView`.
- Wired `contentChanged` messages into debounced repository persistence for `bodyJson` and `bodyText`; the Back action flushes pending title/body saves before navigation.
- Strengthened repository coverage so updated `bodyText` is searchable after persistence.
- Kept keyboard suggestions, suggestion insertion, offline bundling, and rhyme highlighting/decorations out of scope.

## Subagent Swarms

Not used. The selected phase was narrow enough for direct implementation in this worker thread.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

2026-06-29 review thread:

- Scope confirmed: Phase 4 stayed limited to native WebView loading, typed bridge parsing/sending, body load after `editorReady`, debounced `contentChanged` persistence, latest selection context storage, and `bodyText` search/preview behavior.
- Scope exclusions confirmed: no native keyboard suggestion UI, no native suggestion insertion interaction, no offline bundled WebView loading, and no rhyme highlighting/decorations were added.
- Thermo-nuclear finding repaired: the implementation guarded the UI against older body save results, but debounced/back-flush saves could still overlap at the repository layer. A slower older `updateSong` could finish after a newer body save and leave persisted `bodyText` stale.
- Repair: extracted focused body persistence policy into `apps/mobile/src/editor/bodyPersistence.ts`, serialized body save tasks in `LyricsEditorScreen`, and added `apps/mobile/src/editor/__tests__/bodyPersistence.test.ts` coverage for stale save ordering plus merge behavior.
- Findings remaining: none.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `ci-unavailable-with-evidence`; reviewer made a bounded repair and all feasible local gates passed. GitHub reports no PR status checks for this branch.

Evidence:

- Implementation thread reported `npm --prefix apps/mobile ci` passed after initial missing dependency errors for Jest/TypeScript.
- Implementation thread reported `npm --prefix apps/mobile test` passed with 2 suites and 10 tests.
- Implementation thread reported `npm --prefix apps/mobile run typecheck` passed with `tsc --noEmit`.
- Implementation thread reported `npm --prefix apps/editor-web ci` passed after initial missing dependency errors for Vitest/TypeScript.
- Implementation thread reported `npm --prefix apps/editor-web test` passed with 1 suite and 4 tests.
- Implementation thread reported `npm --prefix apps/editor-web run build` passed with `tsc --noEmit && vite build`.
- Manual Expo device/simulator smoke for body edits after navigating away/back was not run because no Expo device session or simulator runtime was available; closest automated evidence is bridge parser/sender coverage plus repository update/search persistence coverage.
- Reviewer PR status check on 2026-06-29:
  - `gh pr view 13 --repo dirtydishes/lyricslab --json url,state,isDraft,mergeable,reviewDecision,statusCheckRollup,headRefName,baseRefName,commits` reported PR #13 open as a draft from `lavender/lyricslab-jd5-4-webview-bridge-body-persistence` into `lavender/expo-webview-rebuild-test`; `statusCheckRollup` was empty and `mergeable` was `UNKNOWN`.
  - `gh pr checks 13 --repo dirtydishes/lyricslab` reported no checks on the branch.
- Reviewer local gates after repair on 2026-06-29:
  - `npm --prefix apps/mobile ci` passed; npm reported existing Expo peer/deprecation warnings and 10 moderate audit findings.
  - `npm --prefix apps/mobile test` passed: Jest suites `3 passed, 3 total`; tests `14 passed, 14 total`. Coverage now includes bridge parsing/sending, body save serialization, stale save merge behavior, and repository search after body updates.
  - `npm --prefix apps/mobile run typecheck` passed: `tsc --noEmit`.
  - `npm --prefix apps/editor-web ci` passed; npm reported 0 vulnerabilities.
  - `npm --prefix apps/editor-web test` passed: Vitest files `1 passed (1)`; tests `4 passed (4)`.
  - `npm --prefix apps/editor-web run build` passed: `tsc --noEmit && vite build`, `52 modules transformed`, built in `759ms`.
  - `git diff --check` passed.
- Reviewer manual/device smoke blocker on 2026-06-29:
  - No Android or iOS runtime was available in this Debian worktree: `command -v adb` returned nothing, `command -v xcrun` returned nothing, and `/dev/kvm` was absent.
  - Body-edit persistence after navigating away/back and search finding body text were therefore not manually smoke-tested; closest automated evidence is the body save serialization test plus repository body search tests in `npm --prefix apps/mobile test`.
- Reviewer merge-conflict repair on 2026-06-29:
  - Merged active base `origin/lavender/expo-webview-rebuild-test` into the PR head after GitHub reported `mergeable: CONFLICTING`.
  - Preserved the orchestrator's implementation-callback Beads/loop-state updates and the reviewer repair/evidence in this turn doc.
  - Post-merge gates passed: `npm --prefix apps/mobile test` (`3 passed`, `14 passed`), `npm --prefix apps/mobile run typecheck`, `npm --prefix apps/editor-web test` (`1 passed`, `4 passed`), and `npm --prefix apps/editor-web run build` (`52 modules transformed`, built in `359ms`).

## PR And Commits

Implementation branch: `lavender/lyricslab-jd5-4-webview-bridge-body-persistence`

Draft PR: https://github.com/dirtydishes/lyricslab/pull/13

GitHub state observed by orchestrator after implementation callback:

- Head: `lavender/lyricslab-jd5-4-webview-bridge-body-persistence`
- Base: `lavender/expo-webview-rebuild-test`
- Draft: yes
- Merge state: `CLEAN`
- Mergeable: `MERGEABLE`
- Status checks: empty `statusCheckRollup`

Commits:

- `f0d308e` - `feat: wire webview body persistence`
- `docs: record phase 4 pr state` - final PR-state turn-doc update on top of the implementation commit.
- Review repair commit on PR branch - `fix stale webview body save ordering`; serializes body saves, adds body persistence tests, and records reviewer evidence.
- Review merge repair commit on PR branch - merges active base to clear the PR conflict and preserves implementation-callback plus review evidence.

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.4` `in_progress` after selector chose it as the next ready phase.

2026-06-29: Orchestrator recorded the implementation callback in Beads before launching the review thread.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 4 owns native WebView integration and body persistence. Phase 5 owns keyboard suggestions/insertion; Phase 6 owns offline bundling.
- Quality gates: typecheck, bridge parsing tests if added, manual smoke for body edits persisting after navigating away/back, and search finding body text when feasible.
- `EditorWebView` currently loads the editor-web dev server URL from explicit `EXPO_PUBLIC_EDITOR_WEB_URL` / Expo `extra.editorWebUrl` config when present, otherwise infers the host from Expo metadata and falls back to `http://127.0.0.1:5174/`. Phase 6 owns offline bundled loading.
- Latest selection context is stored in `LyricsEditorScreen` for later suggestion UI, but Phase 4 intentionally does not render suggestions or call `insertSuggestion`.

## Closeout

Implementation PR is open as draft PR #13 against `lavender/expo-webview-rebuild-test`.

Implementation callback status: ready to send after this turn-doc update is committed and pushed.
