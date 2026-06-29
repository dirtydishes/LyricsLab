/// <reference types="jest" />

import {
  SongNotFoundError,
  createInMemorySongStore,
  createSongRepository,
} from '../songRepository';

function createRepository() {
  let id = 0;
  let now = 0;

  return createSongRepository(createInMemorySongStore(), {
    createId: () => `song-${++id}`,
    now: () => new Date(Date.UTC(2026, 0, 1, 0, 0, ++now)).toISOString(),
  });
}

describe('songRepository', () => {
  it('creates, lists, gets, and updates songs', async () => {
    const repository = createRepository();

    const first = await repository.createSong({
      bodyJson: { type: 'doc' },
      bodyText: 'first body',
      title: 'First song',
    });
    const second = await repository.createSong({ title: 'Second song' });

    expect(first).toMatchObject({
      bodyJson: { type: 'doc' },
      bodyText: 'first body',
      id: 'song-1',
      title: 'First song',
    });
    expect(second.title).toBe('Second song');

    await expect(repository.getSong(first.id)).resolves.toMatchObject({
      id: first.id,
      title: 'First song',
    });

    const updated = await repository.updateSong(first.id, {
      bodyJson: { type: 'doc', content: [] },
      bodyText: 'updated body',
      title: 'First revision',
    });

    expect(updated).toMatchObject({
      bodyJson: { type: 'doc', content: [] },
      bodyText: 'updated body',
      title: 'First revision',
    });
    expect(updated.updatedAt).not.toBe(first.updatedAt);

    await expect(repository.listSongs()).resolves.toEqual([
      updated,
      second,
    ]);
  });

  it('deletes songs without failing for missing ids', async () => {
    const repository = createRepository();
    const song = await repository.createSong({ title: 'Keep moving' });

    await repository.deleteSong(song.id);
    await repository.deleteSong(song.id);

    await expect(repository.getSong(song.id)).resolves.toBeNull();
    await expect(repository.listSongs()).resolves.toEqual([]);
  });

  it('searches song titles and lyric body text case-insensitively', async () => {
    const repository = createRepository();

    await repository.createSong({
      bodyText: 'loose bars over drums',
      title: 'Basement Draft',
    });
    await repository.createSong({
      bodyText: 'bright hook and bridge',
      title: 'Rooftop Chorus',
    });
    await repository.createSong({
      bodyText: 'quiet notebook verse',
      title: 'Late Night',
    });

    await expect(repository.searchSongs('chorus')).resolves.toMatchObject([
      { title: 'Rooftop Chorus' },
    ]);
    await expect(repository.searchSongs('BARS')).resolves.toMatchObject([
      { title: 'Basement Draft' },
    ]);
    await expect(repository.searchSongs('quiet verse')).resolves.toMatchObject([
      { title: 'Late Night' },
    ]);
    await expect(repository.searchSongs('')).resolves.toHaveLength(3);
  });

  it('normalizes blank created titles and rejects updates for unknown songs', async () => {
    const repository = createRepository();
    const song = await repository.createSong({ title: '   ' });

    expect(song.title).toBe('Untitled Song');
    await expect(
      repository.updateSong('missing-song', { title: 'Nope' }),
    ).rejects.toBeInstanceOf(SongNotFoundError);
  });
});
