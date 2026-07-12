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

None.

## Discoveries And Decisions

- Verified `lavender/expo-clean-rebuild` at `7fa9ac1f` as the canonical prerequisite base. It contains the completed Expo/WebView and offline-rhyme streams and merged PR history through offline-rhyme Phase 07.
- Prepared symbolic phase branch `lavender/production-rhyme-phase-01` from that base and overlaid only the production-loop control-plane docs; the polluted creation commit's tracked dependency trees were deliberately excluded.

## Implementation And Delegation Evidence

None.

## Changed Behavior And Files

None.

## Review

Pending independent review.

## CI And Gates

Owner: delegated Phase 01 implementation task, then independent review task

State: `unresolved`

Evidence:

None.

## PR And Commits

None.

## Beads Updates And Follow-Ups

Issue created as the only initially ready child of `lyricslab-5iw`.

## Plan Amendments

None.

## Context To Keep

Creation checkout is not an implicitly accepted implementation base; verify prerequisites at run time.

## Closeout

Not started.
