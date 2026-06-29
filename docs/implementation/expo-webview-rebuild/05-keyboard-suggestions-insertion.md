# Phase 5: Keyboard suggestion bar and insertion

Canonical Beads issue: `lyricslab-jd5.5`

Epic: `lyricslab-jd5`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Add the native keyboard-attached horizontal suggestion bar and prove suggestion insertion at the WebView cursor.

## Scope

Allowed:

- Add `SuggestionBar.tsx`.
- Add a simple pure TypeScript suggestion provider.
- Show the bar while the body editor is focused.
- Position the bar above the keyboard with the simplest viable Expo/RN approach first.
- Send `insertSuggestion` messages to the WebView.
- Ensure WebView inserts the word plus one trailing space at the current selection and remains focused.

Out of scope:

- Rhyme-powered suggestions.
- Rhyme highlighting.
- Complex keyboard-controller dependency unless `KeyboardAvoidingView` is clearly insufficient and the reason is documented.
- Full custom editor toolbar.

## Inputs

- Phase 4 WebView bridge and selection context.
- Suggestion provider interface from the original plan.

## Implementation Notes

- Start with placeholder/contextual suggestions, not rhyme suggestions.
- Tapping a suggestion must call into the WebView command; native should not edit body text directly.
- Repeated taps should not blur the editor or hide the keyboard.
- If keyboard positioning is degraded in Expo Go, document whether a dev build or `react-native-keyboard-controller` follow-up is needed.

## Beads

- Epic: `lyricslab-jd5`
- Issue: `lyricslab-jd5.5`
- Depends on: `lyricslab-jd5.4`
- Parallel-safe: no

## Expected Files Or Areas

- `apps/mobile/src/editor/SuggestionBar.tsx`
- `apps/mobile/src/editor/suggestions.ts`
- `apps/mobile/src/editor/LyricsEditorScreen.tsx`
- `apps/mobile/src/editor/EditorWebView.tsx`
- `apps/editor-web/src/createLyricsEditor.ts`

## Suggested Swarms

- Scout: 8-12 agents for keyboard behavior and focus/insertion edge cases.
- Reviewer: 8-16 agents focused on interaction reliability and avoiding native text duplication.

## Quality Gates

- Suggestion provider tests pass.
- Typecheck passes.
- Manual smoke: focus body editor, keyboard appears, bar appears, suggestions scroll, repeated taps insert at cursor.

## Completion Criteria

- Suggestion bar appears while the body editor is focused.
- Suggestions scroll horizontally.
- Tapping repeatedly inserts word + one trailing space at the visible cursor.
- Editor focus and keyboard stay stable enough to proceed to final gate.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
