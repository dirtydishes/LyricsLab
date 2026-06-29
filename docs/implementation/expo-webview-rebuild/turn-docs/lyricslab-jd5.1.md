# Phase 1 Turn Doc: Expo workspace foundation

Beads issue: `lyricslab-jd5.1`

Phase doc: `docs/implementation/expo-webview-rebuild/01-expo-workspace-foundation.md`

This is the single Markdown turn doc for the phase.

## Phase Selection

Selected by orchestrator for implementation.

- Beads issue: `lyricslab-jd5.1`
- Working branch: `lavender/lyricslab-jd5-1-expo-workspace-foundation`
- Base branch: `origin/feat/expo-webview-rebuild`
- Scope source: `docs/implementation/expo-webview-rebuild/01-expo-workspace-foundation.md`

## Scope

Implemented the Phase 1 Expo workspace foundation only:

- Created `apps/mobile/` from Expo's TypeScript blank app shape.
- Installed Expo SDK 56-compatible native dependencies with `npx expo install`: `react-native-webview`, `expo-sqlite`, `expo-crypto`.
- Added `start`, iOS/Android platform start scripts, `typecheck`, and `test` scripts.
- Configured a placeholder Songs screen.
- Left Swift app and Xcode project files untouched.

Out of scope and not implemented: persistence, Tiptap/editor-web, WebView bridge, keyboard suggestion bar, rhyme highlighting, iCloud, StoreKit/IAP, AI, audio, or theme parity.

## Implementation Log

- Switched the worker checkout onto the requested stream branch, then renamed the implementation branch at user request from `feat/expo-webview-rebuild` to `lavender/lyricslab-jd5-1-expo-workspace-foundation`.
- Ran `npx create-expo-app@latest apps/mobile --template blank-typescript --yes`; template installed Expo SDK 56 app dependencies and reported npm audit output from the generated dependency tree.
- Read the generated Expo local instruction and checked Expo SDK 56 docs before editing the app scaffold.
- Removed template-specific AI helper files generated inside `apps/mobile/` so the committed workspace stays repo-focused.
- Added `SongsScreen` plus a small placeholder data module and Jest test.
- Updated app/package metadata to `LyricsLab` / `lyricslab-mobile`.
- Ran `npx expo install react-native-webview expo-sqlite expo-crypto`; Expo added the `expo-sqlite` config plugin.
- Added Jest/TypeScript test tooling and fixed test type visibility after the first typecheck caught missing Jest globals.
- Kept generated native `ios/` and `android/` folders ignored; no native prebuild was run.
- Review repair removed the generated `web` script because Phase 1 does not install Expo web dependencies and this mobile foundation should not advertise unsupported web execution.

## Subagent Swarms

Not used. The phase was a narrow single-workspace scaffold with local gates.

## Review

Reviewer skill:

`thermo-nuclear-code-quality-review`

Review result: repaired, then approved.

- Scope check passed: PR changes are limited to `apps/mobile/` and this turn doc; no Swift or Xcode files changed.
- Out-of-scope audit passed: no persistence, editor-web package, WebView bridge, keyboard suggestion bar, rhyme highlighting, iCloud, StoreKit/IAP, AI, audio, or theme parity was added.
- Maintainability audit passed after repair: the scaffold stays small and direct, no file crosses the 1k-line threshold, no cast-heavy boundary or wrapper layer was introduced, and there is no Phase 2+ logic embedded in the placeholder screen.
- Repair made: removed the unsupported generated `web` script from `apps/mobile/package.json`. Before repair, `CI=1 EXPO_NO_TELEMETRY=1 timeout 20s npm --prefix apps/mobile run web -- --port 8092` failed because `react-dom` and `react-native-web` are not installed. Adding those packages would widen this mobile-only phase; deleting the script keeps the foundation honest.

## CI And Gates

CI owner: reviewer/verification agents

Current CI state: `ci-unavailable-with-evidence`; local review gates passed after repair.

Evidence:

- GitHub PR check inspection: `gh pr view 10 --repo dirtydishes/lyricslab --json statusCheckRollup,headRefOid,mergeStateStatus` returned head `9a19cd76c7944cc9416f0315c31164e85e50739c`, merge state `CLEAN`, and `statusCheckRollup: []`.
- GitHub commit status inspection: `gh api repos/dirtydishes/lyricslab/commits/9a19cd76c7944cc9416f0315c31164e85e50739c/status` returned `total_count: 0` and `statuses: []`.
- Initial review worktree gate attempt showed dependencies were absent (`tsc: not found`, `jest: not found`, Expo plugin resolution missing for `expo-sqlite`), so the reviewer ran `npm --prefix apps/mobile ci`.
- `npm --prefix apps/mobile ci` - passed; installed 849 packages from the committed lockfile.
- `npm --prefix apps/mobile run typecheck` - passed with `tsc --noEmit`.
- `npm --prefix apps/mobile test` - passed; Jest reported `Test Suites: 1 passed, 1 total` and `Tests: 1 passed, 1 total`.
- `cd apps/mobile && npx expo config --type public` - passed; resolved `name: 'LyricsLab'`, `slug: 'lyricslab-mobile'`, `sdkVersion: '56.0.0'`, platforms `ios`/`android`, and plugin `expo-sqlite`.
- `CI=1 EXPO_NO_TELEMETRY=1 timeout 25s npm --prefix apps/mobile run start -- --port 8091` - reached `Starting Metro Bundler` and `Waiting on http://localhost:8091`; command exited `124` because of the intentional timeout. Follow-up `ss -tulpen | rg ':8091'` returned no listener.
- Install commands reported `10 moderate severity vulnerabilities` from the npm dependency graph. No audit remediation was attempted in this phase because dependencies were selected through the Expo SDK-compatible install path.

## PR And Commits

- Draft PR: https://github.com/dirtydishes/lyricslab/pull/10
- Commits:
  - `2fd81ef` - `feat: add expo mobile workspace foundation`
  - `9a19cd7` - `docs: record phase 1 pr state`
  - review repair - `fix mobile scripts and record phase 1 review`

## Beads Updates

No Beads advancement by this implementation thread. Orchestrator owns Beads state transitions.

## Follow-Ups Filed

None yet.

## Context To Keep

- The Phase 1 implementation branch is `lavender/lyricslab-jd5-1-expo-workspace-foundation`, based on `origin/feat/expo-webview-rebuild`.
- `apps/mobile` uses Expo SDK 56 / React Native 0.85 / React 19.2.3 from the generated blank TypeScript template.
- `expo-sqlite` is present as an Expo config plugin in `apps/mobile/app.json`.
- The Songs screen is intentionally placeholder-only; Phase 2 owns real song persistence and shell behavior.
- Expo start was verified only to Metro readiness in this server environment, then intentionally timed out.
- Hosted GitHub CI/checks were unavailable for PR #10 at review time; local gates are the review evidence.

## Closeout

Review repaired the unsupported web script, reran local gates successfully, and found no remaining Phase 1 findings. Awaiting orchestrator closeout.
