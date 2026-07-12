/// <reference types="jest" />

import { SMALL_CMU_FIXTURE_LINES } from '../__fixtures__/smallCmuFixture';
import { parseCmuDictionary } from '../cmuParser';
import { normalizeLyricToken } from '../normalize';

type ParsedEntries = ReturnType<typeof parseCmuDictionary>;
type ParsedEntry = ParsedEntries[number];

function parseFixture(): ParsedEntries {
  return parseCmuDictionary(SMALL_CMU_FIXTURE_LINES.join('\n'));
}

function getEntry(
  entries: ParsedEntries,
  normalizedWord: string,
  alternate: number | null = null,
): ParsedEntry {
  const entry = entries.find(
    (candidate) =>
      candidate.normalizedWord === normalizedWord &&
      candidate.alternate === alternate,
  );

  if (!entry) {
    throw new Error(`missing fixture entry: ${normalizedWord}`);
  }

  return entry;
}

describe('rhyme token normalization', () => {
  it('normalizes case and trims punctuation at token edges', () => {
    expect(normalizeLyricToken('  Night,! ')).toBe('night');
    expect(normalizeLyricToken('...FLOW...')).toBe('flow');
    expect(normalizeLyricToken('!!!')).toBe('');
  });

  it('keeps internal apostrophe and hyphen tokens while trimming dot edges', () => {
    expect(normalizeLyricToken("Can't!")).toBe("can't");
    expect(normalizeLyricToken('MR.')).toBe('mr');
    expect(normalizeLyricToken("'late-night'")).toBe('late-night');
  });
});

describe('CMU fixture parser', () => {
  it('skips blank lines and full-line comments', () => {
    const entries = parseFixture();
    const normalizedWords = [
      ...new Set(entries.map((entry) => entry.normalizedWord)),
    ].sort();

    expect(normalizedWords).toEqual([
      'away',
      "can't",
      'flow',
      'glow',
      'late-night',
      'mr',
      'the',
      'wind',
    ]);
  });

  it('strips inline comments before phone parsing', () => {
    const away = getEntry(parseFixture(), 'away');

    expect(away.phonemes).toEqual(['AH0', 'W', 'EY1']);
  });

  it('normalizes apostrophe, dot, and hyphen headwords consistently', () => {
    const entries = parseFixture();

    expect(getEntry(entries, "can't").displayWord).toBe("CAN'T");
    expect(getEntry(entries, 'mr').displayWord).toBe('MR.');
    expect(getEntry(entries, 'late-night').displayWord).toBe('LATE-NIGHT');
  });

  it('keeps alternate pronunciations grouped under the normalized word', () => {
    const windEntries = parseFixture().filter(
      (entry) => entry.normalizedWord === 'wind',
    );

    expect(windEntries.map((entry) => entry.alternate)).toEqual([null, 1]);
    expect(windEntries.map((entry) => entry.phonemes.join(' '))).toEqual([
      'W IH1 N D',
      'W AY1 N D',
    ]);
  });

  it('preserves ARPAbet stress digits for downstream tail parsing', () => {
    const entries = parseFixture();

    expect(getEntry(entries, "can't").phonemes).toEqual(['K', 'AE1', 'N', 'T']);
    expect(getEntry(entries, 'the').phonemes).toEqual(['DH', 'AH0']);
  });

  it('rejects malformed lines without discarding valid neighbors', () => {
    expect(
      parseCmuDictionary(
        [
          'GOOD G UH1 D',
          'NO_PHONES',
          'LOWER B ae1 D',
          'UNKNOWN B ZZQ D',
          'STRESSED-CONSONANT B1 AE1 D',
          'UNSTRESSED-VOWEL B AE D',
          'ALSO-GOOD AO1 L S OW0',
        ].join('\n'),
      ).map((entry) => entry.normalizedWord),
    ).toEqual(['good', 'also-good']);
  });
});
