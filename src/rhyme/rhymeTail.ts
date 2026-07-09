export type PhoneStress = 0 | 1 | 2;

export interface ParsedPhoneToken {
  readonly phone: string;
  readonly stress: PhoneStress | null;
}

export type ParsedPronunciation = readonly ParsedPhoneToken[];

export interface RhymeTail {
  readonly phones: ParsedPronunciation;
  readonly phonemes: readonly string[];
  readonly key: string;
  readonly startsAt: number;
}

const CMU_VOWEL_PHONES = new Set([
  'AA',
  'AE',
  'AH',
  'AO',
  'AW',
  'AY',
  'EH',
  'ER',
  'EY',
  'IH',
  'IY',
  'OW',
  'OY',
  'UH',
  'UW',
]);

export function parseArpabetPhoneToken(phoneme: string): ParsedPhoneToken {
  const stressMatch = phoneme.match(/^(.+)([012])$/);

  if (!stressMatch) {
    return {
      phone: phoneme,
      stress: null,
    };
  }

  return {
    phone: stressMatch[1],
    stress: Number(stressMatch[2]) as PhoneStress,
  };
}

export function extractRhymeTailFromPhonemes(
  phonemes: readonly string[],
): RhymeTail | null {
  return extractRhymeTail(phonemes.map(parseArpabetPhoneToken));
}

export function extractRhymeTail(
  pronunciation: ParsedPronunciation,
): RhymeTail | null {
  for (let index = pronunciation.length - 1; index >= 0; index -= 1) {
    const phone = pronunciation[index];

    if (!phone) {
      continue;
    }

    if (isStressedVowel(phone)) {
      const phones = pronunciation.slice(index);

      return {
        phones,
        phonemes: phones.map(formatPhoneToken),
        key: phones.map(formatPhoneToken).join(' '),
        startsAt: index,
      };
    }
  }

  return null;
}

export function formatPhoneToken(phone: ParsedPhoneToken): string {
  if (phone.stress === null) {
    return phone.phone;
  }

  return `${phone.phone}${phone.stress}`;
}

function isStressedVowel(phone: ParsedPhoneToken) {
  return (
    (phone.stress === 1 || phone.stress === 2) &&
    CMU_VOWEL_PHONES.has(phone.phone)
  );
}
