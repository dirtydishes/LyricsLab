# Phase 3 Turn Doc: Tiptap editor web bundle

Beads issue: `lyricslab-jd5.3`

Phase doc: `docs/implementation/expo-webview-rebuild/03-tiptap-editor-web-bundle.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by selector subagent on 2026-06-29.

- Beads issue: `lyricslab-jd5.3`
- Phase: Tiptap editor web bundle
- Active stream branch: `lavender/expo-webview-rebuild-test`
- Expected PR base: `lavender/expo-webview-rebuild-test`
- Why ready: Beads reports `lyricslab-jd5.3` as the only ready child; blocker `lyricslab-jd5.2` is closed. Phases 4-6 remain dependency-blocked.

## Scope

Create `apps/editor-web/` with Vite + TypeScript, a minimal Tiptap editor, typed bridge messages, WebView-callable `loadSong`, `insertSuggestion`, `focusEditor`, optional `setTheme`, and suggestion-context tests if practical.

Out of scope: React Native WebView integration, native persistence bridge, offline bundling into mobile, and rhyme highlighting/decorations.

## Implementation Log

2026-06-29 implementation thread:

- Created `apps/editor-web/` as a standalone Vite + TypeScript package.
- Installed minimal editor runtime dependencies: `@tiptap/core` and `@tiptap/starter-kit`.
- Added a plain lyric body Tiptap editor with StarterKit formatting nodes/marks disabled beyond paragraph/text editing.
- Added typed bridge envelopes for `editorReady`, `contentChanged`, `selectionChanged`, `editorFocused`, `editorBlurred`, and `editorError`.
- Exposed WebView-callable commands at `window.LyricsLabEditor`: `loadSong`, `insertSuggestion`, `focusEditor`, and placeholder `setTheme`.
- Added `lyricslab:bridge-message` browser `CustomEvent` emission alongside `window.ReactNativeWebView.postMessage` so the standalone editor can be smoke-tested before native integration.
- Added pure TypeScript suggestion-context extraction and Vitest coverage.
- Kept React Native WebView integration, native persistence bridge, offline mobile bundling, and rhyme highlighting/decorations out of scope.

## Subagent Swarms

Not used. The selected phase was narrow enough for direct implementation in this worker thread.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Not started. Review is owned by a later orchestrator-created review thread.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `implementation-local-gates-passed`

Evidence:

- `npm --prefix apps/editor-web test` passed on 2026-06-29.
  - Vitest `v4.1.9`.
  - Test files: `1 passed (1)`.
  - Tests: `4 passed (4)`.
- `npm --prefix apps/editor-web run build` passed on 2026-06-29.
  - Runs `tsc --noEmit && vite build`.
  - Vite `v8.1.0`.
  - Output included `✓ 52 modules transformed` and `✓ built`.
- Browser/dev smoke passed on 2026-06-29.
  - Dev server: `npm --prefix apps/editor-web run dev -- --host 127.0.0.1 --port 5174`.
  - Browser: `/usr/bin/chromium --headless=new` driven through DevTools Protocol against `http://127.0.0.1:5174/`.
  - Verified bridge events included `editorReady`, `contentChanged`, `selectionChanged`, and `editorFocused`.
  - Verified command results: `loadSong: true`, `focusEditor: true`, `insertSuggestion: true`.
  - Verified latest content included typed text `second line` and inserted suggestion `glow`.
  - Verified latest selection context had `selectionEmpty: true`, `currentLineText: "second lineglow "`, `previousToken: "lineglow"`, and `wordBeforeCursor: ""`.

## PR And Commits

Implementation branch: `lavender/lyricslab-jd5-3-tiptap-editor-web-bundle`

Draft PR: pending.

Commits: pending.

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.3` `in_progress` after selector chose it as the next ready phase.

2026-06-29: Implementation thread made no Beads updates; Beads/loop-state closeout remains orchestrator-owned.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 3 owns standalone editor-web only; mobile integration starts in Phase 4.
- Quality gates: `npm --prefix apps/editor-web run build`, suggestion-context tests if added, browser/dev smoke for typing bridge messages, and exercised `loadSong` / `insertSuggestion` commands.
- `apps/editor-web/src/bridge.ts` emits typed JSON envelopes through `window.ReactNativeWebView.postMessage` and dispatches `lyricslab:bridge-message` for browser/dev verification.
- WebView commands live on `window.LyricsLabEditor`; Phase 4 can call `loadSong`, `insertSuggestion`, `focusEditor`, and `setTheme`.
- `contentChanged` snapshots include both `bodyJson` and `bodyText`; `selectionChanged` includes `wordBeforeCursor`, `currentLineText`, `previousToken`, and `selectionEmpty`.

## Closeout

Implementation complete locally; draft PR pending.
