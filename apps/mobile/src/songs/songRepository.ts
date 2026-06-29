import type {
  CreateSongInput,
  Song,
  SongId,
  UpdateSongPatch,
} from './types';

export type SongRepository = {
  listSongs(): Promise<Song[]>;
  createSong(input?: CreateSongInput): Promise<Song>;
  getSong(id: SongId): Promise<Song | null>;
  updateSong(id: SongId, patch: UpdateSongPatch): Promise<Song>;
  deleteSong(id: SongId): Promise<void>;
  searchSongs(query: string): Promise<Song[]>;
};

export type SongRecordStore = {
  initialize?(): Promise<void>;
  loadAll(): Promise<Song[]>;
  loadById(id: SongId): Promise<Song | null>;
  save(song: Song): Promise<void>;
  remove(id: SongId): Promise<void>;
};

type SongRepositoryDeps = {
  createId?: () => SongId;
  now?: () => string;
};

export class SongNotFoundError extends Error {
  constructor(id: SongId) {
    super(`Song not found: ${id}`);
    this.name = 'SongNotFoundError';
  }
}

export function createSongRepository(
  store: SongRecordStore,
  deps: SongRepositoryDeps = {},
): SongRepository {
  const createId = deps.createId ?? createDefaultSongId;
  const now = deps.now ?? (() => new Date().toISOString());
  let initializePromise: Promise<void> | null = null;

  async function ensureReady() {
    initializePromise ??= store.initialize?.() ?? Promise.resolve();
    await initializePromise;
  }

  async function listSongs() {
    await ensureReady();
    return sortSongs(await store.loadAll());
  }

  return {
    listSongs,

    async createSong(input = {}) {
      await ensureReady();

      const createdAt = now();
      const song: Song = {
        id: createId(),
        title: normalizeCreatedTitle(input.title),
        bodyText: input.bodyText ?? '',
        bodyJson: input.bodyJson ?? null,
        createdAt,
        updatedAt: createdAt,
      };

      await store.save(song);
      return cloneSong(song);
    },

    async getSong(id) {
      await ensureReady();
      const song = await store.loadById(id);
      return song ? cloneSong(song) : null;
    },

    async updateSong(id, patch) {
      await ensureReady();
      const existing = await store.loadById(id);

      if (!existing) {
        throw new SongNotFoundError(id);
      }

      const updated: Song = {
        ...existing,
        title: patch.title ?? existing.title,
        bodyText: patch.bodyText ?? existing.bodyText,
        bodyJson:
          Object.prototype.hasOwnProperty.call(patch, 'bodyJson')
            ? patch.bodyJson ?? null
            : existing.bodyJson,
        updatedAt: now(),
      };

      await store.save(updated);
      return cloneSong(updated);
    },

    async deleteSong(id) {
      await ensureReady();
      await store.remove(id);
    },

    async searchSongs(query) {
      const terms = normalizeSearchQuery(query);
      const songs = await listSongs();

      if (terms.length === 0) {
        return songs;
      }

      return songs.filter((song) => {
        const haystack = `${song.title}\n${song.bodyText}`.toLocaleLowerCase();
        return terms.every((term) => haystack.includes(term));
      });
    },
  };
}

export function createInMemorySongStore(seedSongs: Song[] = []): SongRecordStore {
  const songs = new Map(seedSongs.map((song) => [song.id, cloneSong(song)]));

  return {
    async loadAll() {
      return Array.from(songs.values()).map(cloneSong);
    },

    async loadById(id) {
      const song = songs.get(id);
      return song ? cloneSong(song) : null;
    },

    async save(song) {
      songs.set(song.id, cloneSong(song));
    },

    async remove(id) {
      songs.delete(id);
    },
  };
}

function normalizeCreatedTitle(title: string | undefined) {
  const normalized = title?.trim();
  return normalized && normalized.length > 0 ? normalized : 'Untitled Song';
}

function normalizeSearchQuery(query: string) {
  return query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function sortSongs(songs: Song[]) {
  return [...songs].sort((left, right) => {
    const updated = right.updatedAt.localeCompare(left.updatedAt);

    if (updated !== 0) {
      return updated;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

function cloneSong(song: Song): Song {
  return {
    ...song,
    bodyJson: cloneJson(song.bodyJson),
  };
}

function cloneJson(value: unknown | null) {
  if (value == null) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as unknown;
}

function createDefaultSongId() {
  const suffix = Math.random().toString(36).slice(2);
  return `song_${Date.now().toString(36)}_${suffix}`;
}
