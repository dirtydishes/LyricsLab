import type { EditorBodySnapshot } from './bridge';
import type { Song } from '../songs/types';

export type AsyncTaskQueue = {
  enqueue<T>(task: () => Promise<T>): Promise<T>;
};

export function createAsyncTaskQueue(): AsyncTaskQueue {
  let tail: Promise<unknown> = Promise.resolve();

  return {
    enqueue(task) {
      const nextTask = tail.catch(() => undefined).then(task);
      tail = nextTask;
      return nextTask;
    },
  };
}

export function mergeBodySaveResult(
  currentSong: Song,
  updatedSong: Song,
  savedBody: EditorBodySnapshot,
): Song {
  if (
    bodySnapshotsEqual(
      { bodyJson: currentSong.bodyJson, bodyText: currentSong.bodyText },
      savedBody,
    )
  ) {
    return {
      ...updatedSong,
      title: currentSong.title,
    };
  }

  return {
    ...updatedSong,
    bodyJson: currentSong.bodyJson,
    bodyText: currentSong.bodyText,
    title: currentSong.title,
  };
}

export function bodySnapshotsEqual(
  left: EditorBodySnapshot,
  right: EditorBodySnapshot,
) {
  if (left.bodyText !== right.bodyText) {
    return false;
  }

  const leftBodyJson = stringifyBodyJsonForComparison(left.bodyJson);
  const rightBodyJson = stringifyBodyJsonForComparison(right.bodyJson);

  return (
    leftBodyJson !== null &&
    rightBodyJson !== null &&
    leftBodyJson === rightBodyJson
  );
}

function stringifyBodyJsonForComparison(value: unknown) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return null;
  }
}
