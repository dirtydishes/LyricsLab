import type { ColorSchemeName } from 'react-native';

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export type ThemeTokens = {
  accent: string;
  background: string;
  border: string;
  danger: string;
  dangerSurface: string;
  editorBackground: string;
  inputBackground: string;
  placeholder: string;
  pressed: string;
  primaryAction: string;
  primaryActionText: string;
  statusBarStyle: 'dark' | 'light';
  suggestion: {
    near: SuggestionRoleTokens;
    perfect: SuggestionRoleTokens;
    prompt: SuggestionRoleTokens;
  };
  surface: string;
  text: string;
  textSecondary: string;
};

export type SuggestionRoleTokens = {
  background: string;
  border: string;
  text: string;
};

export const lightTheme: ThemeTokens = {
  accent: '#a10f4a',
  background: '#f7f7f5',
  border: '#cfd5dd',
  danger: '#a82419',
  dangerSurface: '#fbe8ec',
  editorBackground: '#f6f4ef',
  inputBackground: '#ffffff',
  placeholder: '#596477',
  pressed: '#e9ebef',
  primaryAction: '#182032',
  primaryActionText: '#ffffff',
  statusBarStyle: 'dark',
  suggestion: {
    near: {
      background: '#f8e5ee',
      border: '#ba7895',
      text: '#7b1743',
    },
    perfect: {
      background: '#def2e6',
      border: '#6a9f7d',
      text: '#165c36',
    },
    prompt: {
      background: '#eef0f4',
      border: '#aeb6c2',
      text: '#253041',
    },
  },
  surface: '#ffffff',
  text: '#161a22',
  textSecondary: '#596477',
};

export const darkTheme: ThemeTokens = {
  accent: '#ff8aae',
  background: '#181820',
  border: '#555563',
  danger: '#ff9b91',
  dangerSurface: '#472526',
  editorBackground: '#181820',
  inputBackground: '#23232d',
  placeholder: '#b9b5bd',
  pressed: '#353541',
  primaryAction: '#f5f1ea',
  primaryActionText: '#181820',
  statusBarStyle: 'light',
  suggestion: {
    near: {
      background: '#482538',
      border: '#b97594',
      text: '#ffd7e6',
    },
    perfect: {
      background: '#203d30',
      border: '#70a488',
      text: '#d9f5e5',
    },
    prompt: {
      background: '#30303b',
      border: '#777785',
      text: '#f5f1ea',
    },
  },
  surface: '#23232d',
  text: '#f5f1ea',
  textSecondary: '#c2bec5',
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemColorScheme: ColorSchemeName | null | undefined,
): ResolvedTheme {
  if (preference !== 'system') {
    return preference;
  }

  return systemColorScheme === 'dark' ? 'dark' : 'light';
}

export function getThemeTokens(theme: ResolvedTheme) {
  return theme === 'dark' ? darkTheme : lightTheme;
}
