/// <reference types="jest" />

import { getWordSuggestions, staticSuggestionProvider } from '../suggestions';
import type { SuggestionContext } from '../bridge';

function createContext(
  overrides: Partial<SuggestionContext> = {},
): SuggestionContext {
  return {
    currentLineText: 'writing in the ',
    previousToken: 'the',
    selectionEmpty: true,
    wordBeforeCursor: '',
    ...overrides,
  };
}

describe('suggestion provider', () => {
  it('returns deterministic fallback suggestions without editor context', () => {
    expect(getWordSuggestions(null).map((suggestion) => suggestion.word)).toEqual(
      [
        'again',
        'alive',
        'bars',
        'beat',
        'breath',
        'city',
        'dream',
        'drift',
        'fire',
        'flow',
        'gold',
        'hook',
      ],
    );
  });

  it('prefers contextual follow-up words for the previous completed token', () => {
    expect(
      staticSuggestionProvider
        .getSuggestions(createContext())
        .map((suggestion) => suggestion.word)
        .slice(0, 4),
    ).toEqual(['night', 'city', 'room', 'light']);
  });

  it('does not suggest the active word or previous completed token', () => {
    const suggestions = getWordSuggestions(
      createContext({
        previousToken: 'my',
        wordBeforeCursor: 'mind',
      }),
    ).map((suggestion) => suggestion.word);

    expect(suggestions).not.toContain('my');
    expect(suggestions).not.toContain('mind');
  });

  it('keeps stable ids and respects the requested maximum', () => {
    expect(getWordSuggestions(createContext(), 3)).toEqual([
      { id: 'word:night', word: 'night' },
      { id: 'word:city', word: 'city' },
      { id: 'word:room', word: 'room' },
    ]);
  });
});
