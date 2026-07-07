# Run Loop: Offline Rhyme Suggestions MVP

Workflow: `orchestrator-callback`

Canonical tracker: Beads epic `lyricslab-8um`

Start from:

- Beads epic: `lyricslab-8um`
- Beads loop metadata on the epic
- Implementation index: `docs/implementation/offline-rhyme-suggestions/IMPLEMENT.md`
- Resume aid: `docs/implementation/offline-rhyme-suggestions/loop-state.md`

## Rules

- Beads is canonical.
- Select exactly one next ready Beads child issue.
- Use the selected workflow's phase-selection gate; do not pick phases inline when the workflow requires selector subagents.
- Continue phase-by-phase by default until the epic is complete, blocked, interrupted, or review/CI is unresolved.
- Stop after one phase only when this run explicitly says `run once` or `--once`.
- Read the linked phase doc before editing.
- Keep one active implementation PR at a time unless Beads and the phase doc explicitly allow parallel work.
- Use the workflow's required large bounded subagent swarms.
- Reviewer agents must use `thermo-nuclear-code-quality-review`.
- Reviewer and CI verification agents own CI.
- Orchestrator-callback child actors must launch with actual actor settings: `speed: standard`, `reasoning: xhigh`, and `inherit_orchestrator_thread_settings: false`, unless Beads metadata overrides that actor. For Codex implementation/review threads, pass `thinking: "xhigh"` on the launch call; for selector/closeout-selector subagents, pass `reasoning_effort: "xhigh"` on the launch call. Prompt text may mirror these settings, but it does not set them.
- Orchestrator-callback callback targets are bound at run time. Before launching workers or reviewers, replace `RUNTIME_ORCHESTRATOR_THREAD_ID` with the actual thread id for the thread orchestrating this run, or with an explicit user-supplied callback target for this run.
- Do not use the thread id from `dirtyloops create`, a prior run, a child thread, or `source_thread_id` as the callback target.
- Orchestrator-callback implementation/review threads must be created in the intended Codex project worktree and assigned branch/ref using first-class thread environment control. Materialize the assigned branch/ref before launch, then use a branch-bound worktree target. Worker/reviewer prompts verify repo/worktree and branch/ref; they do not repair a wrong launch environment or detached HEAD with shell cwd changes.
- Do not inherit child-thread speed or reasoning from the current UI, recent Codex thread defaults, or the orchestrator thread.
- Update the existing Markdown turn doc.
- Update Beads first, then update `loop-state.md`.
- Do not widen the selected phase.

## Workflow Addendum

This loop uses a main orchestrator thread plus separate implementation and review threads.

- Only the orchestrator creates implementation and review threads.
- The orchestrator creates implementation and review threads in the intended Codex project worktree using first-class thread environment control. Do not launch a generic thread and ask it to `cd` into the worktree.
- The orchestrator materializes the assigned branch/ref before launching implementation or review threads, then launches the Codex worktree thread from that existing branch/ref. Do not launch a detached HEAD or default-branch worktree and ask the child to attach itself.
- Before the first worker, the orchestrator launches a selector subagent to choose exactly one next ready Beads phase.
- After every review callback, the orchestrator launches a closeout-selector subagent before closing the phase, stopping, or launching another worker.
- Selector and closeout-selector subagents return `swarm-report` payloads with mission `selector` or `closeout-selector`; they do not mutate Beads, edit files, implement, review, repair, create threads, or advance the loop.
- Selector, implementation, review, and closeout-selector actors launch with actual actor settings: `speed: standard`, `reasoning: xhigh`, and `inherit_orchestrator_thread_settings: false`, unless Beads metadata overrides that actor.
- Codex implementation/review thread launches pass `thinking: "xhigh"` and use a branch-bound worktree target. Selector and closeout-selector subagent launches pass `reasoning_effort: "xhigh"`. Prompt text may mirror these settings, but it does not set them.
- Do not inherit current UI settings, recent Codex defaults, or orchestrator-thread speed/reasoning. `fast` speed and `high` reasoning require explicit Beads metadata for the actor being launched.
- Before launching a worker or reviewer, resolve the runtime callback target: the actual thread id for the thread orchestrating this run, or an explicit user-supplied callback target for this run.
- Do not use the thread id from `dirtyloops create`, a prior run, a child thread, or `source_thread_id` as the callback target.
- Replace `RUNTIME_ORCHESTRATOR_THREAD_ID` in the worker/reviewer prompt before launch.
- Before launching a worker or reviewer, verify the actual prompt text includes the resolved exact thread id and does not contain `RUNTIME_ORCHESTRATOR_THREAD_ID` or rely on generic wording like `current orchestrator thread` or `this thread`.
- Before launching a worker or reviewer, verify the child thread launch target is the intended project worktree and assigned branch/ref. Prompt text may include expected repo root/worktree and branch/ref for verification only; it must not use `cd` as setup or recovery, and detached HEAD is a mismatch.
- After launching a worker or reviewer, wait for its single callback. Do not repeatedly read, monitor, summarize, or status-check the child thread while waiting.
- Use a sparse fallback heartbeat around 30 minutes only when the callback is overdue or liveness is uncertain; do not use heartbeat as routine polling.
- Implementation threads update the existing phase turn doc, open the PR, and call back exactly once when PR-ready or blocked.
- Implementation callback payloads must echo `orchestrator_thread_id` and include `source_thread_id`.
- Implementation threads do not create review threads.
- Review threads use `thermo-nuclear-code-quality-review`.
- Review threads own CI, repairs, reruns, and evidence.
- Review threads update the existing phase turn doc and call back exactly once when review and CI are resolved.
- Review callback payloads must echo `orchestrator_thread_id` and include `source_thread_id`.
- The orchestrator validates selector reports, owns Beads closeout, and launches only the selected next phase.
- Implementation threads are swarm-first for non-trivial phases: 8-20 scout agents, 8-16 slice-plan agents, and 8-16 implementation-helper agents before broad edits.
- The implementation thread synthesizes swarm reports into the existing turn doc, integrates helper output coherently, and includes `swarm_summary` in the implementation callback.

## Stream Completion

When the Beads epic is complete:

1. Verify every phase has a Markdown turn doc.
2. Generate `docs/implementation/offline-rhyme-suggestions/storyboard-post-run-mm-dd-yyyy.html`.
3. Use `impeccable` when present. If missing, continue and note that it was skipped.
4. Install `@pierre/diffs` in the target repo if missing, then render every diff with `@pierre/diffs/ssr`.
5. Verify the storyboard.

## Start Prompt

Run the `offline-rhyme-suggestions` dirtyloop using the `orchestrator-callback` workflow.

Repo: `.`

Beads epic: `lyricslab-8um`

Stream docs: `docs/implementation/offline-rhyme-suggestions/`

Run policy: continue until the epic is complete, blocked, interrupted, or review/CI is unresolved. Do not stop after one phase unless this run explicitly says `run once` or `--once`.

Runtime callback target: bind `RUNTIME_ORCHESTRATOR_THREAD_ID` to the actual thread id for the thread orchestrating this run before launching any implementation or review thread. Do not persist that concrete id into generated loop artifacts.

Branch/PR policy: one active implementation PR at a time. Use branch prefix `lavender/`. The loop was created from `lavender/expo-clean-rebuild`; materialize each assigned branch/ref before launching child threads.

Quality gates:

- `npm test`
- `npm run typecheck`
- `npm run editor:test`
- `npm run build:editor-html` when editor-web or WebView loading changes
- `npx expo config --type public` when Expo config or dependencies change

Before the first worker:

1. Run a selector subagent with `reasoning_effort: "xhigh"` and standard speed.
2. The selector reads Beads ready state, `IMPLEMENT.md`, `loop-state.md`, and linked phase docs.
3. The selector returns at most one ready phase using `schemas/swarm-report.schema.json`.
4. The orchestrator validates the report and remains the only actor that mutates Beads or advances the loop.

For each selected phase:

1. Materialize the assigned branch/ref with prefix `lavender/`.
2. Launch the implementation thread in the intended Codex project worktree from that branch/ref with `thinking: "xhigh"`, standard speed, and `inherit_orchestrator_thread_settings: false`.
3. Substitute the concrete runtime callback target into `prompts/implementation-thread.md` before launch. Do not launch if the prompt still contains `RUNTIME_ORCHESTRATOR_THREAD_ID`.
4. The implementation thread runs swarm-first for non-trivial phases: 8-20 scouts, 8-16 slice-plan agents, and 8-16 implementation-helper agents.
5. The implementation thread updates the existing phase turn doc, runs feasible local gates, opens/updates a PR, and calls back exactly once.
6. Launch a review thread only after a valid implementation callback. Use `prompts/review-thread.md`, `thinking: "xhigh"`, standard speed, branch-bound worktree launch, and the same runtime callback target substitution rule.
7. The review thread uses `thermo-nuclear-code-quality-review`, owns CI/repairs/evidence, updates the same turn doc, and calls back exactly once when review and CI are resolved.
8. After the review callback, run a closeout-selector subagent before closing the phase or launching the next one.
9. Update Beads first, then update `loop-state.md`.

Do not widen scope into WebView highlighting, phrase-rhyme visualization, audio, IAP, sync, AI collaborator flows, neural ranking, or user-teachable slant preferences. File Beads follow-ups instead.

