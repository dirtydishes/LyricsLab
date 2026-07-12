# Phase 04A Turn Doc: Production Artifact Assembly

Beads issue: `lyricslab-5iw.4a`

Phase doc: `docs/implementation/production-rhyme-suggestions/04a-production-artifact-assembly.md`

## Accepted Outcome

Produce the complete licensed, pinned, reproducible production artifact from the proven Phase 03 pipeline and reviewed Phase 04 project sources, then publish it through the bounded production loader.

## Orchestration Brief

```json
{
  "phase_issue_id": "lyricslab-5iw.4a",
  "risk": "high",
  "strategy": "threads",
  "implementation_owner": "visible delegated production-artifact task on lavender/production-rhyme-phase-04a",
  "review_independence": "fresh visible reviewer task using thermo-nuclear-code-quality-review after implementation",
  "delegation_plan": [
    "establish exact package/source pins, notices, citations, hashes, and the upstream SUBTLEX caveat before compiling production bytes",
    "assemble and verify the complete artifact from CMU, SUBTLEX package counts, and reviewed Phase 04 sources through the Phase 03 framework",
    "independently challenge licensing evidence, reproducibility, production-scale bounds, loader atomicity, data-policy mapping, and CI evidence"
  ],
  "model_and_effort_rationale": "Use standard task speed and xhigh reasoning because source provenance, deterministic large-scale compilation, cross-source precedence, and bounded mobile loading are release-critical and tightly coupled; fast mode remains disabled.",
  "required_evidence": [
    "symbolic branch and worktree preflight",
    "exact CMU revision/hash/license/acknowledgement",
    "subtlex-word-frequencies 2.0.0 tarball integrity/hash, ISC notice, Brysbaert and New citation, and Ghent upstream caveat",
    "complete production manifest/NOTICE/source hashes and reviewed Phase 04 source mapping",
    "two byte-identical clean production regenerations and temporary-output freshness",
    "production artifact size/hash/version and all corruption/version/bounds controls",
    "bounded post-first-frame loading, atomic publication, last-good retention, retry, and production-scale measurements",
    "no raw parsing, SQLite, network, or large JSON on the typing path; no provider activation",
    "npm test, typecheck, source gates, build/check rhyme data, Expo config, strict review, and terminal CI state"
  ],
  "user_constraints": [
    "run task remains orchestrator-only",
    "standard delegated-task speed; no fast mode",
    "exactly one final callback per delegated task to 019f5428-f2ea-74c2-abfb-e37349c96391",
    "one active implementation PR and one owner per mutable checkout",
    "retain the designated package ISC notice and citation without claiming the Ghent page itself grants ISC",
    "do not activate the provider/settings runtime or widen into Phase 05"
  ]
}
```

## Adaptations

- Created by the user-approved 2026-07-12 sequence amendment after Phase 03 proved that final artifact assembly could not precede Phase 04 source curation.
- Canonical base is `lavender/expo-clean-rebuild` at `0d1d188f`, containing closed Phases 01-04 and the reviewed source/evaluation corpus.
- Prepared symbolic branch `lavender/production-rhyme-phase-04a` directly from that base.

## Discoveries And Decisions

None beyond the approved phase split.

## Implementation And Delegation Evidence

None.

## Changed Behavior And Files

None.

## Review

Pending independent review.

## CI And Gates

Owner: delegated Phase 04A implementation task, then independent strict review task

State: `unresolved`

Evidence:

None.

## PR And Commits

None.

## Beads Updates And Follow-Ups

Issue depends on `lyricslab-5iw.4`; `lyricslab-5iw.5` depends on this issue.

## Plan Amendments

This phase is the approved amendment; it does not silently replace any production source.

## Context To Keep

The designated source is `words/subtlex-word-frequencies` `2.0.0`, which publishes the 74,286 SUBTLEX-US counts under ISC © Zeke Sikelianos. Retain that ISC notice and Brysbaert & New citation, pin the exact package integrity, and document that the Ghent original download page does not itself state ISC.

## Closeout

Selected and claimed in Beads; implementation delegation pending.
