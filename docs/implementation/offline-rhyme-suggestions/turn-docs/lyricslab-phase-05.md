# Phase 05 Turn Doc: Native Suggestion Integration

Beads issue: `lyricslab-gg4`

Phase doc: `docs/implementation/offline-rhyme-suggestions/05-native-suggestion-integration.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected for Beads issue `lyricslab-gg4` after Phase 04 closeout routed the loop to native suggestion integration.

Implementation preflight:

- `pwd`: `/home/delta/dev/lyricslab`
- `git rev-parse --show-toplevel`: `/home/delta/dev/lyricslab`
- `git symbolic-ref --short HEAD`: `lavender/offline-rhyme-phase-05`
- `git status --short --branch`: `## lavender/offline-rhyme-phase-05...origin/lavender/offline-rhyme-phase-05` plus pre-existing `M .beads/issues.jsonl`
- Existing phase doc: `docs/implementation/offline-rhyme-suggestions/05-native-suggestion-integration.md`

Live Beads status confirmed `lyricslab-gg4` is `IN_PROGRESS`. This implementation worker did not close Beads and did not create a separate review document.

## Scope

Replace placeholder suggestions with offline rhyme-backed suggestions through the existing native provider seam.

Keep the phase bounded to native suggestion integration:

- Allowed: provider wiring, rhyme anchor choice, candidate exclusion, deterministic fallback behavior, stable suggestion ids, and focused tests.
- Out of scope: bridge widening, WebView highlighting, phrase insertion, rich chip UI, external APIs, neural/slant ranking, and device closeout.

## Implementation Log

Integrated implementation:

1. `src/editor/suggestions.ts` now owns the canonical provider policy through `createRhymeSuggestionProvider`. It accepts an eager or lazy `RhymeIndex` source plus an injectable candidate finder, keeping unit tests fixture-sized and keeping the bundled artifact out of the pure provider module.
2. The provider preserves the existing `SuggestionProvider` and `WordSuggestion` contracts. Rhyme candidates map to `{ id: candidate.id, word: candidate.word }`, so the bar still keys by stable ids and insertion still passes only `suggestion.word`.
3. Anchor selection tries the normalized previous completed token first, then a useful normalized active word only when it has at least three characters and is distinct after dedupe. If all anchors miss, the provider returns deterministic fallback suggestions.
4. Exclusion rules use `normalizeRhymeToken`, block current-line tokens, previous token, active word, duplicates, and active-word prefixes, and over-fetch exact candidates before slicing so filtering does not under-fill avoidably.
5. `src/editor/bundledSuggestionProvider.ts` is a thin production adapter over the canonical provider and `getBundledCmuRhymeIndex()`. `src/editor/LyricsEditorScreen.tsx` now calls that bundled provider while preserving the existing focus guard and `insertSuggestion(suggestion.word)` behavior.
6. `src/editor/__tests__/suggestions.test.ts` now covers fixture-backed exact-rhyme ordering, stable rhyme ids, fallback behavior, anchor precedence, active-word fallback, current-line/previous/active exclusions, active-prefix filtering, max/selection guards, and cheap no-anchor/no-selection/no-max paths that do not materialize the index or finder.

## Subagent Swarms

Scout/slice synthesis recorded for the implementation thread:

- Scout agents: 8
- Slice-plan agents: 8
- Implementation-helper agents: 8
- Used less than default reason: none; this is the product-visible native rhyme slice and should keep the default lower-bound swarm counts.

Scout synthesis:

- `src/editor/suggestions.ts` contains the core `createRhymeSuggestionProvider(index, options)` seam, fallback provider behavior, anchor preference, active-word threshold, candidate exclusion, and exact-candidate mapping.
- Base `src/editor/LyricsEditorScreen.tsx` called `staticSuggestionProvider.getSuggestions(selectionContext)`; Phase 05 moved that call to a bundled rhyme-backed provider.
- `src/rhyme/defaultCmuIndex.ts` is the Phase 04 import seam for the bundled CMU index; raw `data/cmudict.txt` parsing must remain build/check-time only.
- `SuggestionBar` only consumes `WordSuggestion` and should not need rendering changes for exact rhyme MVP suggestions.
- Existing fallback tests cover static suggestions; missing coverage is the rhyme-backed provider behavior and the screen's type-safe move to the default CMU-backed provider.

Slice-plan synthesis:

- `provider-tests`: add fixture-index tests for `createRhymeSuggestionProvider` using small CMU-style fixtures, not the full generated artifact.
- `native-provider-wiring`: swap the screen to a cached rhyme-backed provider backed by `getBundledCmuRhymeIndex()`, while preserving the current focused-editor guard and insertion command path.
- `fallback-and-exclusion`: verify no suggestions for non-empty selection, stable fallback for missing anchors/OOV anchors, and exclusion of previous/active tokens after normalization.
- `typing-path-guard`: ensure implementation does not parse raw CMU data, scan text globally, rebuild the index, log lyric content, or issue network/SQLite work on each suggestion refresh.
- `turn-doc-and-gates`: keep review, CI, PR, and Beads evidence in this existing phase turn doc only.

Implementation-helper synthesis:

- Prefer a small integration change over a new abstraction. The provider seam is already deep enough for this phase.
- If a bundled provider wrapper remains, keep it thin and make any difference from `createRhymeSuggestionProvider` intentional; do not let anchor/exclusion rules fork silently across files.
- Keep full-dictionary artifact smoke outside default Jest. Phase 05 tests should stay fixture-sized; Phase 06 can add stronger slant/performance guards.
- If first-focus hydration proves visible during review, file or handle a bounded follow-up rather than widening Phase 05 into async ranking or background indexing unless the reviewer marks it a blocker.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Pending. No separate review doc should be created.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `local-gates-passed`

Evidence:

- `npm test -- --runTestsByPath src/editor/__tests__/suggestions.test.ts`: passed, 1 suite, 20 tests.
- `npm test`: passed, 12 suites, 93 tests.
- `npm run typecheck`: passed.
- `git diff --check`: passed.
- Hosted CI/PR checks: PR #20 opened as draft; hosted check state not yet reviewed by the implementation worker.

## PR And Commits

- PR: `https://github.com/dirtydishes/lyricslab/pull/20`
- Branch: `lavender/offline-rhyme-phase-05`
- Base: `lavender/expo-clean-rebuild`
- Implementation commit: `3fb798254473a7eee4494fbe7b17122e10266dc8` (`wire native rhyme suggestions`)

## Beads Updates

Live Beads was inspected and `lyricslab-gg4` remains `IN_PROGRESS`. This worker did not close Beads; `.beads/issues.jsonl` contains the existing phase claim/export state.

## Follow-Ups Filed

None.

## Context To Keep

- Keep `SuggestionBar` usable and non-disruptive.
- Do not add highlighting or bridge messages here.
- `src/rhyme/defaultCmuIndex.ts` is the intended Phase 05 seam for bundled CMU-backed suggestions.
- `src/editor/suggestions.ts` should remain the canonical owner for anchor selection, fallback behavior, candidate exclusion, and `WordSuggestion` mapping unless the bundled provider wrapper documents a narrower responsibility.
- Keep default tests fixture-sized and deterministic; do not load the full generated CMU artifact in Jest unless there is a specific reviewed reason.
- Preserve existing insertion behavior: tapping a suggestion still calls `insertSuggestion(suggestion.word)` at the editor cursor.
- Slant ranking, richer active-rhyme prediction, phrase rhymes, and performance guard expansion belong to Phase 06 or later follow-ups.

## Closeout

Open pending implementation commit, PR, review, and orchestrator closeout.
