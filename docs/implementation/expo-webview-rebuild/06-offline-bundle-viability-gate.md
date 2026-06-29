# Phase 6: Offline bundle and viability gate

Canonical Beads issue: `lyricslab-jd5.6`

Epic: `lyricslab-jd5`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Bundle the Tiptap editor for offline WebView loading and record the final viability decision for the Expo/WebView rebuild lane.

## Scope

Allowed:

- Add a build script that turns `apps/editor-web` output into a local WebView source for `apps/mobile`.
- Load the editor without depending on a dev server.
- Run available automated gates.
- Perform and document the manual device checklist.
- Update loop state with the rebuild recommendation.
- File follow-up Beads issues for post-gate work if the lane passes.

Out of scope:

- Implementing post-gate follow-ups.
- Rhyme highlighting.
- Rhyme suggestions beyond placeholder suggestions.
- Swift app removal or migration cleanup.

## Inputs

- Phase 5 working interactive editor slice.
- Original plan's Task 10 manual verification checklist.

## Implementation Notes

- Prefer a generated `apps/mobile/src/editor/generated/editorHtml.ts` or equivalent local asset path.
- Generated files should be deterministic enough to review; if a large generated artifact is unavoidable, document why.
- Manual gate should be explicit about environment: Expo Go vs dev build, simulator vs real iPhone, OS/device if known.

## Beads

- Epic: `lyricslab-jd5`
- Issue: `lyricslab-jd5.6`
- Depends on: `lyricslab-jd5.5`
- Parallel-safe: no

## Expected Files Or Areas

- `scripts/build-editor-html.mjs`
- `apps/mobile/src/editor/generated/editorHtml.ts` or equivalent asset integration
- `apps/mobile/src/editor/EditorWebView.tsx`
- `docs/implementation/expo-webview-rebuild/turn-docs/lyricslab-jd5.6.md`
- `docs/implementation/expo-webview-rebuild/loop-state.md`

## Suggested Swarms

- Scout: 8-12 agents for offline bundling approaches and Expo/WebView asset constraints.
- Reviewer: 8-20 agents for build artifacts, gate evidence, and final scope discipline.
- CI verification: 4-12 agents to own automated gate evidence.

## Quality Gates

- `npm --prefix apps/editor-web run build` passes.
- Mobile typecheck/tests pass where available.
- Offline/editor local-load smoke passes or blocker is recorded with evidence.
- Manual device checklist is recorded:
  - create song
  - edit title
  - type 20+ lyric lines
  - move cursor around inside body
  - tap suggestions repeatedly
  - background/reopen app
  - navigate away/back
  - search by body text
  - confirm keyboard bar position
  - confirm no obvious cursor jumping

## Completion Criteria

- WebView editor loads from a local/offline bundle.
- Final viability decision is documented: continue Expo rebuild, stop/reassess, or continue with specified follow-ups.
- Beads/loop-state/turn doc reflect the decision and evidence.
- Storyboard closeout is ready if all phases are complete.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
