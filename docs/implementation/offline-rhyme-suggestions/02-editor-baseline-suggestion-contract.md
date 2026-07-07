# Phase 02: Editor Baseline And Suggestion Contract

Canonical Beads issue: `lyricslab-xoc`

Epic: `lyricslab-8um`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Protect the current typing, selection, insertion, and generated-editor baseline before replacing placeholder suggestions.

## Scope

Allowed:

- Audit and test `src/editor/suggestions.ts`.
- Audit and test `src/editor/SuggestionBar.tsx` only as needed.
- Audit bridge context types in `src/editor/bridge.ts`.
- Audit editor-web selection context in `packages/editor-web/src/suggestionContext.ts`.
- Define the MVP native suggestion payload and provider expectations.
- Keep insertion command unchanged unless tests prove it must evolve.
- Add a generated HTML freshness guard or documented preflight for `npm run build:editor-html`.

Out of scope:

- CMU parsing.
- Rhyme ranking.
- Bridge widening for highlight spans.
- ProseMirror/Tiptap decorations.

## Inputs

- `src/editor/suggestions.ts`
- `src/editor/__tests__/suggestions.test.ts`
- `src/editor/bridge.ts`
- `src/editor/__tests__/bridge.test.ts`
- `packages/editor-web/src/suggestionContext.ts`
- `packages/editor-web/src/suggestionContext.test.ts`
- `scripts/build-editor-html.mjs`
- `testing.md`

## Implementation Notes

This phase absorbs the existing generated HTML freshness follow-up because stale editor bundle behavior can confuse suggestion integration. Keep it small and defensive.

## Beads

- Epic: `lyricslab-8um`
- Issue: `lyricslab-xoc`
- Depends on: `lyricslab-8um.5`
- Parallel-safe: `false`

## Expected Files Or Areas

- `src/editor/`
- `packages/editor-web/src/`
- `scripts/`
- `package.json`
- `testing.md`

## Suggested Swarms

- Scout current suggestion and bridge paths.
- Slice-plan tests versus production code changes.
- Implementation helpers for suggestion tests, bridge/context tests, and freshness guard.

## Quality Gates

- `npm test`
- `npm run typecheck`
- `npm run editor:test`
- `npm run build:editor-html`

## Completion Criteria

- Placeholder suggestion behavior is still covered.
- The future rhyme provider can plug in without bridge widening.
- Deterministic IDs, filtering, active-word exclusion, selection context, and generated HTML freshness are tested or documented.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.

