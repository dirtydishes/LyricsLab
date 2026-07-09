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

  it('returns no suggestions when the editor selection is not empty', () => {
    expect(
      getWordSuggestions(
        createContext({
          selectionEmpty: false,
        }),
      ),
    ).toEqual([]);
  });

  it('returns no suggestions when the requested maximum is zero or lower', () => {
    expect(getWordSuggestions(createContext(), 0)).toEqual([]);
    expect(getWordSuggestions(createContext(), -1)).toEqual([]);
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

  it('normalizes punctuation and case for contextual lookup and blocking', () => {
    const suggestions = getWordSuggestions(
      createContext({
        previousToken: 'THE,',
        wordBeforeCursor: 'Night!',
      }),
      4,
    );

    expect(suggestions).toEqual([
      { id: 'word:city', word: 'city' },
      { id: 'word:room', word: 'room' },
      { id: 'word:light', word: 'light' },
      { id: 'word:again', word: 'again' },
    ]);
  });

  it('keeps internal token punctuation distinct while trimming token edges', () => {
    expect(
      getWordSuggestions(
        createContext({
          wordBeforeCursor: "'late-night'",
        }),
        24,
      ).map((suggestion) => suggestion.word),
    ).toContain('late');
  });

  it('deduplicates contextual and fallback words after normalization', () => {
    expect(
      getWordSuggestions(
        createContext({
          previousToken: 'the',
        }),
      ).filter((suggestion) => suggestion.id === 'word:night'),
    ).toHaveLength(1);
  });

  it('excludes suggestions prefixed by the active word', () => {
    expect(
      getWordSuggestions(
        createContext({
          previousToken: 'the',
          wordBeforeCursor: 'ni',
        }),
      ).map((suggestion) => suggestion.word),
    ).not.toContain('night');
  });

  it('keeps stable ids and respects the requested maximum', () => {
    expect(getWordSuggestions(createContext(), 3)).toEqual([
      { id: 'word:night', word: 'night' },
      { id: 'word:city', word: 'city' },
      { id: 'word:room', word: 'room' },
    ]);
  });
});
