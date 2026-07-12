# Phase 01 Turn Doc: Foundation, Theme, and Editor Contract

Beads issue: `lyricslab-5iw.1`

Phase doc: `docs/implementation/production-rhyme-suggestions/01-foundation-theme-editor-contract.md`

## Accepted Outcome

Persist and propagate accessible System/Light/Dark theming, expose engine state in Settings, preserve the bridge envelope, implement prefix replacement, and protect generated-editor freshness.

## Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.1",
  "risk": "high",
  "strategy": "threads",
  "implementation_owner": "visible delegated implementation task on lavender/production-rhyme-phase-01",
  "review_independence": "fresh visible reviewer task using thermo-nuclear-code-quality-review after implementation",
  "delegation_plan": [
    "implement the accepted Phase 01 outcome, tests, phase turn-doc evidence, commit, push, and explicit-base/head PR",
    "independently review, repair in-scope findings, run/own CI evidence, and update the same turn doc"
  ],
  "model_and_effort_rationale": "Use the configured standard-speed model with xhigh reasoning because Phase 01 spans persistence, native UI, WebView contracts, accessibility, and branch/PR integration.",
  "required_evidence": [
    "symbolic branch and worktree preflight",
    "settings persistence and theme resolution tests",
    "native/WebView theme propagation and contrast evidence",
    "prefix replacement and editor freshness tests",
    "phase quality gates",
    "independent review",
    "terminal CI state",
    "explicit-base/head PR state"
  ],
  "user_constraints": [
    "run task remains orchestrator-only",
    "standard task speed; no fast mode",
    "exactly one final callback per delegated task to 019f5428-f2ea-74c2-abfb-e37349c96391",
    "one active implementation PR and one owner per mutable checkout"
  ]
}
```

## Adaptations

- The first branch-bound task launched detached and correctly blocked before file access. The launcher attached the prepared worktree, then forked a fresh visible task into the verified symbolic branch.
- The implementation task could not open the shared Beads lock, so it used tracked `.beads/issues.jsonl` read-only; canonical Beads authority remained with the orchestrator.
- Restricted package-network access prevented a fresh root install. The task used the canonical checkout's lockfile-matching dependency tree through an ignored local link; no lockfile or tracked dependency files changed.
- The task-local sandbox made shared Git metadata read-only after implementation. Once all source and gates were complete and the task was idle at that permission boundary, checkout ownership returned to the orchestrator for commit, push, and PR creation.

## Discoveries And Decisions

- Verified `lavender/expo-clean-rebuild` at `7fa9ac1f` as the canonical prerequisite base. It contains the completed Expo/WebView and offline-rhyme streams and merged PR history through offline-rhyme Phase 07.
- Prepared symbolic phase branch `lavender/production-rhyme-phase-01` from that base and overlaid only the production-loop control-plane docs; the polluted creation commit's tracked dependency trees were deliberately excluded.
- Preserved the existing `setTheme({theme})` WebView command; no WebView-to-native message or bridge-envelope widening was introduced.
- Expo public config revealed `userInterfaceStyle` was locked to light. It is now `automatic`, allowing System/Dark propagation through iOS, status bar, native screens, and WebView.
- Engine Settings expose truthful bundled-artifact readiness/version/diagnostic state without pre-implementing Phase 05's async production lifecycle.

## Implementation And Delegation Evidence

- Visible implementation task `019f5431-47e5-7510-aa55-dba2ca585f23` passed exact worktree/branch preflight and owned all source mutation.
- Added a separate SQLite-backed settings repository/provider with persisted System/Light/Dark preference and System default.
- Added semantic light/dark tokens and contrast assertions covering normal text plus Perfect/Near/Prompt role labels in both themes.
- Added Settings navigation and screen visibility for theme, engine state/version, retry, and diagnostics.
- Propagated resolved theme through native navigation, status bar, song list/editor, suggestion pills, and the existing WebView `setTheme` command.
- Implemented active-prefix replacement with casing preservation and exactly one trailing space, with editor tests.
- Regenerated the offline editor module and verified freshness.

## Changed Behavior And Files

- `app.json`, app routes, song list, editor, WebView, and suggestion surfaces now resolve semantic System/Light/Dark tokens.
- `src/settings/` owns persistence, provider state, engine status presentation, and Settings UI.
- `src/theme/` owns semantic tokens, resolution, and contrast guarantees.
- `packages/editor-web/src/suggestionInsertion.ts` owns prefix replacement/casing/trailing-space behavior.
- `src/editor/generated/editorHtml.ts` is regenerated from the editor source and passes freshness checking.

## Review

Independent review task `019f5445-6bf4-7ba3-b160-d373231f40d8` applied `thermo-nuclear-code-quality-review` to PR #23 against explicit base `lavender/expo-clean-rebuild`. The reviewer inspected all 48 PR paths, separating the accepted loop/control-plane bootstrap from the 28 implementation paths, and challenged maintainability, correctness, accessibility, persistence, bridge stability, generated output, and phase scope.

Actionable findings and repairs:

- Fixed an initial dark-mode flash: the WebView now receives a typed theme bootstrap before content loads, then continues using the existing `setTheme({ theme })` command after editor readiness and on subsequent changes. No bridge message or envelope was added.
- Raised touched back, retry, theme-choice, and delete controls to at least 44 points while preserving the compact suggestion layout.
- Extended exact-one-space insertion normalization to consume pasted non-breaking and other horizontal Unicode whitespace without consuming paragraph boundaries.
- Made theme preference publication atomic with persistence: the provider now publishes a new theme only after the settings write succeeds, while the Settings choices are disabled during the write. This removes the prior failed-write rollback read and cannot leave an unpersisted theme displayed when storage is unavailable.
- Removed two unused theme tokens and an unnecessary `useMemo`, reducing surface area without changing behavior.
- Regenerated `src/editor/generated/editorHtml.ts` after the editor repair and proved the non-mutating freshness check.

Thermo-nuclear result: no remaining structural regression, spaghetti growth, file-size threshold crossing, boundary leak, bridge widening, lyric logging, or out-of-phase product work. The largest touched source files remain below 500 lines; focused policy remains in the settings, theme, and editor-owned modules.

Impeccable source audit after repairs: accessibility `4/4`, performance `4/4`, responsive design `3/4` pending physical-device/Dynamic Type evidence in the accepted later phase, theming `4/4`, anti-patterns `4/4` — `19/20`. No P0/P1/P2 implementation findings remain in Phase 01.

## CI And Gates

Owner: independent review task `019f5445-6bf4-7ba3-b160-d373231f40d8`

State: `ci-unavailable-with-evidence`

Evidence:

- `npm test` — passed sequentially after review repairs, 16 suites and 129 tests.
- `npm run typecheck` — passed sequentially after review repairs.
- `npm run editor:test` — passed sequentially after review repairs, 3 files and 25 tests.
- `npm run build:editor-html` — passed, transformed 53 modules, and regenerated the checked-in editor module.
- `npm run check:editor-html` — passed immediately after the build; generated editor HTML is fresh.
- `npx expo config --type public` — passed; `userInterfaceStyle` remains `automatic` and `expo-sqlite`/`expo-router` remain configured.
- `git diff --check` — passed.
- GitHub PR metadata at remote head `718133e8` reports PR #23 open, non-draft, explicit base/head correct, and mergeable.
- GitHub combined statuses returned an empty status list; pull-request workflow lookup returned no runs; `.github/workflows` is absent in the repository. Hosted CI is therefore unavailable rather than pending or green.
- Review repairs are complete in the working tree. The delegated sandbox cannot write the shared Git worktree metadata, so the orchestrator owns commit/push and the post-push mergeability recheck.

## PR And Commits

- `0549c3ee` — `build production rhyme theme foundation`
- PR #23: `https://github.com/dirtydishes/lyricslab/pull/23`
- Explicit base/head: `lavender/expo-clean-rebuild` <- `lavender/production-rhyme-phase-01`

## Beads Updates And Follow-Ups

Issue created as the only initially ready child of `lyricslab-5iw`.

## Plan Amendments

None.

## Context To Keep

Creation checkout is not an implicitly accepted implementation base; verify prerequisites at run time.

## Closeout

Independent review completed with all in-scope findings repaired and no remaining code findings. Review ownership returns to the orchestrator to commit/push the completed working tree, re-read PR #23 at its new head, and perform canonical Beads closeout.
