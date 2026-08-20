# Phase 05: Native Suggestion Integration

Canonical Beads issue: `lyricslab-gg4`

Epic: `lyricslab-8um`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Replace placeholder suggestions with deterministic offline rhyme-backed suggestions through the existing native suggestion provider seam.

## Scope

Allowed:

- Wire the rhyme engine into `src/editor/suggestions.ts`.
- Choose a rhyme anchor from `SuggestionContext`: prefer previous completed token, then useful active word if appropriate.
- Exclude the active word, previous token, duplicates, and awkward identical repeats.
- Preserve stable suggestion IDs.
- Limit suggestions so the native bar stays intentional.
- Keep deterministic fallback suggestions when no rhyme anchor or candidates exist.
- Add focused tests for ordering, fallback behavior, and insertion assumptions.

Out of scope:

- Bridge widening.
- Highlighting.
- Phrase insertion.
- Rich chips UI unless it is already supported by the Phase 02 contract.
- External APIs.

## Inputs

- `src/rhyme/`
- `src/editor/suggestions.ts`
- `src/editor/SuggestionBar.tsx`
- `src/editor/LyricsEditorScreen.tsx`
- `src/editor/__tests__/suggestions.test.ts`
- `src/editor/__tests__/bridge.test.ts`

## Implementation Notes

This is the first product-visible rhyme slice. Keep the UI surface stable and make the provider smarter behind it.

## Beads

- Epic: `lyricslab-8um`
- Issue: `lyricslab-gg4`
- Depends on: `lyricslab-8um.4`
- Parallel-safe: `false`

## Expected Files Or Areas

- `src/editor/suggestions.ts`
- `src/editor/__tests__/suggestions.test.ts`
- `src/rhyme/`

## Suggested Swarms

- Scout current editor screen/suggestion flow and insertion behavior.
- Slice-plan provider API, ranking integration, fallback behavior, and tests.
- Implementation helpers work provider wiring, tests, and typing/performance guards.

## Quality Gates

- `npm test`
- `npm run typecheck`

## Completion Criteria

- Suggestion bar uses offline rhyme-backed provider.
- Suggestion insertion at cursor remains unchanged.
- Suggestions remain deterministic and non-disruptive.
- Typing path remains cheap.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.

