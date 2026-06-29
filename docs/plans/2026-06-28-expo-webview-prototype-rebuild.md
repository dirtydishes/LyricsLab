# Expo WebView Prototype/Rebuild Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a basic Expo/React Native version of LyricsLab with songs, title editing, a WebView-based lyric body editor, and a keyboard-attached horizontal word suggestion bar.

**Architecture:** Keep the current Swift app intact as the reference implementation. Add a new Expo app alongside it and treat the first slice as a rebuild candidate, not a toy: if the WebView editor and keyboard bridge feel good on-device, continue the rebuild in this lane. The editor body lives in a web editor inside `react-native-webview`; React Native owns navigation, song persistence, title field, keyboard/suggestion bar, and app chrome.

**Tech Stack:** Expo + React Native + TypeScript, `react-native-webview`, Tiptap/ProseMirror for the WebView editor, Expo SQLite for local persistence, Vitest for pure TypeScript tests.

**Dirtyloop:** This plan has been normalized into a single-thread dirtyloop at `docs/implementation/expo-webview-rebuild/IMPLEMENT.md` with Beads epic `lyricslab-jd5`. Use `docs/implementation/expo-webview-rebuild/prompts/run-loop.md` to run it.

---

## Decision Summary

### Recommendation

Start the Expo rebuild now, but do it safely:

- Do **not** delete or rewrite the Swift app yet.
- Add the Expo app alongside the existing app under `apps/mobile`.
- Use the Swift app as the behavior reference for writing flow, suggestions, and future rhyme logic.
- Make the first Expo slice prove the hard part: WebView editor + keyboard-attached suggestions + insertion at cursor.

This is more than a throwaway prototype, but it still has a gate. If the editor bridge is bad on a real device, stop before porting the rest.

### Rhyme highlighting

Do **not** add rhyme highlighting in this first slice.

Reasons:

1. The first risk is editor viability, keyboard behavior, and suggestion insertion.
2. Rhyme highlighting will complicate the Tiptap schema/decorations before we know the WebView lane feels good.
3. Highlighting can be added later as ProseMirror decorations, which are not persisted into the song document.

The first slice should have word suggestions only. Rhyme suggestions can later plug into the same suggestion-provider interface.

---

## WebView + Tiptap/ProseMirror Explanation

### What the WebView buys us

A WebView lets LyricsLab use the browser's mature `contenteditable` behavior instead of fighting native iOS text internals directly.

In this design:

- **React Native / Expo owns:** screens, song list, title input, persistence, keyboard bar, theme shell.
- **WebView owns:** body text editing, caret/selection, undo/redo inside the lyric body, future inline editor decorations.
- **Bridge owns:** messages between the native app and the editor, such as content changed, selection changed, insert suggestion, and focus editor.

The seam is intentionally narrow. Native code should not know ProseMirror internals. Web editor code should not know SQLite/navigation internals.

### What ProseMirror is

ProseMirror is the lower-level editor toolkit. It gives us:

- document schema
- editor state
- transactions
- selections
- plugins
- history
- decorations
- input/composition handling

It is powerful, but verbose. It is the engine.

### What Tiptap is

Tiptap is a headless, friendlier API on top of ProseMirror. Its docs describe it as a headless rich-text editor framework built on ProseMirror, with commands, events, and extensions. Use Tiptap because Codex is much more likely to produce understandable code with it than with raw ProseMirror transactions everywhere.

Use Tiptap minimally:

- `@tiptap/core`
- `@tiptap/starter-kit`
- maybe `@tiptap/extension-placeholder`

Avoid complex marks/nodes at first. LyricsLab body can just be paragraphs/lines.

### Important package note

Use `npx expo install react-native-webview` inside the Expo app instead of raw `npm install react-native-webview`. Expo pins compatible native package versions; the Expo docs currently show `react-native-webview` as included in Expo Go with a bundled compatible version.

---

## Target User Experience for First Slice

1. App opens to a Songs screen.
2. User taps `New Song`.
3. User sees an editor screen:
   - native title input at top
   - WebView lyric body below
   - keyboard-attached suggestion bar when editing body
4. User types lyrics.
5. User taps a word suggestion.
6. The word inserts at the current cursor in the WebView body.
7. Cursor remains in the editor and keyboard stays open.
8. Song title/body persist locally.
9. Returning to Songs shows title + body preview.
10. Search matches title and body text.

---

## Data Model

Create a small model first. Keep it boring.

```ts
export type SongId = string;

export type Song = {
  id: SongId;
  title: string;
  bodyText: string;
  bodyJson: unknown | null;
  createdAt: string;
  updatedAt: string;
};
```

Store both:

- `bodyJson`: Tiptap/ProseMirror JSON, for restoring editor structure.
- `bodyText`: plain text, for search, previews, exports, and future rhyme analysis.

Do not store HTML as canonical state. HTML is allowed as a debug/export format later, but JSON + text is cleaner for editor restoration and app logic.

---

## Bridge Contract

Native → WebView messages:

```ts
type NativeToEditorMessage =
  | { type: 'loadSong'; bodyJson: unknown | null; bodyText: string }
  | { type: 'insertSuggestion'; word: string }
  | { type: 'focusEditor' }
  | { type: 'setTheme'; theme: EditorTheme };
```

WebView → Native messages:

```ts
type EditorToNativeMessage =
  | { type: 'editorReady' }
  | { type: 'contentChanged'; bodyJson: unknown; bodyText: string }
  | { type: 'selectionChanged'; context: EditorSuggestionContext }
  | { type: 'editorFocused' }
  | { type: 'editorBlurred' }
  | { type: 'editorError'; message: string; stack?: string };

export type EditorSuggestionContext = {
  wordBeforeCursor: string;
  currentLineText: string;
  previousToken: string | null;
  selectionEmpty: boolean;
};
```

Suggestion insertion should happen inside the WebView through a Tiptap command. Native should not try to splice text manually.

---

## Suggested File Layout

```txt
apps/
  mobile/
    app/
      _layout.tsx
      index.tsx
      song/
        [id].tsx
    src/
      editor/
        EditorWebView.tsx
        SuggestionBar.tsx
        LyricsEditorScreen.tsx
        bridge.ts
        suggestions.ts
        types.ts
      songs/
        SongListScreen.tsx
        songRepository.ts
        useSongs.ts
        types.ts
      design/
        theme.ts
      test/
        setup.ts
    package.json
    app.json
    tsconfig.json

  editor-web/
    src/
      main.ts
      createLyricsEditor.ts
      bridge.ts
      suggestionContext.ts
      styles.css
    index.html
    package.json
    vite.config.ts

scripts/
  build-editor-html.mjs
```

Why two apps?

- `apps/mobile` is the Expo app.
- `apps/editor-web` is the Tiptap editor bundle that runs inside the WebView.
- `scripts/build-editor-html.mjs` can bundle the editor web app into a TS string or asset the mobile app loads.

For the first spike, it is acceptable to load the editor from a local dev URL. Before calling the rebuild viable, prove a bundled/offline WebView build works too.

---

## Implementation Tasks

### Task 1: Create the Expo app shell

**Objective:** Add a new Expo TypeScript app without touching the Swift app.

**Files:**
- Create: `apps/mobile/`
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/index.tsx`

**Steps:**

1. From repo root, create the app:

   ```bash
   cd /home/delta/dirtydishes/lyricslab
   npx create-expo-app@latest apps/mobile --template blank-typescript
   ```

2. Install basic dependencies:

   ```bash
   cd apps/mobile
   npx expo install react-native-webview expo-sqlite expo-crypto
   npm install expo-router
   npm install -D vitest
   ```

3. Configure Expo Router if not already present.

4. Run:

   ```bash
   npm run start
   ```

**Acceptance:** Expo app launches to a simple Songs screen.

---

### Task 2: Add song types and SQLite repository

**Objective:** Persist songs locally with title, body text, and editor JSON.

**Files:**
- Create: `apps/mobile/src/songs/types.ts`
- Create: `apps/mobile/src/songs/songRepository.ts`
- Create: `apps/mobile/src/songs/songRepository.test.ts`

**Repository interface:**

```ts
export type SongRepository = {
  listSongs(): Promise<Song[]>;
  createSong(input?: { title?: string; bodyText?: string }): Promise<Song>;
  getSong(id: SongId): Promise<Song | null>;
  updateSong(id: SongId, patch: Partial<Pick<Song, 'title' | 'bodyText' | 'bodyJson'>>): Promise<Song>;
  deleteSong(id: SongId): Promise<void>;
  searchSongs(query: string): Promise<Song[]>;
};
```

**Acceptance:** Unit tests cover create, update, list, delete, and title/body search.

---

### Task 3: Build Songs screen

**Objective:** Create/open/delete/search songs.

**Files:**
- Create: `apps/mobile/src/songs/SongListScreen.tsx`
- Modify: `apps/mobile/app/index.tsx`

**UI:**

- Header: `LyricsLab`
- Search input
- `New Song` button
- List rows with title, updated date, and preview
- Delete action can be simple for now

**Acceptance:** User can create a song and open the editor route.

---

### Task 4: Create the editor screen with native title input

**Objective:** Add a screen for editing song title and hosting the future WebView body.

**Files:**
- Create: `apps/mobile/app/song/[id].tsx`
- Create: `apps/mobile/src/editor/LyricsEditorScreen.tsx`

**Behavior:**

- Load song by ID.
- Show title `TextInput` at top.
- Save title changes with a small debounce.
- Reserve body area for editor.

**Acceptance:** Title edits persist and appear on Songs screen.

---

### Task 5: Create Tiptap WebView editor app

**Objective:** Build a minimal Tiptap editor that can run inside a WebView.

**Files:**
- Create: `apps/editor-web/package.json`
- Create: `apps/editor-web/index.html`
- Create: `apps/editor-web/src/main.ts`
- Create: `apps/editor-web/src/createLyricsEditor.ts`
- Create: `apps/editor-web/src/bridge.ts`
- Create: `apps/editor-web/src/suggestionContext.ts`
- Create: `apps/editor-web/src/styles.css`

**Install:**

```bash
cd /home/delta/dirtydishes/lyricslab/apps/editor-web
npm install @tiptap/core @tiptap/starter-kit @tiptap/extension-placeholder vite typescript
```

**Editor behavior:**

- Create Tiptap editor with StarterKit.
- On update, post `contentChanged` with JSON and plain text.
- On selection update, post `selectionChanged` with `wordBeforeCursor`, `currentLineText`, and `previousToken`.
- Expose `window.LyricsLabEditor.insertSuggestion(word)`.
- Expose `window.LyricsLabEditor.loadSong({ bodyJson, bodyText })`.

**Acceptance:** Running the web editor in a desktop browser allows typing and logs bridge messages in dev mode.

---

### Task 6: Load Tiptap editor inside React Native WebView

**Objective:** Display the web editor in the Expo editor screen.

**Files:**
- Create: `apps/mobile/src/editor/EditorWebView.tsx`
- Create: `apps/mobile/src/editor/bridge.ts`
- Modify: `apps/mobile/src/editor/LyricsEditorScreen.tsx`

**Behavior:**

- WebView loads the editor app.
- Native receives `editorReady`, then sends current song body.
- Native receives `contentChanged` and persists body JSON/text with debounce.
- Native receives `selectionChanged` and stores suggestion context.

**Acceptance:** Body edits inside the WebView persist after navigating away and back.

---

### Task 7: Add native keyboard-attached suggestion bar

**Objective:** Show a horizontally scrolling bar above the keyboard while editing body text.

**Files:**
- Create: `apps/mobile/src/editor/SuggestionBar.tsx`
- Create: `apps/mobile/src/editor/suggestions.ts`
- Modify: `apps/mobile/src/editor/LyricsEditorScreen.tsx`

**Prototype behavior:**

- Use a simple pure TypeScript suggestion provider first.
- Suggestions can be static/contextual placeholders, not rhyme-powered yet.
- Bar appears when editor is focused.
- Bar sits above keyboard using `KeyboardAvoidingView` first.
- If `KeyboardAvoidingView` is too jumpy, evaluate `react-native-keyboard-controller` in a follow-up task.

**Suggestion provider interface:**

```ts
export type WordSuggestion = {
  id: string;
  word: string;
  label?: string;
};

export type SuggestionProvider = {
  getSuggestions(context: EditorSuggestionContext): Promise<WordSuggestion[]>;
};
```

**Acceptance:** Horizontal suggestions appear above the keyboard and can scroll.

---

### Task 8: Insert suggestions at the WebView cursor

**Objective:** Tapping a suggestion inserts it into the Tiptap editor at the current selection.

**Files:**
- Modify: `apps/mobile/src/editor/SuggestionBar.tsx`
- Modify: `apps/mobile/src/editor/EditorWebView.tsx`
- Modify: `apps/editor-web/src/createLyricsEditor.ts`

**Behavior:**

- Tap suggestion in native bar.
- Native sends `insertSuggestion` to WebView.
- WebView runs Tiptap command to insert the word plus one trailing space.
- Editor remains focused.
- Keyboard stays open.

**Acceptance:** Repeated suggestion taps insert at the visible cursor without losing focus.

---

### Task 9: Add bundled/offline WebView build path

**Objective:** Ensure the editor does not depend on a remote/dev server.

**Files:**
- Create: `scripts/build-editor-html.mjs`
- Create: `apps/mobile/src/editor/generated/editorHtml.ts` (generated)
- Modify: `apps/mobile/src/editor/EditorWebView.tsx`
- Modify: root/package scripts if a root package is added

**Behavior:**

- Build `apps/editor-web` with Vite.
- Inline JS/CSS into a single HTML string or local asset.
- Load that bundled editor in WebView.

**Acceptance:** Airplane-mode/offline launch still loads the editor.

---

### Task 10: Manual device verification

**Objective:** Decide whether the rebuild lane is viable.

**Run:**

```bash
cd /home/delta/dirtydishes/lyricslab/apps/mobile
npm run start
```

**Verify on a real device if possible:**

- Create song.
- Edit title.
- Type 20+ lyric lines.
- Move cursor around inside body.
- Tap suggestions repeatedly.
- Background/reopen app.
- Navigate away/back.
- Search by body text.
- Confirm keyboard bar position feels acceptable.
- Confirm no obvious cursor jumping.

**Acceptance:** If cursor/keyboard/suggestion behavior feels better than the Swift/UIKit wall, continue rebuild. If not, stop and reassess before porting rhyme/audio/theme work.

---

## Rebuild Continuation Plan After the Gate

Only after Task 10 passes:

1. Port theme tokens into `apps/mobile/src/design/theme.ts`.
2. Replace placeholder suggestions with a port of the existing rhyme suggestion pipeline.
3. Port CMU dictionary parsing to TypeScript or generate a compact JSON dictionary artifact.
4. Add rhyme suggestions first, still without highlighting.
5. Add rhyme highlighting later as ProseMirror decorations.
6. Add export/share.
7. Add audio/local beat workflow.
8. Decide what happens to the Swift app: archive, keep as native experiment, or remove after Expo reaches feature parity.

---

## What Not To Do Yet

- Do not port iCloud sync yet.
- Do not add StoreKit/IAP yet.
- Do not add rhyme highlighting yet.
- Do not over-design rich text formatting.
- Do not build a giant abstraction over persistence.
- Do not delete the Swift app.
- Do not make the editor bridge huge. Keep messages few and typed.

---

## Final Viability Gate

The Expo/WebView rebuild is a yes if all are true:

- Typing in the WebView feels stable.
- Cursor movement is reliable enough for real lyric writing.
- Suggestion insertion works at the cursor.
- Keyboard bar positioning is acceptable on iPhone.
- Persistence/search works with plain body text.
- Codex can make progress in the TypeScript code without getting stuck in native editor internals.

If yes, treat this as the new main implementation lane.
