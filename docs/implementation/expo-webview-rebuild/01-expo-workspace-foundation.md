# Phase 1: Expo workspace foundation

Canonical Beads issue: `lyricslab-jd5.1`

Epic: `lyricslab-jd5`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Create an Expo/React Native TypeScript app beside the existing Swift app, with dependency installation and basic scripts in place.

## Scope

Allowed:

- Create `apps/mobile/` from a TypeScript Expo template.
- Install Expo-compatible dependencies with `npx expo install` where appropriate: `react-native-webview`, `expo-sqlite`, `expo-crypto`.
- Install routing/test/type tooling needed by later phases, keeping package choices boring.
- Configure a placeholder Songs screen.
- Add package scripts for start, typecheck, and tests as feasible.
- Keep the Swift app and Xcode files unchanged except for docs/Beads additions.

Out of scope:

- Song persistence beyond placeholders.
- Tiptap/editor-web package.
- WebView bridge.
- Keyboard suggestion bar.
- Rhyme highlighting, iCloud, IAP, audio, AI, or theme parity.

## Inputs

- Plan: `docs/plans/2026-06-28-expo-webview-prototype-rebuild.md`
- Repo rules: `agents.md`
- Roadmap: `docs/implementation/expo-webview-rebuild/00-roadmap.md`

## Implementation Notes

- Start from branch `feat/expo-webview-rebuild`.
- Prefer Expo-managed package installation for native packages.
- If Expo Router setup differs from the latest template, keep the route structure simple and document the deviation in the turn doc.
- The app only needs a placeholder Songs screen in this phase.

## Beads

- Epic: `lyricslab-jd5`
- Issue: `lyricslab-jd5.1`
- Depends on: none
- Parallel-safe: no

## Expected Files Or Areas

- `apps/mobile/`
- `apps/mobile/package.json`
- `apps/mobile/app/`
- `apps/mobile/src/` if needed for placeholder organization

## Suggested Swarms

- Selector/scout: 2-4 agents to inspect Expo template/package conventions and repo layout.
- Reviewer: 4-8 agents focused on avoiding unnecessary native eject/config complexity.

## Quality Gates

- `npm --prefix apps/mobile run typecheck` if the script exists.
- `npm --prefix apps/mobile test` if tests exist.
- `npm --prefix apps/mobile run start` should start without config errors; if it cannot be fully exercised in the environment, record exact blocker/evidence.

## Completion Criteria

- `apps/mobile` exists and installs.
- App launches to a placeholder Songs screen or reaches the closest verifiable start state with evidence.
- Scripts are documented in the phase turn doc.
- Existing Swift app is not deleted or restructured.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
