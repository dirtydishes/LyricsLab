/// <reference types="jest" />

import {
  normalizeLyricToken,
  normalizeLyricTokens,
  normalizeRhymeToken,
} from '../normalize';

describe('rhyme token normalization', () => {
  it('normalizes tokens to NFC lowercase text', () => {
    expect(normalizeLyricToken('CAFE\u0301')).toBe('caf\u00e9');
    expect(normalizeRhymeToken('CAFE\u0301')).toBe('caf\u00e9');
  });

  it('folds curly apostrophes to ascii apostrophes', () => {
    expect(normalizeLyricToken('Don\u2019t')).toBe("don't");
    expect(normalizeLyricToken('\u2018Til\u2019')).toBe('til');
  });

  it('trims whitespace and strips token-edge punctuation', () => {
    expect(normalizeLyricToken('  ...Hello!!!  ')).toBe('hello');
    expect(normalizeLyricToken('(#45),')).toBe('45');
  });

  it('preserves internal punctuation after edge cleanup', () => {
    expect(normalizeLyricToken('"late-night"')).toBe('late-night');
    expect(normalizeLyricToken("rock'n'roll")).toBe("rock'n'roll");
    expect(normalizeLyricToken('wait...what')).toBe('wait...what');
  });

  it('returns an empty token when no letters or numbers remain', () => {
    expect(normalizeLyricToken('?!...')).toBe('');
  });

  it('normalizes token arrays and removes empty results', () => {
    expect(normalizeLyricTokens([' Flow, ', '...', 'NIGHT\u2019S'])).toEqual([
      'flow',
      "night's",
    ]);
  });
});
