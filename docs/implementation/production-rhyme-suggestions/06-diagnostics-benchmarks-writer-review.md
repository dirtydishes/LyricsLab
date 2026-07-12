# Phase 06: Diagnostics, Benchmarks, and Writer Review

Canonical Beads issue: `lyricslab-5iw.6`

Epic: `lyricslab-5iw`

Status is tracked in Beads. This document preserves accepted intent and is decision-complete, implementation-open.

## Outcome

Close the milestone with production-faithful diagnostics, deterministic Node and physical-iPhone release benchmarks, the 60-case writer review, full automated gates, and airplane-mode/device acceptance evidence.

## Why This Phase Exists

Offline correctness is insufficient without measured release interaction latency, privacy-safe evidence, real writer judgment, and physical-device validation of the complete editor experience.

## Scope

Allowed:

- Build-flag-only diagnostics route, quick Node benchmark, selected-device release benchmark, copy/share JSON, versioned seeded synthetic corpus, writer-review mode, regression fixture capture, final device checklist, and loop closeout evidence.

Out of scope:

- Production diagnostics navigation, telemetry, user lyrics, TestFlight, Android, or changing accepted thresholds to make results pass.

## Constraints

- Diagnostics are absent from normal production navigation.
- Discard warmups and report cold load separately.
- Measure native selection-context receipt through first committed suggestion-bar frame.
- Warm release latency is p50 below 50 ms and p95 below 100 ms.
- Record no lyrics, real-song anchors, or returned user content.
- Every wrong, mislabeled, or unsafe writer result is fixed; rejected rankings become fixtures; every recognized anchor has an acceptable top-three result; writer sign-off is explicit.

## Settled Decisions

The final checklist uses a local release build on a physical iPhone and includes editing/search/relaunch, non-blocking load, all pill roles, prefix/caret/selection behavior, repeated insertion, repetition penalty, theme persistence, airplane mode, injected failure/retry, latency, and writer sign-off.

## Open Questions

None.

## Dependencies

- Depends on: `lyricslab-5iw.5`
- Parallel-safe: no

## Acceptance Evidence

Shareable benchmark JSON with build/device/artifact/case/latency/pass metadata; stable-corpus checks; all required automated gates; signed 60-case review record; regression fixtures; complete physical-iPhone release checklist; independent review; terminal CI evidence; final storyboard.

## Quality Gates

`npm test`; `npm run typecheck`; `npm run editor:test`; `npm run build:editor-html`; `npm run check:rhyme-data`; `npx expo config --type public`; `npm run benchmark:rhyme`; `npm run benchmark:rhyme:ios -- --device <device>`.

## Replanning Triggers

No physical iPhone is available, writer sign-off is unavailable, production instrumentation cannot measure the accepted interval, privacy constraints are violated, or latency/quality thresholds cannot be met without changing accepted behavior.

## Implementation Hypotheses

Reuse production rendering and ranking in diagnostics, isolate benchmark corpus/results from user storage, and automate machine-verifiable portions of the physical checklist while retaining explicit human sign-off.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
