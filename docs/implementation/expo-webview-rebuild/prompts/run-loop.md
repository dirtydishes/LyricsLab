# Run Loop: LyricsLab Expo WebView Rebuild Foundation

Workflow: `orchestrator-callback`

Canonical tracker: Beads epic `lyricslab-jd5`

Start from:

- Beads epic: `lyricslab-jd5`
- Implementation index: `docs/implementation/expo-webview-rebuild/IMPLEMENT.md`
- Resume aid: `docs/implementation/expo-webview-rebuild/loop-state.md`

## Rules

- Beads is canonical.
- Select exactly one next ready Beads child issue.
- Read the linked phase doc before editing.
- Keep one active implementation PR at a time unless Beads and the phase doc explicitly allow parallel work.
- Use large bounded subagent swarms when useful.
- Reviewer agents must use `thermo-nuclear-code-quality-review`.
- Reviewer and CI verification agents own CI.
- Update the existing Markdown turn doc.
- Update Beads first, then update `loop-state.md`.
- Do not widen the selected phase.

## Workflow Addendum

This loop uses the orchestrator-callback topology.

- The orchestrator owns phase selection, implementation-thread creation, review-thread creation, callback targets, Beads updates, `loop-state.md`, phase closeout, and stream closeout.
- A selector subagent chooses exactly one next ready Beads child issue; selector subagents never implement.
- The implementation thread owns exactly one selected Beads issue, branch/worktree setup assigned by the orchestrator, implementation, local gates before PR when feasible, PR creation/update, the existing phase turn doc, and exactly one implementation callback.
- The review thread owns `thermo-nuclear-code-quality-review`, reviewer subagent swarms, CI inspection/diagnosis/repair/rerun/evidence, the existing phase turn doc, and exactly one review callback.
- The orchestrator is the only actor that advances Beads or launches the next phase.

## Stream Completion

When the Beads epic is complete:

1. Verify every phase has a Markdown turn doc.
2. Generate `docs/implementation/expo-webview-rebuild/storyboard-post-run-mm-dd-yyyy.html`.
3. Use `impeccable` when present. If missing, continue and note that it was skipped.
4. Install `@pierre/diffs` in the target repo if missing, then render every diff with `@pierre/diffs/ssr`.
5. Verify the storyboard.

## Start Prompt

Run the LyricsLab Expo WebView Rebuild Foundation dirtyloop with workflow `orchestrator-callback`.

Use Beads epic `lyricslab-jd5` as canonical. Read `docs/implementation/expo-webview-rebuild/IMPLEMENT.md`, `docs/implementation/expo-webview-rebuild/00-roadmap.md`, and `docs/implementation/expo-webview-rebuild/loop-state.md`. Select exactly one next ready Beads child issue, read its linked phase doc, then orchestrate only that phase on branch `feat/expo-webview-rebuild`.

Use the orchestrator-callback flow: selector chooses the phase; implementation thread builds and calls back exactly once when PR-ready or blocked; review thread uses `thermo-nuclear-code-quality-review`, owns CI evidence/repairs, and calls back exactly once when approved, repaired, or blocked. Subagents may inspect, compare, critique, and verify, but they do not advance loop state.

Keep one active PR. Worker and reviewer threads update the existing Markdown turn doc for the selected phase under `docs/implementation/expo-webview-rebuild/turn-docs/`. After callbacks, the orchestrator updates Beads first, then mirrors compact state into `docs/implementation/expo-webview-rebuild/loop-state.md`, then launches the next selector when continuing.

Hard scope boundaries: do not delete the Swift app; do not add rhyme highlighting; do not port iCloud, StoreKit/IAP, AI, audio, or theme parity; do not widen the bridge beyond the typed messages in the plan. File Beads follow-ups for adjacent discoveries.

When all phase issues are complete, generate `docs/implementation/expo-webview-rebuild/storyboard-post-run-mm-dd-yyyy.html`; use `impeccable` if present, and install/use `@pierre/diffs` with `@pierre/diffs/ssr` for every storyboard diff.
