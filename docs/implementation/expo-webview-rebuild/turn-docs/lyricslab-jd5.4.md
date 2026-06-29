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

2026-06-29: Orchestrator marked `lyricslab-jd5.4` `in_progress` after selector chose it as the next ready phase.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 4 owns native WebView integration and body persistence. Phase 5 owns keyboard suggestions/insertion; Phase 6 owns offline bundling.
- Quality gates: typecheck, bridge parsing tests if added, manual smoke for body edits persisting after navigating away/back, and search finding body text when feasible.

## Closeout

Not started.
