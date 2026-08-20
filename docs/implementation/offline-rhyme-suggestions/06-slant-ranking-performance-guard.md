# Phase 06: Slant Ranking And Performance Guard

Canonical Beads issue: `lyricslab-8um.2`

Epic: `lyricslab-8um`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Improve suggestion quality beyond exact lookup while keeping expensive analysis away from the hot typing path.

## Scope

Allowed:

- Add balanced slant scoring as a weighted ranking feature.
- Add matched-syllable count.
- Add stress compatibility.
- Add repetition penalty.
- Add short internal reason labels if the provider contract already supports them.
- Add a non-default performance harness for representative lookup cases.
- Document measured lookup behavior and limits.

Out of scope:

- Neural classifier or reranker.
- User-teachable slant preferences.
- Phrase/mosaic rhymes unless they are tiny and fall out naturally from the existing model.
- WebView decorations or highlighting.

## Inputs

- `docs/research/rhyme-engine-deep-research-report.md`
- `src/rhyme/`
- `src/editor/suggestions.ts`
- `testing.md`

## Implementation Notes

Ranking should be explainable as weighted deterministic features, not a black box. Performance evidence should be useful to reviewers without slowing default tests.

## Beads

- Epic: `lyricslab-8um`
- Issue: `lyricslab-8um.2`
- Depends on: `lyricslab-gg4`
- Parallel-safe: `false`

## Expected Files Or Areas

- `src/rhyme/`
- `src/editor/suggestions.ts`
- Tests and optional benchmark harness
- `testing.md`

## Suggested Swarms

- Scout slant scoring options from the report and current engine API.
- Slice-plan scoring features, ranking tests, performance harness, and docs.
- Implementation helpers work separate scorer/ranker/perf slices.

## Quality Gates

- `npm test`
- `npm run typecheck`
- Non-default performance harness command if added

## Completion Criteria

- Ranking tests explain candidate order.
- Performance harness records representative lookup timing.
- Default test command remains fast.
- Reviewer confirms expensive work is not directly on every keystroke.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.

