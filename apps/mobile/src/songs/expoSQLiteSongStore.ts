import * as SQLite from 'expo-sqlite';

import type { Song, SongId } from './types';
import type { SongRecordStore } from './songRepository';

type SongRow = {
  body_json: string | null;
  body_text: string;
  created_at: string;
  id: string;
  title: string;
  updated_at: string;
};

type ExpoSQLiteSongStoreOptions = {
  databaseName?: string;
};

export function createExpoSQLiteSongStore(
  options: ExpoSQLiteSongStoreOptions = {},
): SongRecordStore {
  const databaseName = options.databaseName ?? 'lyricslab.db';
  let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
  let initializePromise: Promise<void> | null = null;

  async function getDatabase() {
    databasePromise ??= SQLite.openDatabaseAsync(databaseName);
    return databasePromise;
  }

  async function initialize() {
    if (initializePromise) {
      return initializePromise;
    }

    initializePromise = getDatabase().then(async (database) => {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS songs (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          body_text TEXT NOT NULL,
          body_json TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS songs_updated_at_idx
          ON songs(updated_at);
      `);
    });

    return initializePromise;
  }

  return {
    initialize,

    async loadAll() {
      const database = await getReadyDatabase();
      const rows = await database.getAllAsync<SongRow>(
        `SELECT id, title, body_text, body_json, created_at, updated_at
         FROM songs
         ORDER BY updated_at DESC, created_at DESC`,
      );

      return rows.map(rowToSong);
    },

    async loadById(id) {
      const database = await getReadyDatabase();
      const row = await database.getFirstAsync<SongRow>(
        `SELECT id, title, body_text, body_json, created_at, updated_at
         FROM songs
         WHERE id = ?`,
        id,
      );

      return row ? rowToSong(row) : null;
    },

    async save(song) {
      const database = await getReadyDatabase();

      await database.runAsync(
        `INSERT INTO songs (
          id,
          title,
          body_text,
          body_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          body_text = excluded.body_text,
          body_json = excluded.body_json,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at`,
        song.id,
        song.title,
        song.bodyText,
        serializeBodyJson(song.bodyJson),
        song.createdAt,
        song.updatedAt,
      );
    },

    async remove(id) {
      const database = await getReadyDatabase();
      await database.runAsync('DELETE FROM songs WHERE id = ?', id);
    },
  };

  async function getReadyDatabase() {
    await initialize();
    return getDatabase();
  }
}

function rowToSong(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    bodyText: row.body_text,
    bodyJson: parseBodyJson(row.body_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeBodyJson(bodyJson: unknown | null) {
  return bodyJson == null ? null : JSON.stringify(bodyJson);
}

function parseBodyJson(bodyJson: string | null) {
  if (!bodyJson) {
    return null;
  }

  return JSON.parse(bodyJson) as unknown;
}
