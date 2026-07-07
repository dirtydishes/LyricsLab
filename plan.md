# plan.md - Expo Root Rebuild

## Direction

Use the existing LyricsLab repo, but make this branch a clean Expo-first working surface. The Swift/Xcode app is historical context in Git history, not active code in this branch.

## Phase 0 - Repo Reset

Status: in progress on `lavender/expo-clean-rebuild`.

- Move Expo app files from `apps/mobile/` to the repo root.
- Move the Tiptap editor package from `apps/editor-web/` to `packages/editor-web/`.
- Remove Swift/Xcode source, tests, and old favicon-only web assets from this branch.
- Keep Beads and implementation docs for historical traceability.
- Rewrite root docs for the Expo app.
- Preserve current Expo dev-client config.
- Preserve CMU dictionary data at `data/cmudict.txt`.

## Phase 1 - Device Proof

Goal: prove this root Expo app runs as the daily writing surface on a real device.

- Run dependency install from a fresh checkout.
- Build generated editor HTML.
- Run automated gates.
- Run `npm run ios` against a physical device.
- Record the manual checklist from `testing.md`.
- File follow-ups for any runtime friction instead of widening the cleanup branch.

## Phase 2 - Editor Hardening

Goal: make the writing surface feel trustworthy before adding more intelligence.

- Confirm cursor and selection behavior under fast typing.
- Confirm suggestion insertion at the cursor.
- Confirm body persistence through navigation, app backgrounding, and relaunch.
- Add missing bridge/editor tests where bugs appear.
- Add a generated HTML freshness guard.

## Phase 3 - Offline Rhyme Core

Goal: bring back the craft value without dragging in the old Swift shape.

- Add a TypeScript CMU dictionary parser or import a prepared dictionary artifact.
- Implement deterministic rhyme keys and ranking.
- Replace placeholder suggestions with offline rhyme-backed suggestions.
- Add focused tests and small fixtures.

## Phase 4 - Product Polish Slices

Only after device proof and rhyme core are stable:

- Theme tokens and readable highlight palettes.
- Audio MVP.
- IAP scaffolding.
- iCloud/sync investigation.
- AI collaborator concepts, explicitly post-MVP.

## Rule

Each phase should land as a small vertical slice with tests and docs. Do not port the old app wholesale.
