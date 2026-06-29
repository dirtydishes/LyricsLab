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

2026-06-29: Orchestrator marked `lyricslab-jd5.6` `in_progress` after selector chose it as the final ready phase.

## Follow-Ups Filed

None yet.

## Context To Keep

- Continue from `lavender/expo-webview-rebuild-test`, not `feat/expo-webview-rebuild`.
- Phase 6 owns offline editor bundling and the final viability decision.
- Manual checklist: create song, edit title, type 20+ lyric lines, move cursor, tap suggestions repeatedly, background/reopen, navigate away/back, search by body text, confirm keyboard bar position, and confirm no obvious cursor jumping.
- If device smoke is blocked, record exact blocker with evidence and use the closest automated smoke evidence available.

## Closeout

Not started.
