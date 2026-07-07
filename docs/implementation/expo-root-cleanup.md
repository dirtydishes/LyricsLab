# Expo Root Cleanup

Branch: `lavender/expo-clean-rebuild`

Date: 2026-07-07

## Purpose

Create a clean daily working surface for the Expo rebuild without making a brand-new repository.

## Changes

- Created a separate worktree at `/Users/kell/dev/lyricslab-expo`.
- Created branch `lavender/expo-clean-rebuild` from `lavender/expo-webview-rebuild-test`.
- Preserved the local Expo dev-client changes from the previous checkout.
- Promoted the Expo app from `apps/mobile/` to the repo root.
- Moved the editor web package from `apps/editor-web/` to `packages/editor-web/`.
- Removed Swift/Xcode app code, Swift tests, and old favicon-only web assets from this branch.
- Preserved CMU dictionary data at `data/cmudict.txt` for the future offline rhyme engine.
- Updated root docs for the Expo app.

## Path Mapping

- `apps/mobile/app/` -> `app/`
- `apps/mobile/src/` -> `src/`
- `apps/mobile/assets/` -> `assets/`
- `apps/editor-web/` -> `packages/editor-web/`
- `apps/mobile/package.json` -> `package.json`
- `apps/mobile/app.json` -> `app.json`

## Follow-Up Gate

Before treating this as the primary app lane, run and record the physical-device checklist in `testing.md`.
