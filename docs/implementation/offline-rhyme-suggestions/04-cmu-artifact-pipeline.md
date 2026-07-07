# Phase 04: CMU Artifact Pipeline

Canonical Beads issue: `lyricslab-8um.4`

Epic: `lyricslab-8um`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Prepare `data/cmudict.txt` for practical runtime use without parsing the raw dictionary on the typing path.

## Scope

Allowed:

- Add a deterministic build/prep script for CMU data.
- Generate a compact runtime artifact or typed module.
- Build word lookup and rhyme-tail lookup indexes.
- Document artifact regeneration.
- Add a non-default full-dictionary smoke check or benchmark if useful.
- Keep default tests fixture-based and fast.

Out of scope:

- Suggestion UI integration.
- Slant ranking beyond index support needed for later.
- Phrase rhymes.
- Runtime SQLite storage for dictionary data.
- Hot-path raw text parsing of `data/cmudict.txt`.

## Inputs

- `data/cmudict.txt`
- `src/rhyme/`
- `scripts/`
- `package.json`
- `testing.md`

## Implementation Notes

The research report recommends cache-friendly numeric data structures, but this phase should choose the simplest artifact format that is deterministic, testable, and practical for Expo bundling.

## Beads

- Epic: `lyricslab-8um`
- Issue: `lyricslab-8um.4`
- Depends on: `lyricslab-8um.1`
- Parallel-safe: `false`

## Expected Files Or Areas

- `scripts/`
- `src/rhyme/`
- `data/`
- `package.json`
- `testing.md`

## Suggested Swarms

- Scout Expo bundling constraints and current script style.
- Slice-plan artifact format, regeneration command, index loading, and tests.
- Implementation helpers produce script, runtime loader, and verification slices.

## Quality Gates

- `npm test`
- `npm run typecheck`
- Optional non-default CMU artifact smoke/benchmark command

## Completion Criteria

- Full dictionary artifact can be regenerated deterministically.
- Runtime code does not parse raw CMU data on the typing path.
- Default tests remain fast.
- Regeneration and verification commands are documented.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.

