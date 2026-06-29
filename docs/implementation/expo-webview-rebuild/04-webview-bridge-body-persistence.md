# Phase 4: WebView bridge and body persistence

Canonical Beads issue: `lyricslab-jd5.4`

Epic: `lyricslab-jd5`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Load the Tiptap editor inside React Native WebView and persist lyric body updates into the native song repository.

## Scope

Allowed:

- Add `EditorWebView.tsx` wrapper.
- Add typed native-side bridge parsing/sending helpers.
- Send current song body to WebView after `editorReady`.
- Persist debounced `contentChanged` events as `bodyJson` and `bodyText`.
- Store latest `selectionChanged` context for later suggestions.
- Update Songs previews/search from `bodyText`.

Out of scope:

- Keyboard suggestion UI.
- Suggestion insertion interaction.
- Offline bundled WebView build.
- Rhyme highlighting/decorations.

## Inputs

- Phase 2 song repository and editor screen.
- Phase 3 editor-web bridge contract.

## Implementation Notes

- Native code should not splice editor text manually.
- WebView code should not know about SQLite/navigation.
- Keep message parsing defensive and typed; invalid messages should be logged/ignored rather than crashing the app.
- Save body updates with a debounce to avoid writing on every keystroke.

## Beads

- Epic: `lyricslab-jd5`
- Issue: `lyricslab-jd5.4`
- Depends on: `lyricslab-jd5.3`
- Parallel-safe: no

## Expected Files Or Areas

- `apps/mobile/src/editor/EditorWebView.tsx`
- `apps/mobile/src/editor/bridge.ts`
- `apps/mobile/src/editor/LyricsEditorScreen.tsx`
- `apps/mobile/src/songs/songRepository.ts`
- `apps/mobile/src/songs/SongListScreen.tsx`

## Suggested Swarms

- Scout: 8-12 agents for WebView load/message lifecycle and Expo compatibility.
- Reviewer: 8-16 agents focused on typed seam, debounce, and state flow locality.

## Quality Gates

- Typecheck passes.
- Bridge parsing tests pass if added.
- Manual smoke: body edits persist after navigating away/back.
- Search finds text typed in the body.

## Completion Criteria

- WebView editor renders in the editor screen.
- Body edits persist as JSON/text.
- Body text appears in previews/search.
- Latest selection context is available to native state.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
