import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

import { createExpoSQLiteSettingsStore } from './expoSQLiteSettingsStore';
import {
  createSettingsRepository,
  type SettingsRepository,
} from './settingsRepository';
import {
  getThemeTokens,
  resolveThemePreference,
  type ResolvedTheme,
  type ThemePreference,
  type ThemeTokens,
} from '../theme/theme';

type SettingsContextValue = {
  isLoading: boolean;
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference(preference: ThemePreference): Promise<void>;
  tokens: ThemeTokens;
};

type SettingsProviderProps = PropsWithChildren<{
  repository?: SettingsRepository;
}>;

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  children,
  repository: providedRepository,
}: SettingsProviderProps) {
  const repository = useMemo(
    () =>
      providedRepository ??
      createSettingsRepository(createExpoSQLiteSettingsStore()),
    [providedRepository],
  );
  const systemColorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const [preference, setPreferenceState] =
    useState<ThemePreference>('system');

  useEffect(() => {
    let isMounted = true;

    repository
      .getThemePreference()
      .then((storedPreference) => {
        if (isMounted) {
          setPreferenceState(storedPreference);
        }
      })
      .catch(() => {
        // System is the safe in-memory default when local settings cannot load.
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [repository]);

  const setPreference = useCallback(
    async (nextPreference: ThemePreference) => {
      setPreferenceState(nextPreference);

      try {
        await repository.setThemePreference(nextPreference);
      } catch (error) {
        const storedPreference = await repository.getThemePreference();
        setPreferenceState(storedPreference);
        throw error;
      }
    },
    [repository],
  );

  const resolvedTheme = resolveThemePreference(
    preference,
    systemColorScheme,
  );
  const value = useMemo<SettingsContextValue>(
    () => ({
      isLoading,
      preference,
      resolvedTheme,
      setPreference,
      tokens: getThemeTokens(resolvedTheme),
    }),
    [isLoading, preference, resolvedTheme, setPreference],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppTheme() {
  const settings = useContext(SettingsContext);

  if (!settings) {
    throw new Error('Settings are not available');
  }

  return settings;
}
