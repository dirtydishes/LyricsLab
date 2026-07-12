/// <reference types="jest" />

import type { SuggestionContext } from '../bridge';
import type { WordSuggestion } from '../suggestions';
import {
  createRhymeSuggestionProvider,
  getWordSuggestions,
  staticSuggestionProvider,
} from '../suggestions';
import {
  createRhymeIndex,
  parseCmuDictionary,
} from '../../rhyme';
import { createLegacyRhymeEngineAdapter } from '../../rhyme/legacyRhymeEngineAdapter';
import type {
  RhymeEngine,
  RhymeEngineQuery,
  RhymeSuggestion,
} from '../../rhyme/public';

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
  createLegacyRhymeEngineAdapter(
    createRhymeIndex(parseCmuDictionary(RHYME_SUGGESTION_CMU_FIXTURE)),
  ),
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
  candidatesByAnchor,
  maxSuggestions,
}: {
  candidates?: readonly RhymeSuggestion[];
  candidatesByAnchor?: Readonly<Record<string, readonly RhymeSuggestion[]>>;
  maxSuggestions?: number;
} = {}) {
  const suggest = jest.fn((query: RhymeEngineQuery) => {
    const queryCandidates = candidatesByAnchor?.[query.anchor] ?? candidates;

    return queryCandidates.slice(0, query.maxResults ?? queryCandidates.length);
  });
  const engine: RhymeEngine = { suggest };
  const getRhymeEngine = jest.fn(() => engine);
  const provider = createRhymeSuggestionProvider(getRhymeEngine, {
    fallbackProvider: staticSuggestionProvider,
    maxSuggestions,
  });

  return {
    engine,
    getRhymeEngine,
    provider,
    suggest,
  };
}

function createExactCandidate(word: string): RhymeSuggestion {
  return {
    familyKey: 'AY1 T',
    id: `rhyme:exact:${word}`,
    kind: 'exact',
    label: `Perfect ${word}`,
    matchedSyllables: 1,
    normalizedWord: word,
    score: 1,
    word,
  };
}

function expectProviderSuggestions(
  suggestions: readonly WordSuggestion[],
  expectedSuggestions: readonly Pick<WordSuggestion, 'id' | 'word'>[],
) {
  expect(
    suggestions.map((suggestion) => ({
      id: suggestion.id,
      word: suggestion.word,
    })),
  ).toEqual(expectedSuggestions);

  for (const suggestion of suggestions) {
    expect(suggestion.id).toEqual(expect.any(String));
    expect(suggestion.word).toEqual(expect.any(String));
    expect(suggestion.word.length).toBeGreaterThan(0);

    if (suggestion.label !== undefined) {
      expect(suggestion.label).toEqual(expect.any(String));
      expect(suggestion.label).toContain(suggestion.word);
    }
  }
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

  it('does not materialize the rhyme engine when the requested maximum is zero or lower', () => {
    for (const maxSuggestions of [0, -1]) {
      const { getRhymeEngine, provider, suggest } =
        createRhymeProviderProbe({
          maxSuggestions,
        });

      expect(provider.getSuggestions(createContext())).toEqual([]);
      expect(getRhymeEngine).not.toHaveBeenCalled();
      expect(suggest).not.toHaveBeenCalled();
    }
  });

  it('does not materialize the rhyme engine when the editor selection is not empty', () => {
    const { getRhymeEngine, provider, suggest } =
      createRhymeProviderProbe();

    expect(
      provider.getSuggestions(
        createContext({
          selectionEmpty: false,
        }),
      ),
    ).toEqual([]);
    expect(getRhymeEngine).not.toHaveBeenCalled();
    expect(suggest).not.toHaveBeenCalled();
  });

  it('does not materialize the rhyme engine when no useful anchor exists', () => {
    const { getRhymeEngine, provider, suggest } =
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
    expect(getRhymeEngine).not.toHaveBeenCalled();
    expect(suggest).not.toHaveBeenCalled();
  });

  it('returns deterministic fallback suggestions when no rhyme candidates exist', () => {
    const { getRhymeEngine, provider, suggest } =
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
    expect(getRhymeEngine).toHaveBeenCalledTimes(1);
    expect(suggest).toHaveBeenCalledTimes(1);
  });

  it('materializes and queries the rhyme engine only after a useful anchor exists', () => {
    const { getRhymeEngine, provider, suggest } =
      createRhymeProviderProbe({
        maxSuggestions: 2,
      });

    const suggestions = provider.getSuggestions(
      createContext({
        currentLineText: 'Writing NIGHT, Dr!',
        previousToken: 'NIGHT,',
        wordBeforeCursor: 'Dr!',
      }),
    );

    expectProviderSuggestions(suggestions, [
      { id: 'rhyme:exact:flight', word: 'flight' },
    ]);
    expect(getRhymeEngine).toHaveBeenCalledTimes(1);
    expect(suggest).toHaveBeenCalledTimes(1);
    expect(suggest).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor: 'night',
        excludedWords: ['writing', 'night', 'dr'],
      }),
    );
  });

  it('maps injected rhyme candidates to provider-shaped insertable suggestions', () => {
    const { provider } = createRhymeProviderProbe({
      candidates: [
        createExactCandidate('flight'),
        createExactCandidate('sight'),
      ],
      maxSuggestions: 2,
    });

    const suggestions = provider.getSuggestions(
      createContext({
        currentLineText: 'writing through night ',
        previousToken: 'night',
      }),
    );

    expectProviderSuggestions(suggestions, [
      { id: 'rhyme:exact:flight', word: 'flight' },
      { id: 'rhyme:exact:sight', word: 'sight' },
    ]);
  });

  it('filters mixed active-word prefix candidates before applying the suggestion limit', () => {
    const { provider, suggest } = createRhymeProviderProbe({
      candidates: [
        createExactCandidate('brace'),
        createExactCandidate('braid'),
        createExactCandidate('brand'),
        createExactCandidate('brave'),
        createExactCandidate('flight'),
        createExactCandidate('sight'),
      ],
      maxSuggestions: 2,
    });

    const suggestions = provider.getSuggestions(
      createContext({
        currentLineText: 'night br',
        previousToken: 'night',
        wordBeforeCursor: 'br',
      }),
    );

    expectProviderSuggestions(suggestions, [
      { id: 'rhyme:exact:flight', word: 'flight' },
      { id: 'rhyme:exact:sight', word: 'sight' },
    ]);
    expect(suggest).toHaveBeenCalledWith(
      expect.not.objectContaining({ maxResults: expect.anything() }),
    );
  });

  it('prefers previous completed token candidates over active-word candidates', () => {
    const { provider, suggest } = createRhymeProviderProbe({
      candidatesByAnchor: {
        city: [createExactCandidate('pity')],
        light: [createExactCandidate('bite')],
      },
    });

    const suggestions = provider.getSuggestions(
      createContext({
        previousToken: 'city',
        wordBeforeCursor: 'light',
      }),
    );

    expectProviderSuggestions(suggestions, [
      { id: 'rhyme:exact:pity', word: 'pity' },
    ]);
    expect(
      suggest.mock.calls.map(([query]) => query.anchor),
    ).toEqual(['city']);
  });

  it('falls back to the active-word anchor when the previous token has no candidates', () => {
    const { provider, suggest } = createRhymeProviderProbe({
      candidatesByAnchor: {
        flow: [createExactCandidate('glow')],
        of: [],
      },
    });

    const suggestions = provider.getSuggestions(
      createContext({
        previousToken: 'of',
        wordBeforeCursor: 'flow',
      }),
    );

    expectProviderSuggestions(suggestions, [
      { id: 'rhyme:exact:glow', word: 'glow' },
    ]);
    expect(
      suggest.mock.calls.map(([query]) => query.anchor),
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
    const suggestions = rhymeSuggestionProvider.getSuggestions(
      createContext({
        previousToken: 'light',
      }),
    );

    expectProviderSuggestions(suggestions, [
      { id: 'rhyme:exact:bite', word: 'bite' },
      { id: 'rhyme:exact:bright', word: 'bright' },
      { id: 'rhyme:exact:fight', word: 'fight' },
      { id: 'rhyme:exact:night', word: 'night' },
      { id: 'rhyme:exact:sight', word: 'sight' },
      { id: 'rhyme:exact:white', word: 'white' },
      { id: 'rhyme:slant:city', word: 'city' },
      { id: 'rhyme:slant:pity', word: 'pity' },
    ]);
  });

  it('normalizes rhyme anchors while excluding active-word prefixes', () => {
    const suggestions = rhymeSuggestionProvider.getSuggestions(
      createContext({
        previousToken: 'LIGHT,',
        wordBeforeCursor: 'br',
      }),
    );

    expectProviderSuggestions(suggestions, [
      { id: 'rhyme:exact:bite', word: 'bite' },
      { id: 'rhyme:exact:fight', word: 'fight' },
      { id: 'rhyme:exact:night', word: 'night' },
      { id: 'rhyme:exact:sight', word: 'sight' },
      { id: 'rhyme:exact:white', word: 'white' },
      { id: 'rhyme:slant:city', word: 'city' },
      { id: 'rhyme:slant:pity', word: 'pity' },
    ]);
  });
});
