# Phase 2: Song persistence and app shell

Canonical Beads issue: `lyricslab-jd5.2`

Epic: `lyricslab-jd5`

Status is tracked in Beads. This doc is implementation context.

## Outcome

Implement the basic native app flow: song model, local repository, Songs screen, search, create/delete/open, and editor route with title editing.

## Scope

Allowed:

- Add `Song`/`SongId` types with `title`, `bodyText`, `bodyJson`, `createdAt`, and `updatedAt`.
- Add a local song repository using Expo SQLite or a testable adapter/fake where Node tests cannot hit native SQLite.
- Add Songs screen with title/body search, create, open, and delete.
- Add editor route/screen with native title `TextInput` and placeholder body area.
- Persist title changes with a small debounce.
- Add tests for repository CRUD and title/body search.

Out of scope:

- Real lyric body WebView editing.
- Tiptap/editor-web package.
- Keyboard suggestion bar.
- Rhyme logic or highlighting.

## Inputs

- Phase 1 completed workspace.
- Data model in `docs/plans/2026-06-28-expo-webview-prototype-rebuild.md`.

## Implementation Notes

Keep repository interface small:

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

Store body fields now even though the body editor arrives later. If direct SQLite unit tests are brittle in Node, define an adapter seam and test repository behavior against an in-memory adapter.

## Beads

- Epic: `lyricslab-jd5`
- Issue: `lyricslab-jd5.2`
- Depends on: `lyricslab-jd5.1`
- Parallel-safe: no

## Expected Files Or Areas

- `apps/mobile/src/songs/types.ts`
- `apps/mobile/src/songs/songRepository.ts`
- `apps/mobile/src/songs/songRepository.test.ts`
- `apps/mobile/src/songs/SongListScreen.tsx`
- `apps/mobile/app/index.tsx`
- `apps/mobile/app/song/[id].tsx`
- `apps/mobile/src/editor/LyricsEditorScreen.tsx`

## Suggested Swarms

- Scout: 4-8 agents to compare persistence/test seams and Expo Router conventions.
- Reviewer: 8-12 agents focused on data flow simplicity, type safety, and search correctness.

## Quality Gates

- Repository tests pass.
- Typecheck passes.
- Manual smoke: create a song, edit title, return to Songs, search by title.

## Completion Criteria

- User can create/open/delete/search songs.
- Title edits persist and appear on the Songs screen.
- Repository tests cover create, update, list, delete, and title/body search.

## Follow-Up Policy

Do not widen this phase. File Beads follow-ups for adjacent discoveries.
