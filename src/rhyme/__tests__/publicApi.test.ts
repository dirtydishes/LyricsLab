/// <reference types="jest" />

import type {
  RhymeCandidate,
  RhymeQuery,
} from '../index';

describe('rhyme public API', () => {
  afterEach(() => {
    jest.dontMock('../../editor/EditorWebView');
    jest.dontMock('../../editor/bridge');
    jest.dontMock('../../editor/suggestions');
    jest.dontMock('expo-sqlite');
    jest.dontMock('react');
    jest.dontMock('react-native');
    jest.dontMock('react-native-webview');
    jest.resetModules();
  });

  it('is importable in Jest without editor or native module dependencies', () => {
    jest.isolateModules(() => {
      mockForbiddenDependency('../../editor/EditorWebView');
      mockForbiddenDependency('../../editor/bridge');
      mockForbiddenDependency('../../editor/suggestions');
      mockForbiddenDependency('expo-sqlite');
      mockForbiddenDependency('react');
      mockForbiddenDependency('react-native');
      mockForbiddenDependency('react-native-webview');

      const api = jest.requireActual<typeof import('../index')>('../index');

      expect(api).toEqual(
        expect.objectContaining({
          buildRhymeIndex: expect.any(Function),
          extractRhymeTail: expect.any(Function),
          findExactRhymes: expect.any(Function),
          findRhymeCandidates: expect.any(Function),
          loadRhymeIndexFromArtifact: expect.any(Function),
          normalizeRhymeToken: expect.any(Function),
          parseCmuDictionary: expect.any(Function),
          parseCmuDictionaryLines: expect.any(Function),
          RHYME_INDEX_ARTIFACT_FORMAT: 'lyricslab.rhyme-index',
          RHYME_INDEX_ARTIFACT_VERSION: 1,
        }),
      );
    });
  });

  it('exposes a pure sync fixture flow for exact rhymes', () => {
    const {
      buildRhymeIndex,
      extractRhymeTail,
      findExactRhymeCandidates,
      findExactRhymes,
      findRhymeCandidates,
      normalizeRhymeToken,
      parseCmuDictionary,
      parseCmuDictionaryLines,
    } = jest.requireActual<typeof import('../index')>('../index');

    expect(normalizeRhymeToken(" 'Time!' ")).toBe('time');
    expect(normalizeRhymeToken('!!!')).toBe('');
    expect(extractRhymeTail(['B', 'R', 'EY1', 'K'])).toEqual({
      key: 'EY1 K',
      phonemes: ['EY1', 'K'],
      startsAt: 2,
    });
    expect(extractRhymeTail(['AH0', 'N', 'D'])).toBeNull();

    const entries = parseCmuDictionary(`
;;; fixture comment
TIME T AY1 M
RHYME R AY1 M
CLIMB K L AY1 M
LIME L AY1 M
MIND M AY1 N D
KIND K AY1 N D
WIND W IH1 N D
WIND(2) W AY1 N D
THE DH AH0
`);

    expect(parseCmuDictionaryLines(['READ R EH1 D', 'READ(2) R IY1 D']))
      .toHaveLength(2);

    const index = buildRhymeIndex(entries);

    expect(findExactRhymes(index, 'time!')).toEqual([
      'climb',
      'lime',
      'rhyme',
    ]);
    expect(findExactRhymes(index, 'wind')).toEqual(['kind', 'mind']);
    expect(findExactRhymes(index, 'time', { includeSelf: true, limit: 2 }))
      .toEqual(['climb', 'lime']);
    expect(findExactRhymes(index, 'the')).toEqual([]);
    const exactCandidates = findExactRhymeCandidates(index, {
      anchor: 'time!',
      excludedWords: ['lime'],
      maxResults: 1,
    });

    expect(Object.keys(exactCandidates[0] ?? {}).sort()).toEqual([
      'id',
      'kind',
      'normalizedWord',
      'rhymeTailKey',
      'score',
      'slantSimilarity',
      'word',
    ]);
    expect(exactCandidates).toEqual([
      {
        id: 'rhyme:exact:climb',
        kind: 'exact',
        normalizedWord: 'climb',
        rhymeTailKey: 'AY1 M',
        score: 1,
        slantSimilarity: null,
        word: 'climb',
      },
    ]);

    const mixedQuery = {
      anchor: 'time!',
      excludedWords: ['lime'],
      maxResults: 6,
      minSlantSimilarity: 0,
      sourceTokens: ['rhyme'],
    } satisfies RhymeQuery;
    const mixedCandidates = findRhymeCandidates(index, mixedQuery);
    const firstMixedCandidate: RhymeCandidate | undefined = mixedCandidates[0];

    expect(firstMixedCandidate).toEqual(
      expect.objectContaining({
        kind: 'exact',
        matchedSyllables: 1,
        normalizedWord: 'climb',
        repetitionPenalty: 0,
        slantSimilarity: null,
        stressCompatibility: 1,
        word: 'climb',
      }),
    );
    expect(
      numericFeature(
        requiredCandidate(mixedCandidates, 'rhyme'),
        'repetitionPenalty',
      ),
    ).toBeGreaterThan(0);
    expect(mixedCandidates.some((candidate) => candidate.kind === 'slant'))
      .toBe(true);
    expect(
      mixedCandidates.find((candidate) => candidate.kind === 'slant'),
    ).toEqual(
      expect.objectContaining({
        matchedSyllables: 1,
        slantSimilarity: expect.any(Number),
        stressCompatibility: 1,
      }),
    );

    expect(
      findExactRhymeCandidates(index, {
        anchor: 'time!',
        excludedWords: ['lime'],
        maxResults: 1,
      }),
    ).toEqual([
      {
        id: 'rhyme:exact:climb',
        kind: 'exact',
        normalizedWord: 'climb',
        rhymeTailKey: 'AY1 M',
        score: 1,
        slantSimilarity: null,
        word: 'climb',
      },
    ]);
  });
});

function requiredCandidate(
  candidates: readonly RhymeCandidate[],
  normalizedWord: string,
): RhymeCandidate {
  const candidate = candidates.find(
    (entry) => entry.normalizedWord === normalizedWord,
  );

  expect(candidate).toBeDefined();

  return candidate as RhymeCandidate;
}

function numericFeature(candidate: RhymeCandidate, key: string): number {
  const value = (candidate as Record<string, unknown>)[key];

  expect(value).toEqual(expect.any(Number));

  return value as number;
}

function mockForbiddenDependency(moduleName: string) {
  jest.doMock(moduleName, () => {
    throw new Error(`rhyme public API imported ${moduleName}`);
  });
}
