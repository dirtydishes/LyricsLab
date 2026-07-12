# Phase 04 Turn Doc: Rap Lexicon and Safety Data

Beads issue: `lyricslab-5iw.4`

Phase doc: `docs/implementation/production-rhyme-suggestions/04-rap-lexicon-safety-data.md`

## Accepted Outcome

Curate at least 500 reviewed contemporary US hip-hop forms and prove the 90% independent OOV, safety, profanity, and proper-noun policies.

## Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.4",
  "risk": "high",
  "strategy": "threads",
  "implementation_owner": "visible delegated source-curation task on lavender/production-rhyme-phase-04",
  "review_independence": "fresh independent evaluation task creates the sealed 250-case OOV set after source curation; a separate fresh reviewer then uses thermo-nuclear-code-quality-review",
  "delegation_plan": [
    "author and validate at least 500 project-owned reviewed rap entries plus safety and proper-noun source manifests without seeing the later acceptance set",
    "independently author the 250-case OOV gold set and measure coverage/negative controls after curation ownership returns",
    "strictly review provenance, policy behavior, evaluation independence, maintainability, tests, and CI evidence"
  ],
  "model_and_effort_rationale": "Use standard task speed and xhigh reasoning because regional language coverage, pronunciation evidence, safety policy, and evaluation independence require careful editorial and technical judgment; fast mode remains disabled.",
  "required_evidence": [
    "symbolic branch and worktree preflight",
    "at least 500 unique reviewed entries with surface, pronunciation/alias, category, region, provenance, and review state",
    "project-owned safety and proper-noun policy manifests",
    "schema/count/completeness and direct/alias pronunciation controls",
    "sealed independent 250-case OOV evaluation at or above 90 percent with ambiguous negatives",
    "ordinary profanity allowance, high-risk unsolicited suppression, and analyzable-anchor behavior",
    "proper-noun explicit-prefix behavior",
    "npm test, npm run typecheck, npm run check:rhyme-sources, strict review, and terminal CI state"
  ],
  "user_constraints": [
    "run task remains orchestrator-only",
    "standard delegated-task speed; no fast mode",
    "exactly one final callback per delegated task to 019f5428-f2ea-74c2-abfb-e37349c96391",
    "one active implementation PR and one owner per mutable checkout",
    "do not assemble the production binary or activate the provider in Phase 04",
    "do not tune source curation against the sealed acceptance set without disclosure"
  ]
}
```

## Adaptations

- User-approved 2026-07-12 sequence amendment keeps this phase focused on human-reviewable project-owned rap, safety, and proper-noun sources. New Phase 04A owns the external-source pins, NOTICE, and complete production artifact.

## Discoveries And Decisions

Approved sequence amendment: `lyricslab-5iw.4a` now follows this issue, and native integration waits for that production artifact phase.

## Implementation And Delegation Evidence

- Canonical base is `lavender/expo-clean-rebuild` at `62c946b1`, containing closed Phases 01-03 and the approved seven-phase sequence.
- Prepared symbolic branch `lavender/production-rhyme-phase-04` directly from that base.

## Changed Behavior And Files

None.

## Review

Pending independent review.

## CI And Gates

Owner: delegated Phase 04 source-curation task, independent evaluation task, then strict review task

State: `unresolved`

Evidence:

None.

## PR And Commits

None.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.3`.

## Plan Amendments

None.

## Context To Keep

Gold-set independence and disputed-pronunciation review must be preserved; the lexicon cannot be tuned against the acceptance set without disclosure. Keep source manifests compatible with the Phase 03 format, but do not claim a complete production artifact in this phase.

## Closeout

Selected and claimed in Beads; source-curation delegation pending.
