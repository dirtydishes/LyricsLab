import {
  isThemePreference,
  type ThemePreference,
} from '../theme/theme';

const THEME_PREFERENCE_KEY = 'theme_preference';

export type SettingsRepository = {
  getThemePreference(): Promise<ThemePreference>;
  setThemePreference(preference: ThemePreference): Promise<void>;
};

export type SettingsRecordStore = {
  initialize?(): Promise<void>;
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
};

export function createSettingsRepository(
  store: SettingsRecordStore,
): SettingsRepository {
  let initializePromise: Promise<void> | null = null;

  async function ensureReady() {
    initializePromise ??= store.initialize?.() ?? Promise.resolve();
    await initializePromise;
  }

  return {
    async getThemePreference() {
      await ensureReady();
      const storedPreference = await store.read(THEME_PREFERENCE_KEY);
      return isThemePreference(storedPreference) ? storedPreference : 'system';
    },

    async setThemePreference(preference) {
      await ensureReady();
      await store.write(THEME_PREFERENCE_KEY, preference);
    },
  };
}

export function createInMemorySettingsStore(
  seed: Record<string, string> = {},
): SettingsRecordStore {
  const values = new Map(Object.entries(seed));

  return {
    async read(key) {
      return values.get(key) ?? null;
    },
    async write(key, value) {
      values.set(key, value);
    },
  };
}
