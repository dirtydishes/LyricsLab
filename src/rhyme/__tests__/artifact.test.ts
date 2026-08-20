/// <reference types="jest" />

import {
  getRhymeIndexArtifactBuildInfo,
  findExactRhymeCandidates,
  loadRhymeIndexFromArtifact,
  RHYME_INDEX_ARTIFACT_FORMAT,
  type CompactRhymeIndexArtifact,
  type RhymeIndexArtifact,
} from '../index';

const FIXTURE_ARTIFACT: RhymeIndexArtifact = {
  format: RHYME_INDEX_ARTIFACT_FORMAT,
  version: 1,
  lexemes: [
    {
      normalizedWord: 'time',
      pronunciations: [
        {
          phones: ['T', 'AY1', 'M'],
          rhymeTail: ['AY1', 'M'],
        },
      ],
      word: 'time',
    },
    {
      normalizedWord: 'rhyme',
      pronunciations: [
        {
          phones: ['R', 'AY1', 'M'],
          rhymeTail: ['AY1', 'M'],
        },
      ],
      word: 'rhyme',
    },
    {
      normalizedWord: 'climb',
      pronunciations: [
        {
          phones: ['K', 'L', 'AY1', 'M'],
          rhymeTail: ['AY1', 'M'],
        },
      ],
      word: 'climb',
    },
    {
      normalizedWord: 'the',
      pronunciations: [
        {
          phones: ['DH', 'AH0'],
          rhymeTail: null,
        },
      ],
      word: 'the',
    },
  ],
};

describe('rhyme index artifact loader', () => {
  it('builds the Phase 03 rhyme index from a precompiled artifact', () => {
    const index = loadRhymeIndexFromArtifact(FIXTURE_ARTIFACT);

    expect(index.lexemesByToken.get('time')?.word).toBe('time');
    expect(index.lexemesByToken.get('the')?.pronunciations).toHaveLength(1);
    expect(index.tailIndex.get('AY1 M')).toHaveLength(3);
    expect([...index.tailIndex.keys()]).not.toContain('AH0');

    expect(
      findExactRhymeCandidates(index, {
        anchor: 'time',
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
      {
        id: 'rhyme:exact:rhyme',
        kind: 'exact',
        normalizedWord: 'rhyme',
        rhymeTailKey: 'AY1 M',
        score: 1,
        slantSimilarity: null,
        word: 'rhyme',
      },
    ]);
  });

  it('uses precomputed artifact tails instead of deriving tails on load', () => {
    const index = loadRhymeIndexFromArtifact({
      format: RHYME_INDEX_ARTIFACT_FORMAT,
      version: 1,
      lexemes: [
        {
          normalizedWord: 'seed',
          pronunciations: [
            {
              phones: ['S', 'IY1', 'D'],
              rhymeTail: ['IY1', 'D'],
            },
          ],
          word: 'seed',
        },
        {
          normalizedWord: 'read',
          pronunciations: [
            {
              phones: ['R', 'EH1', 'D'],
              rhymeTail: ['IY1', 'D'],
            },
          ],
          word: 'read',
        },
      ],
    });

    expect(
      findExactRhymeCandidates(index, {
        anchor: 'seed',
      }),
    ).toEqual([
      {
        id: 'rhyme:exact:read',
        kind: 'exact',
        normalizedWord: 'read',
        rhymeTailKey: 'IY1 D',
        score: 1,
        slantSimilarity: null,
        word: 'read',
      },
    ]);
  });

  it('builds the Phase 03 rhyme index from a compact generated artifact', () => {
    const compactArtifact: CompactRhymeIndexArtifact = {
      format: RHYME_INDEX_ARTIFACT_FORMAT,
      version: 1,
      build: {
        artifactDataSha256: 'fixture',
        counts: {
          entries: 4,
          lexemes: 4,
          noTailPronunciations: 1,
          pronunciations: 4,
          tailKeys: 1,
        },
        generator: 'fixture',
        generatorVersion: 1,
        sort: ['fixture order'],
        source: {
          bytes: 0,
          lines: 0,
          path: 'fixture',
          sha256: 'fixture',
        },
      },
      phoneInventory: ['T', 'AY1', 'M', 'R', 'K', 'L', 'DH', 'AH0'],
      pronunciations: [
        [[0, 1, 2], 0],
        [[3, 1, 2], 0],
        [[4, 5, 1, 2], 0],
        [[6, 7], null],
      ],
      tails: ['AY1 M'],
      words: [
        ['time', 0, 1],
        ['rhyme', 1, 1],
        ['climb', 2, 1],
        ['the', 3, 1],
      ],
    };

    const index = loadRhymeIndexFromArtifact(compactArtifact);

    expect(getRhymeIndexArtifactBuildInfo(compactArtifact)).toEqual(
      compactArtifact.build,
    );
    expect(index.lexemesByToken.get('the')?.pronunciations).toHaveLength(1);
    expect([...index.tailIndex.keys()]).toEqual(['AY1 M']);
    expect(
      findExactRhymeCandidates(index, {
        anchor: 'time',
      }).map((candidate) => candidate.word),
    ).toEqual(['climb', 'rhyme']);
  });

  it('does not retain mutable references to fixture artifact arrays', () => {
    const mutableArtifact = {
      format: RHYME_INDEX_ARTIFACT_FORMAT,
      version: 1,
      lexemes: [
        {
          normalizedWord: 'time',
          pronunciations: [
            {
              phones: ['T', 'AY1', 'M'],
              rhymeTail: ['AY1', 'M'],
            },
          ],
          word: 'time',
        },
      ],
    } satisfies RhymeIndexArtifact;

    const index = loadRhymeIndexFromArtifact(mutableArtifact);
    mutableArtifact.lexemes[0].pronunciations[0].phones.push('Z');
    mutableArtifact.lexemes[0].pronunciations[0].rhymeTail?.push('Z');

    expect(index.lexemesByToken.get('time')?.pronunciations[0]).toMatchObject({
      phones: ['T', 'AY1', 'M'],
      rhymeTail: ['AY1', 'M'],
      rhymeTailKey: 'AY1 M',
    });
  });

  it('rejects unsupported or malformed artifacts before indexing', () => {
    expect(() =>
      loadRhymeIndexFromArtifact({
        ...FIXTURE_ARTIFACT,
        version: 2,
      }),
    ).toThrow('unsupported rhyme artifact version');

    expect(() =>
      loadRhymeIndexFromArtifact({
        ...FIXTURE_ARTIFACT,
        lexemes: [
          {
            normalizedWord: 'time',
            pronunciations: [
              {
                phones: 'T AY1 M',
                rhymeTail: ['AY1', 'M'],
              },
            ],
            word: 'time',
          },
        ],
      }),
    ).toThrow('phones must be a string array');
  });

  it('does not read the raw CMU dictionary when loading fixture artifacts', () => {
    jest.isolateModules(() => {
      const readFileSync = jest.fn((pathLike: unknown) => {
        throw new Error(`unexpected filesystem read: ${String(pathLike)}`);
      });
      jest.doMock('fs', () => ({ readFileSync }));
      jest.doMock('node:fs', () => ({ readFileSync }));

      const api = jest.requireActual<typeof import('../index')>('../index');
      const index = api.loadRhymeIndexFromArtifact(FIXTURE_ARTIFACT);

      expect(
        api.findExactRhymeCandidates(index, {
          anchor: 'time',
        }).map((candidate) => candidate.word),
      ).toEqual(['climb', 'rhyme']);
      expect(readFileSync).not.toHaveBeenCalled();
    });
  });

  it('keeps the default npm test script free of full-dictionary smoke work', () => {
    const packageJson = jest.requireActual<{
      scripts?: Record<string, string>;
    }>('../../../package.json');

    expect(packageJson.scripts?.test).toEqual(expect.stringContaining('jest'));
    expect(packageJson.scripts?.test).not.toMatch(
      /cmudict|data\/|full[-:]?dictionary|benchmark|smoke/i,
    );
  });
});
