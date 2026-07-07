# Offline Rhyme Suggestions MVP Implementation Loop

Workflow: `orchestrator-callback`

Canonical tracker: Beads epic `lyricslab-8um`

This stream is driven by Beads. These docs are execution context and resume aids. If Beads and these docs disagree, Beads wins.

## Goal

Build the Expo LyricsLab MVP path from placeholder word suggestions to deterministic offline CMU-backed rhyme suggestions while preserving the current editor/WebView boundary, local-first behavior, and fast typing path.

This loop is deliberately narrower than the whole future app. It owns scope/docs alignment, editor suggestion contract hardening, a pure TypeScript rhyme core, a full CMU artifact pipeline, native suggestion integration, slant-aware ranking, performance guards, and closeout evidence. WebView highlighting, phrase-rhyme visualization, audio, IAP, sync, AI collaborator flows, neural ranking, and user-teachable slant preferences are follow-up work unless explicitly approved.

## Sources Of Truth

- Beads epic: `lyricslab-8um`
- Beads loop metadata: workflow, run policy, branch/PR policy, quality gates, callback policy, actor-specific thread defaults, and swarm policy
- Roadmap: `docs/implementation/offline-rhyme-suggestions/00-roadmap.md`
- Loop state mirror: `docs/implementation/offline-rhyme-suggestions/loop-state.md`
- Research input: `docs/research/rhyme-engine-deep-research-report.md`
- Product docs: `requirements.md`, `plan.md`, `architecture.md`, `testing.md`
- Phase docs linked from Beads child issues
- Turn docs: `docs/implementation/offline-rhyme-suggestions/turn-docs/`

## Loop Rules

- Select exactly one next ready Beads child issue.
- Follow the workflow's selector gate before launching implementation.
- Read the linked phase doc before editing.
- Continue phase-by-phase by default until the epic is complete, blocked, interrupted, or review/CI is unresolved.
- Use `run once` / `--once` only when intentionally running one phase and stopping after closeout.
- Keep one active implementation PR at a time unless Beads and the phase doc explicitly allow parallel work.
- File Beads follow-ups instead of widening the selected phase.
- Update Beads first, then update `loop-state.md`.
- Use the workflow's required subagent swarms.
- Orchestrator-callback child actors default to `speed: standard`, `reasoning: xhigh`, and `inherit_orchestrator_thread_settings: false` unless Beads loop metadata explicitly overrides that actor. These must be actual launch settings, not just prompt text: Codex implementation/review threads launch with `thinking: "xhigh"`, and selector/closeout-selector subagents launch with `reasoning_effort: "xhigh"`.
- Orchestrator-callback callback targets are bound at run time. Generated artifacts may contain `RUNTIME_ORCHESTRATOR_THREAD_ID`; the orchestrator must replace it with the actual callback target for the thread running the loop before launching workers or reviewers.
- Orchestrator-callback implementation/review threads must be created in the intended Codex project worktree and assigned branch/ref. The orchestrator materializes the assigned branch/ref before launch, then starts the child from that branch/ref. A child that starts in the wrong repo/worktree, wrong branch/ref, or detached HEAD blocks and calls back instead of self-relocating.

## Review And CI

Reviewer agents must use:

`thermo-nuclear-code-quality-review`

Reviewer and CI verification agents own CI.

Allowed CI closeout states:

- `ci-green`
- `ci-repaired-and-green`
- `ci-unavailable-with-evidence`
- `ci-blocked-with-cause`

## Turn Docs

Each phase has exactly one Markdown turn doc:

`docs/implementation/offline-rhyme-suggestions/turn-docs/<phase-id>.md`

Implementation, review, CI, repairs, PR state, Beads updates, follow-ups, and closeout all go into the same doc.

## Storyboard

When the epic is complete, generate:

`docs/implementation/offline-rhyme-suggestions/storyboard-post-run-mm-dd-yyyy.html`

Use `impeccable` when present. If missing, continue without it and note that it was skipped.

Install `@pierre/diffs` in the target repo if missing. Every diff must use `@pierre/diffs/ssr`.

## Phase Ledger

| Beads Issue | Phase | Phase Doc | Depends On | Status |
|---|---|---|---|---|
| `lyricslab-8um.3` | 00: Tracker and loop bootstrap | `00-tracker-loop-bootstrap.md` | none | open |
| `lyricslab-8um.5` | 01: Product scope lock | `01-product-scope-lock.md` | `lyricslab-8um.3` | open |
| `lyricslab-xoc` | 02: Editor baseline and suggestion contract | `02-editor-baseline-suggestion-contract.md` | `lyricslab-8um.5` | open |
| `lyricslab-8um.1` | 03: Pure rhyme core with fixtures | `03-pure-rhyme-core-fixtures.md` | `lyricslab-xoc` | open |
| `lyricslab-8um.4` | 04: CMU artifact pipeline | `04-cmu-artifact-pipeline.md` | `lyricslab-8um.1` | open |
| `lyricslab-gg4` | 05: Native suggestion integration | `05-native-suggestion-integration.md` | `lyricslab-8um.4` | open |
| `lyricslab-8um.2` | 06: Slant ranking and performance guard | `06-slant-ranking-performance-guard.md` | `lyricslab-gg4` | open |
| `lyricslab-bhs` | 07: Device evidence and closeout | `07-device-evidence-closeout.md` | `lyricslab-8um.2` | open |

## Quality Gates

- `npm test`
- `npm run typecheck`
- `npm run editor:test`
- `npm run build:editor-html` when `packages/editor-web`, generated editor HTML, or WebView loading behavior changes
- `npx expo config --type public` when Expo config or dependencies change
- Phase-specific Beads/export checks for bootstrap and closeout phases

## Branch And PR Policy

One active implementation PR at a time. Use branch prefix `lavender/`. The loop was created from `lavender/expo-clean-rebuild`; implementation workers should target the active Expo rebuild base unless the phase doc or orchestrator explicitly overrides it.

