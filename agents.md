# agents.md - LyricsLab (Codex)

## Purpose

This branch is the Expo rebuild surface for LyricsLab. Agents should work against the root Expo app and the `packages/editor-web` editor package, not the old Swift/Xcode implementation.

## Global Rules

- MVP-first. If a feature is post-MVP, do not implement it without explicit approval.
- Offline-first. External APIs and AI are post-MVP and IAP-locked.
- Performance is a feature. Debounce expensive work and avoid unnecessary re-renders on typing paths.
- The WebView bridge is a product boundary. Keep it narrow, typed, versioned, and tested.
- Store lyric body as `bodyJson` plus `bodyText`; do not store HTML as canonical state.
- Do not log user lyric content.
- Every non-trivial change updates relevant docs and adds tests where feasible.

## Agents / Roles

### 1. Product/Spec Agent

Owner: requirements, scope control, acceptance criteria.

Responsibilities:
- Maintain `PRODUCT.md`, `requirements.md`, `plan.md`, and milestone definitions.
- Resolve open questions and record decisions.
- Mark scope creep as post-MVP.

Outputs: updated specs, prioritized backlog, acceptance criteria.

### 2. Expo App Agent

Owner: Expo Router app shell, native screens, navigation, Home, Settings.

Responsibilities:
- Keep route files under `app/` thin.
- Put screen and domain logic under `src/`.
- Maintain Home list, search, song routes, and settings plumbing.

Outputs: routes, screens, view state, performance notes.

### 3. Persistence Agent

Owner: song model, repository boundary, SQLite/local-first behavior.

Responsibilities:
- Maintain `SongRepository` and `expo-sqlite` implementation.
- Keep title/body persistence reliable.
- Plan migrations before changing stored shapes.

Outputs: storage layer, migration notes, persistence tests.

### 4. Editor/WebView Agent

Owner: lyric body editing surface.

Responsibilities:
- Maintain `packages/editor-web` Tiptap editor.
- Maintain `src/editor/EditorWebView.tsx` and bridge helpers.
- Keep generated HTML rebuilds deterministic.
- Protect cursor, selection, keyboard, and insertion behavior.

Outputs: editor package, WebView integration, bridge tests, perf notes.

### 5. Rhyme Engine Agent

Owner: offline rhyme detection, grouping, ranking suggestions.

Responsibilities:
- Port or rebuild CMU-backed parsing in TypeScript.
- Keep rhyme grouping deterministic and low-noise.
- Feed native suggestions without blocking typing.

Outputs: rhyme module, tests, small fixtures, optional benchmark harness.

### 6. Design System Agent

Owner: theme tokens, highlight palette, icons, motion.

Responsibilities:
- Build readable theme tokens for React Native and editor-web.
- Keep highlight colors legible per theme.
- Avoid decorative effects that compete with typing.

Outputs: tokens, reusable components, accessibility notes.

### 7. Audio Agent

Owner: local playback and loop points.

Responsibilities:
- Design local beat playback as a post-foundation slice.
- Keep playback reliable while typing.

Outputs: audio module, mini-player UI, tests where feasible.

### 8. Monetization/IAP Agent

Owner: feature gating, paywall, later store integration.

Responsibilities:
- Provide gating APIs and paywall UI when scoped.
- Keep debug bypass development-only.
- Treat store integration as post-MVP unless explicitly approved.

Outputs: gating helpers, paywall view, restore flow later.

### 9. QA/Test Agent

Owner: test strategy, device validation, regression coverage.

Responsibilities:
- Maintain `testing.md`.
- Add focused unit tests around repository, bridge, suggestion, and editor behavior.
- Record physical-device evidence before migration claims.

Outputs: test suites, checklist evidence, CI suggestions.

## Communication Protocol

- Any agent can edit docs, but specs must stay consistent.
- File follow-ups instead of widening a selected phase.
- Conflicts are resolved by Product/Spec decisions recorded in `requirements.md`.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->
