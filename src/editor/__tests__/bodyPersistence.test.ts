/// <reference types="jest" />

import {
  bodySnapshotsEqual,
  createAsyncTaskQueue,
  mergeBodySaveResult,
} from '../bodyPersistence';
import type { Song } from '../../songs/types';

describe('body persistence policy', () => {
  it('serializes queued body saves so an older slow save cannot win last', async () => {
    let releaseFirstSave!: () => void;
    const firstSaveCanFinish = new Promise<void>((resolve) => {
      releaseFirstSave = resolve;
    });
    const queue = createAsyncTaskQueue();
    const persistedBodies: string[] = [];

    const firstSave = queue.enqueue(async () => {
      await firstSaveCanFinish;
      persistedBodies.push('older body');
    });
    const secondSave = queue.enqueue(async () => {
      persistedBodies.push('newer body');
    });

    await Promise.resolve();

    expect(persistedBodies).toEqual([]);

    releaseFirstSave();
    await Promise.all([firstSave, secondSave]);

    expect(persistedBodies).toEqual(['older body', 'newer body']);
  });

  it('keeps newer in-memory body state when an older save result resolves', () => {
    const currentSong = createSong({
      bodyJson: { type: 'doc', content: [{ type: 'paragraph' }] },
      bodyText: 'newer body',
      title: 'draft title',
    });
    const updatedSong = createSong({
      bodyJson: { type: 'doc' },
      bodyText: 'older body',
      title: 'repository title',
      updatedAt: '2026-01-01T00:00:02.000Z',
    });

    expect(
      mergeBodySaveResult(currentSong, updatedSong, {
        bodyJson: { type: 'doc' },
        bodyText: 'older body',
      }),
    ).toMatchObject({
      bodyJson: { type: 'doc', content: [{ type: 'paragraph' }] },
      bodyText: 'newer body',
      title: 'draft title',
      updatedAt: '2026-01-01T00:00:02.000Z',
    });
  });

  it('accepts matching save results while preserving the local title draft', () => {
    const savedBody = {
      bodyJson: { type: 'doc' },
      bodyText: 'saved body',
    };
    const currentSong = createSong({
      ...savedBody,
      title: 'local title draft',
    });
    const updatedSong = createSong({
      ...savedBody,
      title: 'previous title',
      updatedAt: '2026-01-01T00:00:03.000Z',
    });

    expect(mergeBodySaveResult(currentSong, updatedSong, savedBody)).toEqual({
      ...updatedSong,
      title: 'local title draft',
    });
  });

  it('compares body snapshots by text and serializable JSON content', () => {
    expect(
      bodySnapshotsEqual(
        { bodyJson: { type: 'doc' }, bodyText: 'same' },
        { bodyJson: { type: 'doc' }, bodyText: 'same' },
      ),
    ).toBe(true);
    expect(
      bodySnapshotsEqual(
        { bodyJson: { type: 'doc' }, bodyText: 'same' },
        { bodyJson: { type: 'doc' }, bodyText: 'different' },
      ),
    ).toBe(false);
  });
});

function createSong(overrides: Partial<Song>): Song {
  return {
    bodyJson: null,
    bodyText: '',
    createdAt: '2026-01-01T00:00:01.000Z',
    id: 'song-1',
    title: 'Song',
    updatedAt: '2026-01-01T00:00:01.000Z',
    ...overrides,
  };
}
