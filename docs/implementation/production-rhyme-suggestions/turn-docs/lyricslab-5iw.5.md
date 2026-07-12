# Phase 05 Turn Doc: Native Integration and Suggestion UI

Beads issue: `lyricslab-5iw.5`

Phase doc: `docs/implementation/production-rhyme-suggestions/05-native-integration-suggestion-ui.md`

## Accepted Outcome

Integrate the production engine behind the existing native provider and ship compact, accessible semantic-role pills without destabilizing editing or widening the bridge.

## Orchestration Brief

- Risk: high. This phase activates the 19.4 MB production engine in the normal app path and couples asynchronous runtime state to latency-sensitive editor suggestions and accessibility behavior.
- Execution: one visible xhigh implementation task at standard speed owns the prepared checkout, followed by a fresh independent `thermo-nuclear-code-quality-review` task. The orchestrator alone owns Git publication, PR merge, and Beads closeout when delegated Git metadata is read-only.
- Checkout: `/home/delta/.codex/worktrees/1295/lyricslab`, symbolic branch `lavender/production-rhyme-phase-05`, based on canonical closeout commit `1db6592f` containing merged Phase 04A.
- Provider seam: replace the legacy bundled provider only at app-level construction. Preserve the existing `RhymeEngine` editor-facing interface and narrow bridge envelopes; no new WebView messages or rhyme metadata payloads.
- Runtime strategy: initialize after first frame through the Phase 04A production runtime, retain the stable proxy/last-good behavior, expose loading/error/retry through existing settings state, and use monotonic generation guards so stale initialization or suggestion work cannot win.
- Suggestion strategy: cache expensive candidates by completed anchor, keep the anchor stable while the next partial token changes, filter prefixes cheaply, incorporate non-persisted `bodyText` repetition penalties, preserve trustworthy thresholds, and return at most eight results without padding.
- UI/accessibility: implement the accepted compact two-line semantic-role pills with deterministic prompt/loading/error states, selection hiding, casing, 44-point targets, Dynamic Type, VoiceOver labels/roles, focus/pressed states, reduced-motion behavior, and a 150-200 ms result crossfade.
- Evidence: focused provider/runtime/UI/insertion tests plus full Jest, typecheck, editor tests/build/freshness, Expo config, transitive boundary controls, and honest hosted CI/mergeability evidence.
- Callback binding: implementation and review tasks each send exactly one final callback to orchestrator `019f5428-f2ea-74c2-abfb-e37349c96391` with their own source task ID.

## Adaptations

None.

## Discoveries And Decisions

None.

## Implementation And Delegation Evidence

None.

## Changed Behavior And Files

None.

## Review

Pending independent review.

## CI And Gates

Owner: `unassigned`

State: `unresolved`

Evidence:

None.

## PR And Commits

None.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.4a`.

## Plan Amendments

None.

## Context To Keep

Keep policy in the canonical native provider seam; do not introduce bridge messages, highlighting spans, or persisted lyric analysis.

## Closeout

Not started.
