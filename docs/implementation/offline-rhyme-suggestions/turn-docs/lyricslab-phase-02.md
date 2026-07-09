# Phase 02 Turn Doc: Editor Baseline And Suggestion Contract

Beads issue: `lyricslab-xoc`

Phase doc: `docs/implementation/offline-rhyme-suggestions/02-editor-baseline-suggestion-contract.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by the orchestrator from Beads as Phase 02 on branch `lavender/offline-rhyme-phase-02`.

- Canonical Beads issue: `lyricslab-xoc`
- Phase doc: `docs/implementation/offline-rhyme-suggestions/02-editor-baseline-suggestion-contract.md`
- Reason for selection: protect the current typing, selection, insertion, suggestion, and generated-editor baseline before rhyme integration starts.
- Initial checkout preflight passed: repo root `/home/delta/dev/lyricslab`, symbolic branch `lavender/offline-rhyme-phase-02`, tracking `origin/lavender/offline-rhyme-phase-02`.

## Scope

Protect editor suggestion and generated HTML behavior before rhyme integration.

Out-of-scope work stayed out of the phase: no CMU parsing, rhyme ranking, bridge highlight spans, ProseMirror decorations, SuggestionBar redesign, or Tiptap DOM integration harness was added.

## Implementation Log

Implemented the Phase 02 baseline across four bounded slices:

- Native suggestion contract: `src/editor/suggestions.ts` now suppresses suggestions for non-empty selections, preserves the deterministic null-context placeholder fallback, handles `maxSuggestions <= 0`, trims token-edge punctuation for lookup/blocking/IDs, and excludes candidates prefixed by the active word. Tests in `src/editor/__tests__/suggestions.test.ts` cover stable IDs, contextual ordering, punctuation/case blocking, active-word exclusion, selection suppression, max behavior, and internal punctuation staying distinct.
- Native bridge guardrails: `src/editor/__tests__/bridge.test.ts` now covers accepted bridge message variants, malformed message rejection, `insertSuggestion({ word })`, `focusEditor(undefined)`, and command payload escaping. `src/editor/bridge.ts` stayed unchanged.
- Editor-web context baseline: `packages/editor-web/src/suggestionContext.ts` now derives `previousToken` and `wordBeforeCursor` from the active line only, trims token-edge punctuation, preserves raw case and internal punctuation, keeps `currentLineText` raw, and passes `selectionEmpty` through. Vitest coverage in `packages/editor-web/src/suggestionContext.test.ts` locks those behaviors. `packages/editor-web/src/bridge.test.ts` adds Node-environment fake-window coverage for bridge envelope dispatch and editor command installation.
- Generated HTML freshness: `scripts/build-editor-html.mjs` now supports `--check`, comparing the would-be generated module against `src/editor/generated/editorHtml.ts` without writing in check mode. `package.json` adds `npm run check:editor-html`; `testing.md` documents `check:editor-html` as the freshness gate and `build:editor-html` as the repair path.

The existing insertion command stayed unchanged: native still injects `insertSuggestion({ word })`, and editor-web remains responsible for trimming and inserting `word + " "` at the editor selection.

## Subagent Swarms

Swarm summary:

- Scout agents: `8`
- Slice-plan agents: `8`
- Implementation-helper agents: `8`
- Slice count: `4`
- Used less than default reason: none

Synthesis:

Scouts covered `suggestions.ts`, `SuggestionBar`, native bridge tests, editor-web context extraction, generated HTML freshness, current gates, phase docs, and end-to-end suggestion flow. Slice planners converged on four implementation slices: native suggestion contract hardening, editor-web context extraction coverage, bridge narrowness tests, and generated HTML freshness. Helper outputs were integrated with the overreach review's reductions: no provider factory abstraction, no SuggestionBar harness, no DOM/Tiptap tests, no bridge widening, and no generated HTML churn beyond the required rebuild after editor-web source changes.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Pending. The orchestrator should launch the review thread after the implementation callback.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `local-gates-green-before-review`

Evidence:

- `npm test`: passed. 4 suites, 41 tests.
- `npm run typecheck`: passed.
- `npm run editor:test`: passed. 2 files, 15 tests.
- `npm run check:editor-html`: initially failed with stale `src/editor/generated/editorHtml.ts`, as expected after editor-web source changes.
- `npm run build:editor-html`: passed and regenerated `src/editor/generated/editorHtml.ts` with 2 inlined assets.
- `npm run check:editor-html`: passed after regeneration; generated editor HTML is fresh.
- `git diff --check`: passed.
- GitHub PR state after creation: `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE`, hosted status check rollup empty.

## PR And Commits

Draft implementation PR opened for review.

- Branch: `lavender/offline-rhyme-phase-02`
- Target base: `lavender/expo-clean-rebuild`
- PR: `https://github.com/dirtydishes/lyricslab/pull/17`
- Commits:
  - `1da764f690e1d31496e39f4e291a88d5a4377629` - `harden editor suggestion baseline`

## Beads Updates

The phase issue was already claimed and exported before implementation began. `.beads/issues.jsonl` records `lyricslab-xoc` as `in_progress` and assigned to `delta`.

This implementation thread did not close Beads issues.

## Follow-Ups Filed

None.

## Context To Keep

- Do not widen the bridge for rhyme metadata, highlight spans, or decorations.
- Keep suggestion insertion stable through `insertSuggestion({ word })`.
- Future rhyme providers should plug into the native suggestion provider seam and keep the bridge/editor-web boundary narrow.
- `npm run check:editor-html` is the non-mutating freshness gate; `npm run build:editor-html` is the repair command.
- The generated editor HTML artifact must be rebuilt whenever `packages/editor-web` source changes.

## Closeout

Implementation complete locally. Review and PR closeout are pending orchestrator handoff.
