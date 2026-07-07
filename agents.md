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
