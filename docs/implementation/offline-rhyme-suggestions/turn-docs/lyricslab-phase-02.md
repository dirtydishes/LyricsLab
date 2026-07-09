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

Review complete from local attached checkout `lavender/offline-rhyme-phase-02`.

Review findings:

- No remaining structural findings.
- The phase stays inside the editor baseline/suggestion-contract boundary: no CMU parsing, rhyme ranking, bridge highlight spans, ProseMirror decorations, SuggestionBar harness, or bridge payload widening was added.
- `src/editor/suggestions.ts` keeps the future-provider seam narrow through `SuggestionProvider.getSuggestions(context)` and `WordSuggestion { id, label?, word }`, while the bridge insertion command remains `insertSuggestion({ word })`.
- `packages/editor-web/src/suggestionContext.ts` owns editor-web token extraction and sends only the existing `SuggestionContext` fields. Native parsing keeps that boundary typed before suggestions are derived.
- Generated editor HTML freshness is guarded by non-mutating `npm run check:editor-html`; `npm run build:editor-html` remains the repair command.

Repairs:

- None. Reviewer updated this turn doc with review and gate evidence only.

## CI And Gates

CI owner: reviewer

Current CI state: `ci-unavailable-with-evidence`

Evidence:

- Review preflight passed on `/home/delta/dev/lyricslab`: repo root `/home/delta/dev/lyricslab`, symbolic branch `lavender/offline-rhyme-phase-02`, tracking `origin/lavender/offline-rhyme-phase-02`; only `.beads/issues.jsonl` was dirty from the orchestrator Beads export.
- `npm test`: passed. 4 suites, 41 tests.
- `npm run typecheck`: passed.
- `npm run editor:test`: passed. 2 files, 15 tests.
- `npm run check:editor-html`: passed; Vite built 52 modules and `src/editor/generated/editorHtml.ts` was fresh.
- `git diff --check`: passed.
- `git merge-tree --write-tree origin/lavender/expo-clean-rebuild HEAD`: passed with tree `e173dc417e468b57cf2d6d609ab05e09ba3c726b`.
- GitHub PR #17 state during review: open draft PR, base `lavender/expo-clean-rebuild`, head `lavender/offline-rhyme-phase-02`, head SHA `51a4dc7b0e8ca7b28ad0df5644ef1cb4c5c529f6`, `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE`, hosted `statusCheckRollup: []`.
- `gh pr checks 17 --repo dirtydishes/lyricslab`: no checks reported on `lavender/offline-rhyme-phase-02`.

## PR And Commits

Draft implementation PR opened for review.

- Branch: `lavender/offline-rhyme-phase-02`
- Target base: `lavender/expo-clean-rebuild`
- PR: `https://github.com/dirtydishes/lyricslab/pull/17`
- Commits:
  - `1da764f690e1d31496e39f4e291a88d5a4377629` - `harden editor suggestion baseline`
  - `51a4dc7b0e8ca7b28ad0df5644ef1cb4c5c529f6` - `record phase 02 pr evidence`

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

Thermo-nuclear review approved with no remaining findings. Local gates passed, PR #17 is mergeable, and hosted CI is unavailable because GitHub reports no checks for the branch. Orchestrator owns Beads closeout and next-phase selection.
