# Run Loop: Production Offline Rhyme Suggestions

Dirtyloop version: `2`

Canonical tracker: Beads epic `lyricslab-5iw`

Start from:

- `docs/implementation/production-rhyme-suggestions/IMPLEMENT.md`
- `docs/implementation/production-rhyme-suggestions/loop-state.md`
- the ready Beads phase and its linked phase doc

## Run Contract

1. Keep this task orchestrator-only. Select one ready phase from Beads and read its outcome, constraints, decisions, acceptance evidence, and replanning triggers.
2. Confirm the canonical implementation base contains the prerequisite completed Expo/WebView and offline-rhyme work. Record a compact orchestration brief in the existing phase turn doc before launch.
3. Use visible delegated implementation and independent review tasks. Choose model, reasoning effort, internal subagent use, and concurrency per mission; task speed is standard and fast mode is forbidden.
4. Before every delegated launch, bind the concrete run-time orchestrator task ID. Require the delegate to include both that target and its own source task ID and to send exactly one final callback conforming to the appropriate schema.
5. Give each mutating or reviewing task the intended repo/worktree and symbolic phase branch. Its first file-related action must prove `pwd`, repo root, symbolic branch, and short branch status. Wrong environment or detached HEAD is a launch failure; the delegate blocks instead of repairing it.
6. Keep one active implementation PR using a `lavender/` branch and explicit base/head. Do not let multiple actors mutate one checkout.
7. Implement within phase scope. Record proposed plan amendments when evidence invalidates accepted intent; file Beads follow-ups instead of widening scope.
8. Obtain independent review. Reviewer agents use `thermo-nuclear-code-quality-review`, may repair in-scope findings, update the same phase turn doc, and resolve CI to an allowed terminal state.
9. After accepted implementation/review/CI/PR evidence, update Beads first, export `.beads/issues.jsonl`, then mirror state into `loop-state.md` and the existing turn doc.
10. Continue phase-by-phase until the epic is complete, blocked, interrupted, or review/CI is unresolved. Stop after one phase only when explicitly invoked with `--once`.

## User Constraints

- Orchestrator-callback workflow with the run task remaining coordination-only.
- Exactly one final callback per delegated task; no creation-task ID may be persisted as a future callback target.
- Standard task speed; no fast mode. Use `xhigh` at standard speed when higher reasoning is warranted.
- One active implementation PR and one owner per mutable checkout.
- Preserve the earlier closed rhyme-loop history and use a verified prerequisite implementation base.
- Physical-iPhone release evidence and writer sign-off are mandatory for final completion.

## Start Prompt

Run the orchestrator-callback dirtyloop for Beads epic `lyricslab-5iw`. Keep this task orchestrator-only, bind its concrete task ID before each delegated launch, preserve accepted intent, record the orchestration brief before broad work, and continue until complete or a defined stop condition occurs.
