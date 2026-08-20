# Phase 03: Pure Rhyme Core With Fixtures

Canonical Beads issue: `lyricslab-8um.1`

Epic: `lyricslab-8um`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Build the pure TypeScript offline rhyme core using small deterministic fixtures before introducing the full CMU dictionary artifact.

## Scope

Allowed:

- Add `src/rhyme/`.
- Add small CMU-style test fixtures.
- Parse CMU-style entries and alternate pronunciations.
- Normalize lyric tokens without logging lyric content.
- Encode pronunciations enough to compute rhyme tails.
- Compute last-stressed-vowel rhyme tails.
- Generate exact end-rhyme candidates.
- Rank exact candidates deterministically.

Out of scope:

- Full `data/cmudict.txt` runtime loading.
- Slant scoring beyond light scaffolding needed by APIs.
- Native suggestion UI integration.
- Phrase rhymes.
- Highlighting.

## Inputs

- `docs/research/rhyme-engine-deep-research-report.md`
- `data/cmudict.txt`
- `src/editor/suggestions.ts`
- `src/editor/__tests__/suggestions.test.ts`

## Implementation Notes

Keep this module independent of React, React Native, WebView, SQLite, and Tiptap. The engine should be easy to test in Jest and cheap to call from native suggestion code later.

## Beads

- Epic: `lyricslab-8um`
- Issue: `lyricslab-8um.1`
- Depends on: `lyricslab-xoc`
- Parallel-safe: `false`

## Expected Files Or Areas

- `src/rhyme/`
- `src/rhyme/__tests__/`
- Maybe small fixtures under `src/rhyme/__fixtures__/`

## Suggested Swarms

- Scout CMU parsing/rhyme-tail rules and current TypeScript/Jest patterns.
- Slice-plan parser, pronunciation model, tail extraction, candidate generation, and ranking tests.
- Implementation helpers work isolated module slices, then the lead worker integrates the API.

## Quality Gates

- `npm test`
- `npm run typecheck`

## Completion Criteria

- Focused unit tests cover parser, normalization, tail extraction, alternate pronunciations, and ranking.
- No lyric content logging.
- No external APIs.
- Pure module compiles under strict TypeScript.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.

