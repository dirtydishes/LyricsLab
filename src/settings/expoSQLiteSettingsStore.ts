import * as SQLite from 'expo-sqlite';

import type { SettingsRecordStore } from './settingsRepository';

type SettingsRow = {
  setting_value: string;
};

type ExpoSQLiteSettingsStoreOptions = {
  databaseName?: string;
};

export function createExpoSQLiteSettingsStore(
  options: ExpoSQLiteSettingsStoreOptions = {},
): SettingsRecordStore {
  const databaseName = options.databaseName ?? 'lyricslab.db';
  let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
  let initializePromise: Promise<void> | null = null;

  async function getDatabase() {
    databasePromise ??= SQLite.openDatabaseAsync(databaseName);
    return databasePromise;
  }

  async function initialize() {
    initializePromise ??= getDatabase().then((database) =>
      database.execAsync(`
        CREATE TABLE IF NOT EXISTS app_settings (
          setting_key TEXT PRIMARY KEY NOT NULL,
          setting_value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `),
    );
    return initializePromise;
  }

  async function getReadyDatabase() {
    await initialize();
    return getDatabase();
  }

  return {
    initialize,

    async read(key) {
      const database = await getReadyDatabase();
      const row = await database.getFirstAsync<SettingsRow>(
        'SELECT setting_value FROM app_settings WHERE setting_key = ?',
        key,
      );
      return row?.setting_value ?? null;
    },

    async write(key, value) {
      const database = await getReadyDatabase();
      await database.runAsync(
        `INSERT INTO app_settings (setting_key, setting_value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(setting_key) DO UPDATE SET
           setting_value = excluded.setting_value,
           updated_at = excluded.updated_at`,
        key,
        value,
        new Date().toISOString(),
      );
    },
  };
}
