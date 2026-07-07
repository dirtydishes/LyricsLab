# Implementation Thread Prompt

You are the implementation thread for Beads issue `<PHASE_ISSUE_ID>`.

Callback target:

`RUNTIME_ORCHESTRATOR_THREAD_ID`

This must be the runtime callback target for the thread orchestrating this run. If it is still the literal placeholder `RUNTIME_ORCHESTRATOR_THREAD_ID`, a loop-creation thread id, or any non-concrete value, stop and report a launch preflight failure.

After runtime substitution, you must send your final callback to the exact orchestrator thread id supplied by the orchestrator. Do not interpret this as `current orchestrator thread`, `this thread`, or any implicit wrapper metadata.

## Inputs

- Beads issue: `<PHASE_ISSUE_ID>`
- Phase doc: `<PHASE_DOC>`
- Implementation index: `docs/implementation/offline-rhyme-suggestions/IMPLEMENT.md`
- Turn doc: `<TURN_DOC>`
- Expected repo/worktree and branch/ref: supplied by orchestrator at launch
- Launch environment: this thread must already be bound to the intended Codex project worktree and assigned branch/ref before this prompt runs
- Launch defaults: speed `standard`, reasoning `xhigh`, inherit_orchestrator_thread_settings `false`, unless Beads metadata explicitly overrides the implementation actor. These are verification mirrors; they do not set the launch configuration.
- Actual launch settings: the orchestrator must have launched this Codex thread with `thinking: "xhigh"` and a branch-bound worktree target unless Beads metadata explicitly overrides the implementation actor
- Do not run this worker with inherited UI, recent thread, parent/orchestrator, `fast`, or `high` settings unless Beads metadata explicitly overrides the implementation actor

## Rules

- Before edits, verify `pwd`, `git rev-parse --show-toplevel`, `git symbolic-ref --short HEAD`, and the current branch/ref match the expected repo/worktree and branch/ref. A detached HEAD is a branch/ref mismatch.
- Do not `cd` into the target worktree as setup or recovery. If the launch environment is wrong, stop and send a blocked callback to the orchestrator.
- Implement exactly this phase.
- Do not widen scope.
- Do not do broad solo implementation.
- For non-trivial phases, run massive bounded swarms before broad edits:
  - 8-20 scout agents across files, modules, risks, tests, and integration edges
  - 8-16 slice-plan agents to propose non-overlapping implementation slices
  - 8-16 implementation-helper agents assigned to slices in parallel
- If this phase is tiny enough to use fewer than the default agents, record the reason in the turn doc and callback `swarm_summary`.
- Synthesize swarm reports into one coherent slice plan before broad edits.
- Integrate helper output yourself; own conflicts, final repairs, gates, branch state, PR state, and callback.
- Update the existing Markdown turn doc.
- Run local gates before PR when feasible.
- Open or update the PR.
- Do not create the review thread.
- Call back exactly once to the orchestrator.
- The callback payload must include `orchestrator_thread_id` set to the resolved runtime callback target and your `source_thread_id`.
- The callback payload must include `swarm_summary` with scout, slice-plan, implementation-helper, slice, synthesis, and under-default rationale fields.

## Callback States

Call back only when:

- PR is open and ready for review
- task is complete but PR cannot be created, with exact blocker
- genuinely blocked

Use the implementation callback schema from `schemas/implementation-callback.schema.json`.

