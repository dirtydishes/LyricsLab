# Phase 03 Turn Doc: Pure Rhyme Core With Fixtures

Beads issue: `lyricslab-8um.1`

Phase doc: `docs/implementation/offline-rhyme-suggestions/03-pure-rhyme-core-fixtures.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by orchestrator-callback runtime for Beads issue `lyricslab-8um.1`.

Preflight passed before Beads/file/app action:

- `pwd`: `/home/delta/dev/lyricslab`
- `git rev-parse --show-toplevel`: `/home/delta/dev/lyricslab`
- `git symbolic-ref --short HEAD`: `lavender/offline-rhyme-phase-03`
- `git status --short --branch`: `## lavender/offline-rhyme-phase-03...origin/lavender/offline-rhyme-phase-03` plus pre-existing `M .beads/issues.jsonl`

## Scope

Add pure TypeScript rhyme core with fixture-backed parser, rhyme-tail extraction, and deterministic exact ranking.

## Implementation Log

Swarm-first planning completed before broad implementation edits.

Integrated plan:

1. Keep the strict TypeScript model close to the owning modules for this fixture phase; avoid a standalone future-facing type layer until Phase 04 needs a broader artifact contract.
2. Add `src/rhyme/normalize.ts` for lyric/dictionary token normalization. It should be pure, exportable for future integration, and keep edge-trimming behavior compatible with the existing suggestion provider while avoiding imports from `src/editor/`.
3. Add `src/rhyme/cmuParser.ts` for fixture-scale CMU-style parsing: blank/comment skip, inline `#` comment strip, `WORD(n)` alternate parsing, phone stress parsing, and deterministic grouping by normalized word.
4. Add `src/rhyme/rhymeTail.ts` for last-stressed-vowel exact tail extraction. It should preserve ARPAbet stress digits in tail keys and return `null` for no stressed vowel instead of inventing fallback tails.
5. Add `src/rhyme/rhymeIndex.ts` for pure in-memory exact candidate generation and deterministic ranking. The query path should not touch filesystem, network, React, React Native, WebView, SQLite, Tiptap, or editor bridge types.
6. Add a small `src/rhyme/__fixtures__/` CMU-style fixture and focused Jest tests under `src/rhyme/__tests__/`.
7. Export the public core from `src/rhyme/index.ts`, but do not export fixtures or add native/editor integration in this phase.

Key decisions from synthesis:

- Exact end-rhyme keys are generated from the last primary or secondary stressed vowel through pronunciation end.
- Pronunciations with no stressed vowel parse successfully but are excluded from exact-tail lookup.
- Alternate pronunciations remain distinct internally and dedupe to one target word in candidate results.
- Ranking is exact-only and deterministic; slant stays as inert result metadata for future phases.
- Sorting must avoid runtime-dependent `localeCompare`; use deterministic codepoint comparison.
- Unknown, empty, no-tail, and OOV anchors return empty candidate lists.
- No lyric content logging, external APIs, full `data/cmudict.txt` runtime loading, phrase rhymes, highlighting, or bridge changes belong in Phase 03.

Implemented:

- `src/rhyme/normalize.ts` exposes pure rhyme-token normalization with NFC, lowercase, curly-apostrophe folding, edge punctuation trimming, internal punctuation preservation, and no logging.
- `src/rhyme/cmuParser.ts` parses small CMU-style fixtures, strips comments, handles alternate suffixes, and produces normalized dictionary entries.
- `src/rhyme/rhymeTail.ts` parses ARPAbet phone tokens and extracts exact tails from the last stressed CMU vowel through the word end.
- `src/rhyme/rhymeIndex.ts` builds a pure in-memory exact-tail index, skips no-tail pronunciations from lookup, excludes source/excluded tokens, dedupes alternates by normalized target word, and returns deterministic exact candidates.
- `src/rhyme/index.ts` provides the public pure API for parsing fixtures, building the index, extracting tails, and finding exact rhymes/candidates.
- `src/rhyme/__fixtures__/smallCmuFixture.ts` and `src/rhyme/__tests__/` cover parser, normalization, tail extraction, alternates, candidate generation, ranking, and dependency guards.

## Subagent Swarms

Completed required swarm-first workflow:

- Scout agents: 8
- Slice-plan agents: 8
- Implementation-helper agents: 8

Scout synthesis:

- Existing root tests use Jest with `ts-jest`, node environment, and `src/**/__tests__/**/*.test.ts` style.
- `src/editor/suggestions.ts` is only a pattern reference; the rhyme core must not import it or wire into it yet.
- CMU parsing must handle comments, inline comments, stress digits, punctuation-bearing headwords, and alternate suffixes before generic token normalization.
- The core exact-rhyme primitive is a strict rhyme tail from the last stressed vowel to the end of the pronunciation.
- The module boundary is `src/rhyme/`, pure synchronous TypeScript, no runtime data loading or native/editor dependencies.

Slice-plan synthesis:

- `normalization`: exported pure token normalization, compatible with existing edge-trim behavior and no logging.
- `cmu-parser`: parser returns grouped lexemes and deterministic pronunciations from small fixtures.
- `pronunciation-model`: use shared object types; avoid overbuilt branded/numeric artifact design until Phase 04.
- `tail-extraction`: reverse-scan for stress `1` or `2`, keep trailing unstressed phones, return `null` for no stressed vowel.
- `candidate-generation`: build index once, search by normalized anchor token, exclude source/excluded tokens, dedupe by normalized target.
- `ranking`: exact-only result shape, stable ids, deterministic tie-breaks, `slantSimilarity: null`.
- `tests`: focused Jest coverage for parser, normalization, tails, alternates, candidates, ranking, and pure dependency guard.
- `public-api`: `src/rhyme/index.ts` exports core types/functions only; future Phase 05 adapter maps candidates to `WordSuggestion`.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Status: repaired and approved.

Findings repaired:

- Removed the unused standalone `src/rhyme/types.ts` model. It duplicated module-local contracts and only supplied aliases to `normalize.ts`, so keeping it would have made Phase 04 artifact typing look more established than it was.
- Removed the unused standalone `src/rhyme/ranking.ts` helper and its isolated test. Deterministic exact ranking is now kept in the candidate generation path that actually returns suggestions, with integration coverage in `candidateRanking.integration.test.ts`.
- Removed the duplicate internal CMU-entry adapter from `src/rhyme/rhymeIndex.ts`; CMU parsing/grouping remains owned by the public module boundary in `src/rhyme/index.ts`.
- Reused the internal `ExactRhymeCandidate` type in the public API instead of redefining the same shape and remapping every candidate.

Review result:

- No remaining structural blockers found after repair.
- `src/rhyme/` remains pure synchronous TypeScript with no React, React Native, WebView, SQLite, Tiptap, editor-module, network, filesystem-runtime-load, phrase-rhyme, highlighting, or non-inert slant-ranking dependency.
- Exact ranking is deterministic and covered through candidate generation integration tests; slant metadata remains inert as `null`.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `local-gates-pass-review-repair`

Evidence:

- `npm test`: passed, 10 suites, 74 tests
- `npm run typecheck`: passed
- `git diff --check`: passed
- forbidden dependency/logging scan for `src/rhyme`: no matches for React, React Native, WebView, SQLite, Tiptap/editor imports, network calls, or `console.*`

## PR And Commits

- Draft PR: `https://github.com/dirtydishes/lyricslab/pull/18`
- Branch: `lavender/offline-rhyme-phase-03`
- Base: `lavender/expo-clean-rebuild`
- Commit subject: `add pure rhyme core fixtures`
- Review repair/evidence commit subject: `simplify pure rhyme core review surface`

## Beads Updates

The Beads export already reflected the orchestrator claim before implementation. The issue remains `in_progress`; this worker did not close Beads.

## Follow-Ups Filed

None.

## Context To Keep

- Keep `src/rhyme/` pure and independent of React Native/WebView/SQLite.
- Use small fixtures in default tests.
- Phase 03 intentionally returns exact candidates only; slant metadata is inert until Phase 06.
- No-tail pronunciations are parsed but excluded from exact-tail lookup.
- Phase 05 should adapt `src/rhyme` candidates to `WordSuggestion`; this phase does not wire native suggestions.

## Closeout

Review resolved. Orchestrator owns PR merge, Beads closeout, and next-phase selection.
