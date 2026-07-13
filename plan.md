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

## Phase 2 - Editor Baseline And Suggestion Contract

Goal: make the writing surface feel trustworthy before adding more intelligence.

- Confirm cursor and selection behavior under fast typing.
- Confirm suggestion insertion at the cursor.
- Confirm body persistence through navigation, app backgrounding, and relaunch.
- Add missing bridge/editor tests where bugs appear.
- Add a generated HTML freshness guard.
- Define the typed native suggestion payload/provider contract without widening the WebView bridge for highlighting.

## Phase 3 - Pure Rhyme Core

Goal: create the deterministic offline TypeScript rhyme boundary without dragging in the old Swift shape.

- Add `src/rhyme/` as a pure TypeScript module independent of React Native, WebView, SQLite, and Tiptap.
- Implement fixture-sized CMU parsing, normalization, rhyme-tail keys, and exact candidate behavior.
- Add focused tests and small fixtures.
- Keep external APIs, lyric logging, raw full-dictionary runtime work, and hot-path SQL out of scope.

## Phase 4 - CMU Artifact Pipeline

Goal: prepare `data/cmudict.txt` for practical offline runtime use.

- Generate or import a deterministic CMU-backed runtime artifact.
- Build lookup/index data needed by `src/rhyme/`.
- Avoid raw dictionary parsing, full scans, and SQLite dictionary lookup on the typing path.
- Keep full artifact smoke/performance checks out of the default fast test command.

## Phase 5 - Native Suggestion Integration

Goal: replace placeholder suggestions through the existing native provider seam.

- Feed compact editor context into the offline rhyme provider.
- Preserve suggestion insertion at the cursor.
- Keep stable IDs, deterministic ordering, graceful fallbacks, and a small native suggestion list.
- Do not add WebView highlight messages, phrase insertion, external APIs, or UI behavior beyond the suggestion source.

## Phase 6 - Slant Ranking And Performance Guard

Goal: improve suggestion quality without making typing feel heavy.

- Add bounded deterministic slant/ranking improvements.
- Keep expensive analysis off the hot typing path.
- Record reviewer-visible performance evidence with non-default checks where needed.
- Do not add neural ranking, teachable slant preferences, or phrase-rhyme visualization.

## Phase 7 - Post-MVP Deferrals

Only after the native offline suggestion MVP is stable:

- WebView rhyme highlighting, phrase-rhyme visualization, and highlight palettes.
- Theme polish outside the native suggestion MVP.
- Local audio playback and loop points.
- IAP scaffolding.
- iCloud/sync investigation.
- AI collaborator concepts and neural ranking/reranking.
- Teachable slant preferences and learned writer-specific rhyme families.
- External rhyme APIs.

## Rule

Each phase should land as a small vertical slice with tests and docs. Do not port the old app wholesale.
