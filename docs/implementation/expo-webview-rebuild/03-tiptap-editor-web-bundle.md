# Phase 3: Tiptap editor web bundle

Canonical Beads issue: `lyricslab-jd5.3`

Epic: `lyricslab-jd5`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Create the standalone web editor package that will run inside the React Native WebView.

## Scope

Allowed:

- Create `apps/editor-web/` with Vite + TypeScript.
- Install minimal Tiptap dependencies: `@tiptap/core`, `@tiptap/starter-kit`, and placeholder extension if useful.
- Implement a plain lyric body editor.
- Emit typed bridge messages for `editorReady`, `contentChanged`, `selectionChanged`, `editorFocused`, `editorBlurred`, and `editorError`.
- Implement WebView-callable commands for `loadSong`, `insertSuggestion`, `focusEditor`, and optional `setTheme` placeholder.
- Add pure tests for suggestion context extraction if practical.

Out of scope:

- React Native WebView integration.
- Native persistence bridge.
- Offline bundling into mobile.
- Rhyme highlighting/decorations.

## Inputs

- Bridge contract from the original plan.
- Phase 2 song model fields.

## Implementation Notes

- Tiptap should be used minimally; avoid custom rich-text schema work unless needed for plain lyric paragraphs.
- `contentChanged` should include both ProseMirror/Tiptap JSON and plain text.
- `selectionChanged` context should include `wordBeforeCursor`, `currentLineText`, `previousToken`, and `selectionEmpty`.
- Suggestion insertion should add the word plus one trailing space.

## Beads

- Epic: `lyricslab-jd5`
- Issue: `lyricslab-jd5.3`
- Depends on: `lyricslab-jd5.2`
- Parallel-safe: no

## Expected Files Or Areas

- `apps/editor-web/package.json`
- `apps/editor-web/index.html`
- `apps/editor-web/vite.config.ts`
- `apps/editor-web/src/main.ts`
- `apps/editor-web/src/createLyricsEditor.ts`
- `apps/editor-web/src/bridge.ts`
- `apps/editor-web/src/suggestionContext.ts`
- `apps/editor-web/src/styles.css`

## Suggested Swarms

- Scout: 8-12 agents to inspect Tiptap initialization, content extraction, and WebView message patterns.
- Reviewer: 8-12 agents focused on bridge surface, editor lifecycle, and avoiding schema overreach.

## Quality Gates

- `npm --prefix apps/editor-web run build` passes.
- Tests for suggestion context pass if added.
- Browser/dev smoke verifies typing emits bridge messages.

## Completion Criteria

- The editor runs in a browser/dev mode.
- Typing emits `contentChanged` with JSON/text.
- Selection changes emit context.
- `loadSong` and `insertSuggestion` commands exist and are exercised.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
