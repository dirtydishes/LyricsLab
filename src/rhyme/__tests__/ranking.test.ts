/// <reference types="jest" />

import {
  compareCodepoints,
  rankExactRhymeCandidates,
  type ExactRhymeRankInput,
} from '../ranking';

function candidate(
  overrides: Partial<ExactRhymeRankInput>,
): ExactRhymeRankInput {
  const normalizedWord = overrides.normalizedWord ?? overrides.word ?? 'base';

  return {
    id: `rhyme:${normalizedWord}`,
    word: normalizedWord,
    normalizedWord,
    ...overrides,
  };
}

describe('rhyme ranking', () => {
  it('ranks exact candidates by score without mutating the input order', () => {
    const candidates = [
      candidate({ normalizedWord: 'low', score: 0.75 }),
      candidate({ normalizedWord: 'high', score: 1.25 }),
      candidate({ normalizedWord: 'default' }),
    ];

    expect(
      rankExactRhymeCandidates(candidates).map((ranked) => ranked.normalizedWord),
    ).toEqual(['high', 'default', 'low']);
    expect(candidates.map((ranked) => ranked.normalizedWord)).toEqual([
      'low',
      'high',
      'default',
    ]);
  });

  it('uses lower rank hints before missing or higher rank hints', () => {
    const ranked = rankExactRhymeCandidates([
      candidate({ normalizedWord: 'unhinted', rankHint: null }),
      candidate({ normalizedWord: 'third', rankHint: 30 }),
      candidate({ normalizedWord: 'first', rankHint: 10 }),
      candidate({ normalizedWord: 'second', rankHint: 20 }),
    ]);

    expect(ranked.map((candidate) => candidate.normalizedWord)).toEqual([
      'first',
      'second',
      'third',
      'unhinted',
    ]);
  });

  it('prefers primary pronunciations, then higher matched counts', () => {
    const ranked = rankExactRhymeCandidates([
      candidate({
        normalizedWord: 'alternate-rich',
        isPrimaryPronunciation: false,
        matchedCount: 8,
      }),
      candidate({
        normalizedWord: 'primary-one',
        isPrimaryPronunciation: true,
        matchedCount: 1,
      }),
      candidate({
        normalizedWord: 'primary-many',
        isPrimaryPronunciation: true,
        matchedCount: 3,
      }),
    ]);

    expect(ranked.map((candidate) => candidate.normalizedWord)).toEqual([
      'primary-many',
      'primary-one',
      'alternate-rich',
    ]);
  });

  it('falls back to normalized word codepoints and then id codepoints', () => {
    const ranked = rankExactRhymeCandidates([
      candidate({ id: 'rhyme:gamma', normalizedWord: 'zoo' }),
      candidate({ id: 'rhyme:beta', normalizedWord: 'same' }),
      candidate({ id: 'rhyme:alpha', normalizedWord: 'same' }),
      candidate({ id: 'rhyme:delta', normalizedWord: 'angstrom' }),
      candidate({ id: 'rhyme:epsilon', normalizedWord: 'zebra' }),
      candidate({ id: 'rhyme:zeta', normalizedWord: 'åke' }),
    ]);

    expect(ranked.map((candidate) => candidate.id)).toEqual([
      'rhyme:delta',
      'rhyme:alpha',
      'rhyme:beta',
      'rhyme:epsilon',
      'rhyme:gamma',
      'rhyme:zeta',
    ]);
    expect(compareCodepoints('z', 'å')).toBeLessThan(0);
  });

  it('preserves exact-only metadata and leaves slant similarity inert', () => {
    expect(
      rankExactRhymeCandidates([
        candidate({
          id: 'rhyme:night',
          word: 'night',
          normalizedWord: 'night',
          matchedCount: 2.8,
        }),
      ]),
    ).toEqual([
      {
        id: 'rhyme:night',
        word: 'night',
        normalizedWord: 'night',
        score: 1,
        rankHint: null,
        isPrimaryPronunciation: true,
        matchedCount: 2,
        matchKind: 'exact',
        slantSimilarity: null,
      },
    ]);
  });

  it('keeps source order only after all deterministic keys tie', () => {
    const ranked = rankExactRhymeCandidates([
      candidate({ id: 'rhyme:tie', normalizedWord: 'tie', word: 'Tie A' }),
      candidate({ id: 'rhyme:tie', normalizedWord: 'tie', word: 'Tie B' }),
    ]);

    expect(ranked.map((candidate) => candidate.word)).toEqual(['Tie A', 'Tie B']);
  });
});
