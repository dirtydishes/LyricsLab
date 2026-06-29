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

Not started.

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

Not started.

## PR And Commits

Not started.

## Beads Updates

2026-06-29: Orchestrator marked `lyricslab-jd5.3` `in_progress` after selector chose it as the next ready phase.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 3 owns standalone editor-web only; mobile integration starts in Phase 4.
- Quality gates: `npm --prefix apps/editor-web run build`, suggestion-context tests if added, browser/dev smoke for typing bridge messages, and exercised `loadSong` / `insertSuggestion` commands.

## Closeout

Not started.
