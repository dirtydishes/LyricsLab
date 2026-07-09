# Phase 01 Turn Doc: Product Scope Lock

Beads issue: `lyricslab-8um.5`

Phase doc: `docs/implementation/offline-rhyme-suggestions/01-product-scope-lock.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by Beads/orchestrator as `lyricslab-8um.5`.

Phase 01 follows Phase 00 tracker/bootstrap closeout and is the first docs alignment phase for the offline rhyme suggestions MVP. Scope is product, plan, architecture, and testing wording only; app code and UI behavior stay out of scope.

## Scope

Align product, plan, architecture, and testing docs around MVP offline rhyme suggestions.

## Implementation Log

- Locked the MVP description around deterministic offline CMU-backed suggestions in the native suggestion bar.
- Aligned `requirements.md`, `plan.md`, `architecture.md`, and `testing.md` on MVP versus post-MVP scope.
- Documented `src/rhyme/` as the pure TypeScript offline rhyme module boundary.
- Recorded constraints: offline-first operation, no external rhyme APIs, no lyric content logging, no hot-path SQL lookup, and typing-responsive suggestions.
- Added a research recommendation map to `docs/implementation/offline-rhyme-suggestions/00-roadmap.md`.
- Explicitly deferred WebView highlighting, phrase-rhyme visualization, teachable slant preferences, neural ranking, AI, IAP, sync, audio, and external-service-backed features.
- No app runtime behavior was intentionally changed in this phase.

`PRODUCT.md` and `README.md` still contain top-level highlighting language outside this phase's allowed edit set. Treat that as product-doc normalization follow-up context: deterministic offline CMU-backed native suggestions are this loop's MVP, while WebView highlighting, richer visual grouping, and highlight palette work remain post-MVP unless explicitly approved.

## Subagent Swarms

Swarm summary:

- Scout agents: 8
- Slice-plan agents: 8
- Implementation-helper agents: 8
- Slice count: 5
- Synthesis: Scouts checked product docs, architecture/testing boundaries, research-report scope pressure, current source boundaries, Beads/export state, and turn-doc needs. Slice-plan agents narrowed the work into product requirements, plan phase mapping, architecture boundary, test strategy, roadmap research mapping, turn-doc evidence, allowed-scope handling, and cross-doc consistency. Implementation helpers drafted bounded doc guidance; the implementation lead integrated the final wording across the allowed files.
- Used less than default reason: none; this phase used the default lower-bound swarm counts for a non-trivial docs alignment phase.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Pending reviewer thread/callback.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `local-gates-passed`

Evidence:

- Initial `npm test` failed before dependency bootstrap because `jest` was not installed.
- Initial `npm run typecheck` failed before dependency bootstrap because `tsc` and `packages/editor-web` dependencies were not installed.
- `npm ci` completed for the root package.
- `npm --prefix packages/editor-web ci` completed for the editor package.
- `npm test` passed: 4 suites, 20 tests.
- `npm run typecheck` passed.
- `git diff --check` passed.
- Reviewer to confirm docs-only scope and final gate evidence.

## PR And Commits

Implementation branch: `lavender/offline-rhyme-phase-01`

PR: `https://github.com/dirtydishes/lyricslab/pull/16`

Commits:

- `8730a48` - `lock offline rhyme mvp scope`

## Beads Updates

`lyricslab-8um.5` is `in_progress` and assigned to `delta`. `.beads/issues.jsonl` already reflected the in-progress claim before implementation edits began.

The issue remains open for orchestrator/review closeout. This implementation thread does not close Beads issues.

## Follow-Ups Filed

None from this implementation thread.

Follow-up context preserved for orchestrator/Phase 07: normalize `PRODUCT.md` and `README.md` so they do not imply WebView rhyme highlighting is required for the offline rhyme suggestions MVP.

## Context To Keep

- MVP is offline CMU-backed native suggestions.
- `src/rhyme/` is the pure TypeScript offline rhyme boundary for later phases.
- Highlighting, phrase-rhyme visualization, AI, IAP, sync, audio, neural ranking, and teachable slant preferences are follow-ups unless approved.
- No lyric logging, external API, hot-path SQL lookup, or raw CMU parsing belongs in the suggestion typing path.

## Closeout

Open. Pending implementation PR/commit metadata, gate evidence, and thermo-nuclear review callback.
