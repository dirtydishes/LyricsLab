# Phase 2 Turn Doc: Song persistence and app shell

Beads issue: `lyricslab-jd5.2`

Phase doc: `docs/implementation/expo-webview-rebuild/02-song-persistence-app-shell.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by selector subagent on 2026-06-29.

- Beads issue: `lyricslab-jd5.2`
- Phase: Song persistence and app shell
- Active stream branch: `lavender/expo-webview-rebuild-test`
- Expected PR base: `lavender/expo-webview-rebuild-test`
- Why ready: Beads reports `lyricslab-jd5.2` as the only ready child; blocker `lyricslab-jd5.1` is closed. Phases 3-6 remain dependency-blocked.

## Scope

Implement `Song` / `SongId` types, local song repository, Songs screen create/open/delete/search, editor route with native title editing, debounced title persistence, and repository CRUD/search tests.

Out of scope: real lyric body WebView editing, Tiptap/editor-web, WebView bridge, keyboard suggestion bar, rhyme logic, or highlighting.

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

2026-06-29: Orchestrator marked `lyricslab-jd5.2` `in_progress` after selector chose it as the next ready phase.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 2 owns native app shell and song persistence only.
- Quality gates: repository tests, `npm --prefix apps/mobile run typecheck`, and manual smoke for create song, edit title, return to Songs, and search by title when feasible.

## Closeout

Not started.
