/// <reference types="jest" />

import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  getSuggestionAccessibilityLabel,
  getSuggestionPresentation,
  getSuggestionStateLabel,
} from '../suggestionPresentation';

describe('suggestion presentation', () => {
  it.each([
    [{ id: '1', word: 'flow' }, { label: 'Prompt', role: 'prompt' }],
    [
      { id: '2', label: 'Perfect flow', word: 'flow' },
      { label: 'Perfect', role: 'perfect' },
    ],
    [
      { id: '3', label: 'Near glow', word: 'glow' },
      { label: 'Near', role: 'near' },
    ],
    [
      { id: '4', label: '3 syllable perfect tomorrow', word: 'tomorrow' },
      { label: '3-syllable', role: 'perfect' },
    ],
    [
      { id: '5', label: '2-syllable near forever', word: 'forever' },
      { label: '2-syllable', role: 'near' },
    ],
  ] as const)('maps %o to an accessible role and discreet label', (suggestion, expected) => {
    expect(getSuggestionPresentation(suggestion)).toEqual(expected);
  });

  it('uses explicit semantic roles and accurate spoken and state labels', () => {
    const presentation = getSuggestionPresentation({
      id: 'near',
      label: '2-syllable forever',
      role: 'near',
      word: 'forever',
    });

    expect(presentation).toEqual({ label: '2-syllable', role: 'near' });
    expect(getSuggestionAccessibilityLabel(presentation, 'forever'))
      .toBe('Near rhyme, 2-syllable match, forever');
    expect(getSuggestionStateLabel('error')).toBe('Unavailable');
    expect(getSuggestionStateLabel('unavailable')).toBe('Unavailable');
    expect(getSuggestionStateLabel('loading')).toBe('Loading');
    expect(getSuggestionStateLabel('prompt')).toBe('Prompt');
  });

  it('keeps the native pills accessible across type, focus, press, motion, and target states', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/editor/SuggestionBar.tsx'),
      'utf8',
    );
    expect(source).toContain('allowFontScaling');
    expect(source).not.toContain('maxFontSizeMultiplier');
    expect(source).toMatch(
      /getSuggestionAccessibilityLabel\(\s*presentation,\s*suggestion\.word,?\s*\)/u,
    );
    expect(source).toContain('accessibilityHint={`Replaces the current prefix with ${suggestion.word}`}');
    expect(source).toContain('accessibilityRole="button"');
    expect(source).toContain('minHeight: 44');
    expect(source).toContain('onFocus={() => setFocusedId(suggestion.id)}');
    expect(source).toContain('pressed && { backgroundColor: tokens.pressed }');
    expect(source).toContain("'reduceMotionChanged'");
    expect(source).toContain('getSuggestionTransitionDuration');
    expect(source).not.toContain('accessibilityState={{ selected: focused }}');
  });
});
