/// <reference types="jest" />

import type { SuggestionContext } from '../bridge';
import {
  createRhymeSuggestionProvider,
  getWordSuggestions,
  staticSuggestionProvider,
} from '../suggestions';
import {
  createRhymeIndex,
  parseCmuDictionary,
  type ExactRhymeCandidate,
  type ExactRhymeQuery,
  type RhymeIndex,
} from '../../rhyme';

const RHYME_SUGGESTION_CMU_FIXTURE = `
;;; intentionally tiny fixture for injected suggestion-provider tests
WHITE W AY1 T
LIGHT L AY1 T
LIGHT(2) L AY1 T
NIGHT N AY1 T
BRIGHT B R AY1 T
SIGHT S AY1 T
BITE B AY1 T
FIGHT F AY1 T
CITY S IH1 T IY0
PITY P IH1 T IY0
`;

const rhymeSuggestionProvider = createRhymeSuggestionProvider(
  createRhymeIndex(parseCmuDictionary(RHYME_SUGGESTION_CMU_FIXTURE)),
);

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

function createRhymeProviderProbe({
  candidates = [createExactCandidate('flight')],
  maxSuggestions,
}: {
  candidates?: readonly ExactRhymeCandidate[];
  maxSuggestions?: number;
} = {}) {
  const index = createEmptyRhymeIndex();
  const getRhymeIndex = jest.fn(() => index);
  const findExactRhymeCandidates = jest.fn(
    (_index: RhymeIndex, _query: ExactRhymeQuery) => candidates,
  );
  const provider = createRhymeSuggestionProvider(getRhymeIndex, {
    fallbackProvider: staticSuggestionProvider,
    findExactRhymeCandidates,
    maxSuggestions,
  });

  return {
    findExactRhymeCandidates,
    getRhymeIndex,
    index,
    provider,
  };
}

function createEmptyRhymeIndex(): RhymeIndex {
  return {
    lexemes: [],
    lexemesByToken: new Map(),
    tailIndex: new Map(),
  };
}

function createExactCandidate(word: string): ExactRhymeCandidate {
  return {
    id: `rhyme:exact:${word}`,
    kind: 'exact',
    normalizedWord: word,
    rhymeTailKey: 'AY1 T',
    score: 1,
    slantSimilarity: null,
    word,
  };
}

describe('suggestion provider', () => {
  it('returns deterministic fallback suggestions with stable ids without editor context', () => {
    expect(getWordSuggestions(null)).toEqual([
      { id: 'word:again', word: 'again' },
      { id: 'word:alive', word: 'alive' },
      { id: 'word:bars', word: 'bars' },
      { id: 'word:beat', word: 'beat' },
      { id: 'word:breath', word: 'breath' },
      { id: 'word:city', word: 'city' },
      { id: 'word:dream', word: 'dream' },
      { id: 'word:drift', word: 'drift' },
      { id: 'word:fire', word: 'fire' },
      { id: 'word:flow', word: 'flow' },
      { id: 'word:gold', word: 'gold' },
      { id: 'word:hook', word: 'hook' },
    ]);
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

  it('does not materialize the rhyme index or finder when the requested maximum is zero or lower', () => {
    for (const maxSuggestions of [0, -1]) {
      const { findExactRhymeCandidates, getRhymeIndex, provider } =
        createRhymeProviderProbe({
          maxSuggestions,
        });

      expect(provider.getSuggestions(createContext())).toEqual([]);
      expect(getRhymeIndex).not.toHaveBeenCalled();
      expect(findExactRhymeCandidates).not.toHaveBeenCalled();
    }
  });

  it('does not materialize the rhyme index or finder when the editor selection is not empty', () => {
    const { findExactRhymeCandidates, getRhymeIndex, provider } =
      createRhymeProviderProbe();

    expect(
      provider.getSuggestions(
        createContext({
          selectionEmpty: false,
        }),
      ),
    ).toEqual([]);
    expect(getRhymeIndex).not.toHaveBeenCalled();
    expect(findExactRhymeCandidates).not.toHaveBeenCalled();
  });

  it('does not materialize the rhyme index or finder when no useful anchor exists', () => {
    const { findExactRhymeCandidates, getRhymeIndex, provider } =
      createRhymeProviderProbe({
        maxSuggestions: 3,
      });

    expect(provider.getSuggestions(null)).toEqual([
      { id: 'word:again', word: 'again' },
      { id: 'word:alive', word: 'alive' },
      { id: 'word:bars', word: 'bars' },
    ]);
    expect(
      provider.getSuggestions(
        createContext({
          currentLineText: 'writing li',
          previousToken: '!!!',
          wordBeforeCursor: 'li',
        }),
      ),
    ).toEqual([
      { id: 'word:again', word: 'again' },
      { id: 'word:alive', word: 'alive' },
      { id: 'word:bars', word: 'bars' },
    ]);
    expect(getRhymeIndex).not.toHaveBeenCalled();
    expect(findExactRhymeCandidates).not.toHaveBeenCalled();
  });

  it('returns deterministic fallback suggestions when no rhyme candidates exist', () => {
    const { findExactRhymeCandidates, getRhymeIndex, provider } =
      createRhymeProviderProbe({
        candidates: [],
        maxSuggestions: 3,
      });

    expect(
      provider.getSuggestions(
        createContext({
          currentLineText: 'writing through static ',
          previousToken: 'static',
        }),
      ),
    ).toEqual([
      { id: 'word:again', word: 'again' },
      { id: 'word:alive', word: 'alive' },
      { id: 'word:bars', word: 'bars' },
    ]);
    expect(getRhymeIndex).toHaveBeenCalledTimes(1);
    expect(findExactRhymeCandidates).toHaveBeenCalledTimes(1);
  });

  it('materializes the rhyme index and finder only after a useful anchor exists', () => {
    const { findExactRhymeCandidates, getRhymeIndex, index, provider } =
      createRhymeProviderProbe({
        maxSuggestions: 2,
      });

    expect(
      provider.getSuggestions(
        createContext({
          previousToken: 'night',
        }),
      ),
    ).toEqual([{ id: 'rhyme:exact:flight', word: 'flight' }]);
    expect(getRhymeIndex).toHaveBeenCalledTimes(1);
    expect(findExactRhymeCandidates).toHaveBeenCalledTimes(1);
    expect(findExactRhymeCandidates).toHaveBeenCalledWith(
      index,
      expect.objectContaining({
        anchor: 'night',
        maxResults: 4,
      }),
    );
  });

  it('prefers previous completed token candidates over active-word candidates', () => {
    const index = createEmptyRhymeIndex();
    const getRhymeIndex = jest.fn(() => index);
    const findExactRhymeCandidates = jest.fn(
      (_index: RhymeIndex, query: ExactRhymeQuery) =>
        query.anchor === 'city'
          ? [createExactCandidate('pity')]
          : [createExactCandidate('bite')],
    );
    const provider = createRhymeSuggestionProvider(getRhymeIndex, {
      findExactRhymeCandidates,
    });

    expect(
      provider.getSuggestions(
        createContext({
          previousToken: 'city',
          wordBeforeCursor: 'light',
        }),
      ),
    ).toEqual([{ id: 'rhyme:exact:pity', word: 'pity' }]);
    expect(
      findExactRhymeCandidates.mock.calls.map(([, query]) => query.anchor),
    ).toEqual(['city']);
  });

  it('falls back to the active-word anchor when the previous token has no candidates', () => {
    const index = createEmptyRhymeIndex();
    const getRhymeIndex = jest.fn(() => index);
    const findExactRhymeCandidates = jest.fn(
      (_index: RhymeIndex, query: ExactRhymeQuery) =>
        query.anchor === 'flow' ? [createExactCandidate('glow')] : [],
    );
    const provider = createRhymeSuggestionProvider(getRhymeIndex, {
      findExactRhymeCandidates,
    });

    expect(
      provider.getSuggestions(
        createContext({
          previousToken: 'of',
          wordBeforeCursor: 'flow',
        }),
      ),
    ).toEqual([{ id: 'rhyme:exact:glow', word: 'glow' }]);
    expect(
      findExactRhymeCandidates.mock.calls.map(([, query]) => query.anchor),
    ).toEqual(['of', 'flow']);
  });

  it('prefers contextual follow-up words for the previous completed token', () => {
    expect(
      staticSuggestionProvider
        .getSuggestions(createContext())
        .map((suggestion) => suggestion.word)
        .slice(0, 4),
    ).toEqual(['night', 'city', 'room', 'light']);
  });

  it('does not suggest the previous completed token or active word', () => {
    const suggestions = getWordSuggestions(
      createContext({
        previousToken: 'City,',
        wordBeforeCursor: 'Light!',
      }),
      24,
    ).map((suggestion) => suggestion.word);

    expect(suggestions).not.toContain('city');
    expect(suggestions).not.toContain('light');
  });

  it('excludes repeated suggestion words from the current line', () => {
    const suggestions = getWordSuggestions(
      createContext({
        currentLineText: 'writing in the night city room ',
        previousToken: 'the',
      }),
      24,
    ).map((suggestion) => suggestion.word);

    expect(suggestions).not.toContain('night');
    expect(suggestions).not.toContain('city');
    expect(suggestions).not.toContain('room');
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
    const suggestions = getWordSuggestions(
      createContext({
        previousToken: 'the',
      }),
      24,
    );
    const suggestionIds = suggestions.map((suggestion) => suggestion.id);

    expect(new Set(suggestionIds).size).toBe(suggestionIds.length);
    expect(suggestions.filter((suggestion) => suggestion.id === 'word:night'))
      .toHaveLength(1);
    expect(suggestions.filter((suggestion) => suggestion.id === 'word:city'))
      .toHaveLength(1);
  });

  it('excludes suggestions prefixed by the active word', () => {
    const suggestions = getWordSuggestions(
      createContext({
        previousToken: 'the',
        wordBeforeCursor: 'li',
      }),
      24,
    ).map((suggestion) => suggestion.word);

    expect(suggestions).not.toContain('light');
    expect(suggestions).not.toContain('line');
  });

  it('keeps stable ids and respects the requested maximum', () => {
    expect(getWordSuggestions(createContext(), 3)).toEqual([
      { id: 'word:night', word: 'night' },
      { id: 'word:city', word: 'city' },
      { id: 'word:room', word: 'room' },
    ]);
  });

  it('orders rhyme-backed suggestions deterministically with stable ids', () => {
    expect(
      rhymeSuggestionProvider.getSuggestions(
        createContext({
          previousToken: 'light',
        }),
      ),
    ).toEqual([
      { id: 'rhyme:exact:bite', word: 'bite' },
      { id: 'rhyme:exact:bright', word: 'bright' },
      { id: 'rhyme:exact:fight', word: 'fight' },
      { id: 'rhyme:exact:night', word: 'night' },
      { id: 'rhyme:exact:sight', word: 'sight' },
      { id: 'rhyme:exact:white', word: 'white' },
    ]);
  });

  it('normalizes rhyme anchors while excluding active-word prefixes', () => {
    expect(
      rhymeSuggestionProvider.getSuggestions(
        createContext({
          previousToken: 'LIGHT,',
          wordBeforeCursor: 'br',
        }),
      ),
    ).toEqual([
      { id: 'rhyme:exact:bite', word: 'bite' },
      { id: 'rhyme:exact:fight', word: 'fight' },
      { id: 'rhyme:exact:night', word: 'night' },
      { id: 'rhyme:exact:sight', word: 'sight' },
      { id: 'rhyme:exact:white', word: 'white' },
    ]);
  });
});
