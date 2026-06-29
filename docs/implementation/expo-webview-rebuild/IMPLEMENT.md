# LyricsLab Expo WebView Rebuild Foundation Implementation Loop

Workflow: `orchestrator-callback`

Canonical tracker: Beads epic `lyricslab-jd5`

This stream is driven by Beads. These docs are execution context and resume aids. If Beads and these docs disagree, Beads wins.

## Goal

Build the Expo/React Native + WebView/Tiptap LyricsLab foundation beside the existing Swift app, ending at a real editor viability gate: songs, native title editing, WebView lyric body editing, local persistence, keyboard-attached word suggestions, suggestion insertion at cursor, offline editor bundle, and manual device validation.

## Sources Of Truth

- Beads epic: `lyricslab-jd5`
- Roadmap: `docs/implementation/expo-webview-rebuild/00-roadmap.md`
- Original plan: `docs/plans/2026-06-28-expo-webview-prototype-rebuild.md`
- Loop state mirror: `docs/implementation/expo-webview-rebuild/loop-state.md`
- Phase docs linked from Beads child issues
- Turn docs: `docs/implementation/expo-webview-rebuild/turn-docs/`

## Loop Rules

- Select exactly one next ready Beads child issue.
- Read the linked phase doc before editing.
- Keep one active implementation PR at a time unless Beads and the phase doc explicitly allow parallel work.
- File Beads follow-ups instead of widening the selected phase.
- Update Beads first, then update `loop-state.md`.
- Use the orchestrator-callback topology: selector chooses, implementation thread builds one phase and calls back, review thread owns thermo-nuclear review + CI and calls back.
- The orchestrator owns Beads, loop-state, phase closeout, and launching the next selector; worker/reviewer threads update the existing turn doc but do not advance the stream.

## Product Decisions For This Stream

- Expo/React Native is the app shell lane under test.
- The Swift app remains intact as a reference implementation during this stream.
- The lyric body editor is a local WebView running Tiptap/ProseMirror.
- Native owns songs, title input, navigation, local persistence, and keyboard suggestion bar.
- WebView owns body text editing, cursor/selection, editor state, and future decorations.
- Store `bodyJson` plus `bodyText`; do not make HTML canonical.
- No rhyme highlighting in this stream. Rhyme suggestions/highlighting are post-gate follow-ups.

## Topology

This loop uses `orchestrator-callback`:

```text
orchestrator thread
  -> selector subagent chooses next ready Beads phase
  -> orchestrator creates implementation thread
  -> implementation thread may use subagents
  -> implementation thread opens/updates the phase PR and calls back
  -> orchestrator creates review thread
  -> review thread owns thermo-nuclear review, CI, repairs, and evidence
  -> review thread calls back after review + CI are resolved
  -> orchestrator updates Beads first, mirrors `loop-state.md`, then launches the next selector when continuing
```

- Only the orchestrator creates implementation and review threads.
- Implementation threads own exactly one selected Beads issue, local gates before PR when feasible, and the existing phase turn doc.
- Review threads own `thermo-nuclear-code-quality-review`, CI inspection/repair/rerun/evidence, and the existing phase turn doc.
- Selector subagents never implement. Reviewer subagents never close Beads issues. The orchestrator is the only actor that advances to the next phase.

## Review And CI

Reviewer agents must use:

`thermo-nuclear-code-quality-review`

Reviewer and CI verification agents own CI. Unknown CI is not approval.

Allowed CI closeout states:

- `ci-green`
- `ci-repaired-and-green`
- `ci-unavailable-with-evidence`
- `ci-blocked-with-cause`

## Turn Docs

Each phase has exactly one Markdown turn doc:

`docs/implementation/expo-webview-rebuild/turn-docs/<beads-issue-id>.md`

Implementation, review, CI, repairs, PR state, Beads updates, follow-ups, and closeout all go into the same doc.

## Storyboard

When the epic is complete, generate:

`docs/implementation/expo-webview-rebuild/storyboard-post-run-mm-dd-yyyy.html`

Use `impeccable` when present. If missing, continue without it and note that it was skipped.

Install `@pierre/diffs` in the target repo if missing. Every diff must use `@pierre/diffs/ssr`.

## Phase Ledger

| Beads Issue | Phase | Phase Doc | Depends On | Status |
|---|---|---|---|---|
| `lyricslab-jd5.1` | Expo workspace foundation | `docs/implementation/expo-webview-rebuild/01-expo-workspace-foundation.md` | none | pending |
| `lyricslab-jd5.2` | Song persistence and app shell | `docs/implementation/expo-webview-rebuild/02-song-persistence-app-shell.md` | `lyricslab-jd5.1` | pending |
| `lyricslab-jd5.3` | Tiptap editor web bundle | `docs/implementation/expo-webview-rebuild/03-tiptap-editor-web-bundle.md` | `lyricslab-jd5.2` | pending |
| `lyricslab-jd5.4` | WebView bridge and body persistence | `docs/implementation/expo-webview-rebuild/04-webview-bridge-body-persistence.md` | `lyricslab-jd5.3` | pending |
| `lyricslab-jd5.5` | Keyboard suggestion bar and insertion | `docs/implementation/expo-webview-rebuild/05-keyboard-suggestions-insertion.md` | `lyricslab-jd5.4` | pending |
| `lyricslab-jd5.6` | Offline bundle and viability gate | `docs/implementation/expo-webview-rebuild/06-offline-bundle-viability-gate.md` | `lyricslab-jd5.5` | pending |

## Quality Gates

- Keep the existing Swift app intact unless a phase explicitly says otherwise.
- Keep the WebView/native bridge narrow and typed.
- Do not add rhyme highlighting in this stream.
- Do not add iCloud, StoreKit/IAP, AI, audio, or theme-port scope in this stream.
- Prefer pure TypeScript tests for repository, bridge parsing, and suggestion-provider logic.
- Run available automated gates before phase closeout:
  - `npm --prefix apps/mobile test` when tests exist.
  - `npm --prefix apps/mobile run typecheck` when the script exists.
  - `npm --prefix apps/editor-web run build` once `apps/editor-web` exists.
  - `npm --prefix apps/editor-web test` if tests are added.
- For the final gate, record manual device evidence for cursor behavior, keyboard bar position, insertion-at-cursor, persistence, and search.
- Reviewer subagents must use `thermo-nuclear-code-quality-review`; CI verification agents own CI evidence.

## Branch And PR Policy

- Work on branch `feat/expo-webview-rebuild`.
- Keep one active implementation PR for this dirtyloop unless Beads is explicitly updated to allow otherwise.
- Commit after each phase with a conventional commit message.
- Open/maintain the PR as a draft until the Phase 6 viability gate is recorded.
- Do not merge until the final gate says whether Expo/WebView becomes the new main lane.
