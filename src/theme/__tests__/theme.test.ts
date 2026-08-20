/// <reference types="jest" />

import {
  darkTheme,
  lightTheme,
  resolveThemePreference,
} from '../theme';

describe('theme resolution', () => {
  it('follows the device only for System preference', () => {
    expect(resolveThemePreference('system', 'dark')).toBe('dark');
    expect(resolveThemePreference('system', 'light')).toBe('light');
    expect(resolveThemePreference('system', null)).toBe('light');
    expect(resolveThemePreference('light', 'dark')).toBe('light');
    expect(resolveThemePreference('dark', 'light')).toBe('dark');
  });
});

describe('semantic theme contrast', () => {
  const contrastCases: Array<[string, string, string]> = [
    ['light body', lightTheme.text, lightTheme.background],
    ['light secondary', lightTheme.textSecondary, lightTheme.background],
    ['light placeholder', lightTheme.placeholder, lightTheme.inputBackground],
    [
      'light perfect label',
      lightTheme.suggestion.perfect.text,
      lightTheme.suggestion.perfect.background,
    ],
    [
      'light near label',
      lightTheme.suggestion.near.text,
      lightTheme.suggestion.near.background,
    ],
    [
      'light prompt label',
      lightTheme.suggestion.prompt.text,
      lightTheme.suggestion.prompt.background,
    ],
    ['dark body', darkTheme.text, darkTheme.background],
    ['dark secondary', darkTheme.textSecondary, darkTheme.background],
    ['dark placeholder', darkTheme.placeholder, darkTheme.inputBackground],
    [
      'dark perfect label',
      darkTheme.suggestion.perfect.text,
      darkTheme.suggestion.perfect.background,
    ],
    [
      'dark near label',
      darkTheme.suggestion.near.text,
      darkTheme.suggestion.near.background,
    ],
    [
      'dark prompt label',
      darkTheme.suggestion.prompt.text,
      darkTheme.suggestion.prompt.background,
    ],
  ];

  it.each(contrastCases)(
    '%s meets WCAG AA for normal text',
    (_name, foreground, background) => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    },
  );
});

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);

  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid color: ${hex}`);
  }

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
