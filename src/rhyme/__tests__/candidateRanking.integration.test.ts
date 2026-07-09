/// <reference types="jest" />

import {
  createRhymeIndex,
  findExactRhymeCandidates,
  parseCmuDictionary,
} from '../index';

const CANDIDATE_FIXTURE = `
;;; intentionally unsorted to prove ranking does not depend on fixture order
WHITE W AY1 T
LIGHT L AY1 T
LIGHT(2) L AY1 T
NIGHT N AY1 T
BRIGHT B R AY1 T
SIGHT S AY1 T
MIGHT M AY1 T
RIGHT R AY1 T
FIGHT F AY1 T
TIGHT T AY1 T
BYTE B AY1 T
BITE B AY1 T
SPITE S P AY1 T

TIME T AY1 M
LINE L AY1 N
AND AH0 N D
SHH SH
`;

const fixtureIndex = createRhymeIndex(parseCmuDictionary(CANDIDATE_FIXTURE));

function exactRhymes(
  anchor: string,
  options: {
    excludedWords?: readonly string[];
    maxResults?: number;
  } = {},
) {
  return findExactRhymeCandidates(fixtureIndex, {
    anchor,
    excludedWords: options.excludedWords,
    maxResults: options.maxResults ?? 20,
  });
}

function wordsFor(
  anchor: string,
  options: Parameters<typeof exactRhymes>[1] = {},
) {
  return exactRhymes(anchor, options).map((candidate) => candidate.word);
}

describe('rhyme candidate generation and ranking integration', () => {
  it('dedupes alternate pronunciations to one public candidate per target word', () => {
    const lightResults = exactRhymes('bright').filter(
      (candidate) => candidate.normalizedWord === 'light',
    );

    expect(lightResults).toEqual([
      {
        id: 'rhyme:exact:light',
        kind: 'exact',
        normalizedWord: 'light',
        rhymeTailKey: 'AY1 T',
        score: 1,
        slantSimilarity: null,
        word: 'light',
      },
    ]);
  });

  it('excludes the anchor source word and caller-provided excluded words after normalization', () => {
    expect(
      wordsFor('Light!', {
        excludedWords: ['night,', 'WHITE'],
      }),
    ).toEqual([
      'bite',
      'bright',
      'byte',
      'fight',
      'might',
      'right',
      'sight',
      'spite',
      'tight',
    ]);
  });

  it('returns no candidates for empty, out-of-vocabulary, or no-tail anchors', () => {
    expect(wordsFor('')).toEqual([]);
    expect(wordsFor('not-in-fixture')).toEqual([]);
    expect(wordsFor('and')).toEqual([]);
    expect(wordsFor('shh')).toEqual([]);
  });

  it('ranks exact candidates deterministically by normalized word codepoint order', () => {
    expect(wordsFor('bright')).toEqual([
      'bite',
      'byte',
      'fight',
      'light',
      'might',
      'night',
      'right',
      'sight',
      'spite',
      'tight',
      'white',
    ]);
  });

  it('respects maxResults after source exclusion, dedupe, and ranking', () => {
    expect(
      wordsFor('bright', {
        maxResults: 4,
      }),
    ).toEqual(['bite', 'byte', 'fight', 'light']);

    expect(
      wordsFor('bright', {
        maxResults: 0,
      }),
    ).toEqual([]);
  });

  it('keeps the public result shape stable for exact-only MVP candidates', () => {
    expect(exactRhymes('bright', { maxResults: 1 })).toStrictEqual([
      {
        id: 'rhyme:exact:bite',
        kind: 'exact',
        normalizedWord: 'bite',
        rhymeTailKey: 'AY1 T',
        score: 1,
        slantSimilarity: null,
        word: 'bite',
      },
    ]);
  });
});
