/// <reference types="jest" />

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
          normalizeRhymeToken: expect.any(Function),
          parseCmuDictionary: expect.any(Function),
          parseCmuDictionaryLines: expect.any(Function),
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

function mockForbiddenDependency(moduleName: string) {
  jest.doMock(moduleName, () => {
    throw new Error(`rhyme public API imported ${moduleName}`);
  });
}
