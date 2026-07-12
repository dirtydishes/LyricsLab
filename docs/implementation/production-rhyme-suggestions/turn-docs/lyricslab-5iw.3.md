# Phase 03 Turn Doc: Deterministic Data Pipeline

Beads issue: `lyricslab-5iw.3`

Phase doc: `docs/implementation/production-rhyme-suggestions/03-deterministic-data-pipeline.md`

## Accepted Outcome

Produce a pinned, licensed, reproducible binary artifact and bounded asynchronous mobile loader with no raw parsing, SQL, or large static JSON on the typing path.

## Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.3",
  "risk": "high",
  "strategy": "threads",
  "implementation_owner": "visible delegated implementation task on lavender/production-rhyme-phase-03",
  "review_independence": "fresh visible reviewer task using thermo-nuclear-code-quality-review after implementation",
  "delegation_plan": [
    "audit every proposed input's local availability, redistribution terms, version pin, and hash before choosing the committed artifact corpus",
    "implement and verify a deterministic binary compiler plus bounded Expo loader behind the Phase 02 RhymeEngine seam",
    "independently challenge provenance, byte reproducibility, binary validation, loading atomicity, hot-path boundaries, and CI evidence"
  ],
  "model_and_effort_rationale": "Use standard task speed and xhigh reasoning because source licensing, deterministic binary design, and asynchronous mobile publication create coupled correctness and provenance risks; fast mode remains disabled.",
  "required_evidence": [
    "symbolic branch and worktree preflight",
    "reviewable source versions, redistribution terms, attribution, and SHA-256 pins",
    "two byte-identical clean regenerations and a temporary-output freshness check",
    "format header, numeric tables/indexes/flags, version, and source hashes",
    "corruption and version-mismatch safe failures",
    "bounded post-first-frame Expo Asset/FileSystem loading with atomic publication",
    "no raw CMU parsing, SQLite, network, or large static JSON on the typing path",
    "npm test, npm run typecheck, build:rhyme-data, check:rhyme-data, and Expo public config",
    "independent strict review and terminal CI state"
  ],
  "user_constraints": [
    "run task remains orchestrator-only",
    "standard delegated-task speed; no fast mode",
    "exactly one final callback per delegated task to 019f5428-f2ea-74c2-abfb-e37349c96391",
    "one active implementation PR and one owner per mutable checkout",
    "stop for approval if a required source cannot be legally redistributed or accepted provenance cannot be established"
  ]
}
```

## Adaptations

- Canonical base is `lavender/expo-clean-rebuild` at `7edb3ca8`, containing merged and closed Phase 01 and Phase 02 work.
- Prepared symbolic branch `lavender/production-rhyme-phase-03` directly from that base.

## Discoveries And Decisions

None.

## Implementation And Delegation Evidence

None.

## Changed Behavior And Files

None.

## Review

Pending independent review.

## CI And Gates

Owner: delegated Phase 03 implementation task, then independent review task

State: `unresolved`

Evidence:

None.

## PR And Commits

None.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.2`.

## Plan Amendments

None.

## Context To Keep

SUBTLEX-US attribution and every committed artifact source hash are acceptance evidence, not optional documentation.

## Closeout

Selected and claimed in Beads; implementation delegation pending.
