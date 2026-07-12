/// <reference types="jest" />

import { SMALL_CMU_FIXTURE_LINES } from '../__fixtures__/smallCmuFixture';
import { parseCmuDictionary } from '../cmuParser';
import {
  extractRhymeTail,
  type ParsedPhoneToken,
  type ParsedPronunciation,
} from '../rhymeTail';

type ParsedEntries = ReturnType<typeof parseCmuDictionary>;

function parseFixture(): ParsedEntries {
  return parseCmuDictionary(SMALL_CMU_FIXTURE_LINES.join('\n'));
}

function phonesFor(
  entries: ParsedEntries,
  normalizedWord: string,
  alternate: number | null = null,
): ParsedPronunciation {
  const entry = entries.find(
    (candidate) =>
      candidate.normalizedWord === normalizedWord &&
      candidate.alternate === alternate,
  );

  if (!entry) {
    throw new Error(`missing fixture pronunciation: ${normalizedWord}`);
  }

  return entry.phonemes.map(parsePhoneToken);
}

function parsePhoneToken(phoneme: string): ParsedPhoneToken {
  const stressMatch = phoneme.match(/^(.+)([012])$/);

  if (!stressMatch) {
    return {
      phone: phoneme,
      stress: null,
    };
  }

  return {
    phone: stressMatch[1],
    stress: Number(stressMatch[2]) as ParsedPhoneToken['stress'],
  };
}

describe('rhyme tail extraction', () => {
  const entries = parseFixture();

  it('prefers the last primary stress over a later secondary stress', () => {
    expect(extractRhymeTail(phonesFor(entries, 'flow'))?.key).toBe('OW1');
    expect(extractRhymeTail(phonesFor(entries, 'late-night'))?.key).toBe(
      'EY1 T N AY2 T',
    );
  });

  it('preserves stress digits in tail keys', () => {
    expect(extractRhymeTail(phonesFor(entries, 'mr'))).toEqual({
      key: 'IH1 S T ER0',
      phonemes: ['IH1', 'S', 'T', 'ER0'],
      phones: [
        { phone: 'IH', stress: 1 },
        { phone: 'S', stress: null },
        { phone: 'T', stress: null },
        { phone: 'ER', stress: 0 },
      ],
      startsAt: 1,
    });
  });

  it('falls back to the final vowel nucleus when no stressed vowel exists', () => {
    expect(extractRhymeTail(phonesFor(entries, 'the'))?.key).toBe('AH0');
  });

  it('does not treat stressed-looking consonants as vowel anchors', () => {
    expect(
      extractRhymeTail([
        { phone: 'B', stress: 1 },
        { phone: 'AH', stress: 0 },
      ])?.key,
    ).toBe('AH0');
  });

  it('uses each alternate pronunciation independently', () => {
    expect(extractRhymeTail(phonesFor(entries, 'wind'))?.key).toBe('IH1 N D');
    expect(extractRhymeTail(phonesFor(entries, 'wind', 1))?.key).toBe(
      'AY1 N D',
    );
  });
});
