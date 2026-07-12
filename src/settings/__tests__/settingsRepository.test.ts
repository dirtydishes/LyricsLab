/// <reference types="jest" />

import {
  createInMemorySettingsStore,
  createSettingsRepository,
  type SettingsRecordStore,
} from '../settingsRepository';

describe('SettingsRepository', () => {
  it('defaults to System when no preference is stored', async () => {
    const repository = createSettingsRepository(createInMemorySettingsStore());

    await expect(repository.getThemePreference()).resolves.toBe('system');
  });

  it('persists each supported theme preference independently of songs', async () => {
    const store = createInMemorySettingsStore();
    const repository = createSettingsRepository(store);

    await repository.setThemePreference('dark');
    await expect(repository.getThemePreference()).resolves.toBe('dark');

    await repository.setThemePreference('light');
    await expect(repository.getThemePreference()).resolves.toBe('light');

    await repository.setThemePreference('system');
    await expect(repository.getThemePreference()).resolves.toBe('system');
  });

  it('falls back safely when a future or corrupt value is stored', async () => {
    const store: SettingsRecordStore = createInMemorySettingsStore({
      theme_preference: 'sepia',
    });
    const repository = createSettingsRepository(store);

    await expect(repository.getThemePreference()).resolves.toBe('system');
  });

  it('initializes its store once across reads and writes', async () => {
    const initialize = jest.fn(async () => undefined);
    const store = createInMemorySettingsStore();
    store.initialize = initialize;
    const repository = createSettingsRepository(store);

    await repository.getThemePreference();
    await repository.setThemePreference('dark');
    await repository.getThemePreference();

    expect(initialize).toHaveBeenCalledTimes(1);
  });
});
