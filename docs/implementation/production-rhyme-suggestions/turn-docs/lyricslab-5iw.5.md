# Phase 05 Turn Doc: Native Integration and Suggestion UI

Beads issue: `lyricslab-5iw.5`

Phase doc: `docs/implementation/production-rhyme-suggestions/05-native-integration-suggestion-ui.md`

## Accepted Outcome

Integrate the production engine behind the existing native provider and ship compact, accessible semantic-role pills without destabilizing editing or widening the bridge.

## Orchestration Brief

- Risk: high. This phase activates the reviewed 19.4 MB binary-v2 production runtime in the normal app path and connects asynchronous engine state to latency-sensitive editing and accessibility behavior.
- Execution: one genuinely fresh zero-history `gpt-5.6-sol` implementation task at high reasoning in fast mode owns the prepared branch, followed by a separate fresh Sol/high `thermo-nuclear-code-quality-review` task. The orchestrator owns Git publication, PR merge, and Beads closeout.
- Checkout base: reviewed clean-room Phase 04A replacement merge `26d99983`; Phase 05 branch `lavender/production-rhyme-phase-05-sol`.
- Provider seam: activate `createProductionRhymeEngineRuntime` only at app-level construction. Preserve the existing editor-facing `RhymeEngine` interface and bridge envelopes; no new WebView messages or rhyme metadata payloads.
- Runtime: initialize after first frame, preserve compact indexed lazy queries, stable proxy/atomic last-good publication, generation cancellation, bounded I/O, listener isolation, and explicit retry/settings state. Do not regress the reviewed memory/query guards.
- Suggestion policy: cache expensive candidates by completed anchor, filter the partial prefix cheaply, feed non-persisted `bodyText` repetition penalties, preserve safety suppression and explicit-prefix proper-name eligibility, and return at most eight trustworthy results without padding.
- UI/accessibility: deterministic prompt/loading/error states, selection hiding, casing/insertion behavior, compact two-line semantic-role pills, Dynamic Type, VoiceOver, 44-point targets, focus/pressed states, reduced motion, theme contrast, and only the accepted 150-200 ms crossfade.
- Evidence: focused provider/runtime/UI tests plus full Jest, typecheck, editor tests/build/freshness, production/fixture/source/evaluator regressions, memory/performance non-regression, Expo config, transitive bridge/scope controls, and honest hosted CI evidence.
- Callback target: implementation and review each send exactly one final callback to orchestrator `019f5428-f2ea-74c2-abfb-e37349c96391` with their actual source task ID.

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
