/// <reference types="jest" />

import {
  buildRhymeIndex,
  createRhymeIndex,
  extractExactRhymeTail,
  findExactRhymeCandidates,
  normalizeRhymeToken,
} from '../rhymeIndex';

describe('rhyme index', () => {
  it('normalizes lyric and dictionary tokens without removing internal punctuation', () => {
    expect(normalizeRhymeToken("  'Late-Night!' ")).toBe('late-night');
  });

  it('extracts exact tails from the last stressed vowel', () => {
    expect(extractExactRhymeTail(['B', 'IH0', 'G', 'IH1', 'N'])).toEqual([
      'IH1',
      'N',
    ]);
    expect(extractExactRhymeTail(['DH', 'AH0'])).toBeNull();
    expect(extractExactRhymeTail(['B1', 'AH0'])).toBeNull();
  });

  it('builds a normalized in-memory tail index and skips no-tail pronunciations', () => {
    const index = buildRhymeIndex([
      {
        pronunciations: [{ phones: ['T', 'AY1', 'M'] }],
        word: 'Time',
      },
      {
        pronunciations: [{ phones: ['DH', 'AH0'] }],
        word: 'the',
      },
    ]);

    expect(index.lexemesByToken.get('time')?.word).toBe('Time');
    expect(index.lexemesByToken.get('the')?.pronunciations).toHaveLength(1);
    expect(index.tailIndex.get('AY1 M')).toHaveLength(1);
    expect([...index.tailIndex.keys()]).not.toContain('AH0');
  });

  it('finds exact candidates by normalized anchor and filters source and excluded tokens', () => {
    const index = buildRhymeIndex([
      {
        pronunciations: [{ phones: ['T', 'AY1', 'M'] }],
        word: 'time',
      },
      {
        pronunciations: [{ phones: ['R', 'AY1', 'M'] }],
        word: 'rhyme',
      },
      {
        pronunciations: [{ phones: ['K', 'L', 'AY1', 'M'] }],
        word: 'climb',
      },
      {
        pronunciations: [{ phones: ['P', 'R', 'AY1', 'M'] }],
        word: 'prime',
      },
    ]);

    expect(
      findExactRhymeCandidates(index, 'TIME!', {
        excludeTokens: ['prime'],
        sourceTokens: ['climb'],
      }),
    ).toEqual([
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

  it('dedupes exact candidates by normalized target word across alternate pronunciations', () => {
    const index = buildRhymeIndex([
      {
        pronunciations: [{ phones: ['S', 'IY1', 'D'] }],
        word: 'seed',
      },
      {
        pronunciations: [
          { phones: ['R', 'EH1', 'D'] },
          { phones: ['R', 'IY1', 'D'] },
        ],
        word: 'read',
      },
      {
        pronunciations: [
          { phones: ['L', 'IY1', 'D'] },
          { phones: ['L', 'IY1', 'D'] },
        ],
        word: 'LEAD',
      },
    ]);

    expect(
      index.lexemesByToken.get('read')?.pronunciations.map((pronunciation) => ({
        key: pronunciation.rhymeTailKey,
        phones: pronunciation.phones,
      })),
    ).toEqual([
      { key: 'EH1 D', phones: ['R', 'EH1', 'D'] },
      { key: 'IY1 D', phones: ['R', 'IY1', 'D'] },
    ]);

    expect(
      findExactRhymeCandidates(index, 'seed').map((candidate) => ({
        key: candidate.rhymeTailKey,
        normalizedWord: candidate.normalizedWord,
        word: candidate.word,
      })),
    ).toEqual([
      { key: 'IY1 D', normalizedWord: 'lead', word: 'LEAD' },
      { key: 'IY1 D', normalizedWord: 'read', word: 'read' },
    ]);
  });

  it('returns no candidates for unknown, empty, or no-tail anchors', () => {
    const index = buildRhymeIndex([
      {
        pronunciations: [{ phones: ['HH', 'M'] }],
        word: 'hmm',
      },
      {
        pronunciations: [{ phones: ['B', 'IY1', 'T'] }],
        word: 'beat',
      },
    ]);

    expect(findExactRhymeCandidates(index, 'missing')).toEqual([]);
    expect(findExactRhymeCandidates(index, '!!!')).toEqual([]);
    expect(findExactRhymeCandidates(index, 'hmm')).toEqual([]);
  });

  it('dedupes duplicate parsed lexemes by normalized word and respects maxCandidates', () => {
    const index = buildRhymeIndex([
      {
        pronunciations: [{ phones: ['N', 'AY1', 'T'] }],
        word: 'night',
      },
      {
        normalizedWord: 'light',
        pronunciations: [{ phones: ['L', 'AY1', 'T'] }],
        word: 'Light',
      },
      {
        normalizedWord: 'light',
        pronunciations: [{ phones: ['L', 'AY1', 'T'] }],
        word: 'LIGHT(2)',
      },
      {
        pronunciations: [{ phones: ['S', 'AY1', 'T'] }],
        word: 'sight',
      },
    ]);

    expect(
      findExactRhymeCandidates(index, { anchor: 'night', maxResults: 1 }),
    ).toEqual([
      {
        id: 'rhyme:exact:light',
        kind: 'exact',
        normalizedWord: 'light',
        rhymeTailKey: 'AY1 T',
        score: 1,
        slantSimilarity: null,
        word: 'Light',
      },
    ]);
    expect(index.lexemesByToken.get('light')?.pronunciations).toHaveLength(2);
  });

  it('creates an index from parsed CMU-style entries', () => {
    const index = createRhymeIndex([
      {
        displayWord: 'TIME',
        normalizedWord: 'time',
        phonemes: ['T', 'AY1', 'M'],
      },
      {
        displayWord: 'RHYME',
        normalizedWord: 'rhyme',
        phonemes: ['R', 'AY1', 'M'],
      },
      {
        displayWord: 'CLIMB',
        normalizedWord: 'climb',
        phonemes: ['K', 'L', 'AY1', 'M'],
      },
    ]);

    expect(
      findExactRhymeCandidates(index, {
        anchor: 'time',
        excludedWords: ['climb'],
      }),
    ).toEqual([
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
});
