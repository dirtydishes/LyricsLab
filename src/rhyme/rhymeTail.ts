export type PhoneStress = 0 | 1 | 2;

export interface ParsedPhoneToken {
  readonly phone: string;
  readonly stress: PhoneStress | null;
}

export type ParsedPronunciation = readonly ParsedPhoneToken[];

export type ArpabetPronunciationInput =
  | ParsedPronunciation
  | readonly string[];

export interface RhymeTail {
  readonly phones: ParsedPronunciation;
  readonly phonemes: readonly string[];
  readonly key: string;
  readonly startsAt: number;
}

export interface ArpabetSyllableNucleus {
  readonly index: number;
  readonly phoneme: string;
  readonly phone: string;
  readonly stress: PhoneStress | null;
}

export interface RhymeTailComparison {
  readonly anchorSyllableCount: number;
  readonly candidateSyllableCount: number;
  readonly comparedSyllableCount: number;
  readonly matchedPhoneSuffixLength: number;
  readonly matchedStressCount: number;
  readonly matchedSyllableCount: number;
  readonly syllableCountDelta: number;
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

export function parseArpabetPronunciation(
  phonemes: readonly string[],
): ParsedPronunciation {
  return phonemes.map(parseArpabetPhoneToken);
}

export function extractRhymeTailFromPhonemes(
  phonemes: readonly string[],
): RhymeTail | null {
  return extractRhymeTail(parseArpabetPronunciation(phonemes));
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

export function isArpabetVowelPhone(
  phone: ParsedPhoneToken | string,
): boolean {
  return CMU_VOWEL_PHONES.has(normalizePhoneToken(phone).phone);
}

export function isStressedVowel(phone: ParsedPhoneToken | string): boolean {
  const token = normalizePhoneToken(phone);

  return (
    (token.stress === 1 || token.stress === 2) &&
    isArpabetVowelPhone(token)
  );
}

export function getArpabetSyllableNuclei(
  pronunciation: ArpabetPronunciationInput,
): readonly ArpabetSyllableNucleus[] {
  return normalizePronunciationInput(pronunciation).flatMap((phone, index) => {
    if (!isArpabetVowelPhone(phone)) {
      return [];
    }

    return [
      {
        index,
        phoneme: formatPhoneToken(phone),
        phone: phone.phone,
        stress: phone.stress,
      },
    ];
  });
}

export function countArpabetSyllables(
  pronunciation: ArpabetPronunciationInput,
): number {
  return getArpabetSyllableNuclei(pronunciation).length;
}

export function compareRhymeTails(
  anchorTail: ArpabetPronunciationInput,
  candidateTail: ArpabetPronunciationInput,
): RhymeTailComparison {
  const anchor = normalizePronunciationInput(anchorTail);
  const candidate = normalizePronunciationInput(candidateTail);
  const anchorSyllables = getArpabetSyllableNuclei(anchor);
  const candidateSyllables = getArpabetSyllableNuclei(candidate);
  const matchedSyllableCount = countMatchedSyllableSuffix(
    anchorSyllables,
    candidateSyllables,
  );

  return {
    anchorSyllableCount: anchorSyllables.length,
    candidateSyllableCount: candidateSyllables.length,
    comparedSyllableCount: Math.min(
      anchorSyllables.length,
      candidateSyllables.length,
    ),
    matchedPhoneSuffixLength: countMatchedPhoneSuffix(anchor, candidate),
    matchedStressCount: countMatchedStressSuffix(
      anchorSyllables,
      candidateSyllables,
      matchedSyllableCount,
    ),
    matchedSyllableCount,
    syllableCountDelta: Math.abs(
      anchorSyllables.length - candidateSyllables.length,
    ),
  };
}

function normalizePronunciationInput(
  pronunciation: ArpabetPronunciationInput,
): ParsedPronunciation {
  const firstPhone = pronunciation[0];

  if (typeof firstPhone === 'string') {
    return parseArpabetPronunciation(pronunciation as readonly string[]);
  }

  return pronunciation as ParsedPronunciation;
}

function normalizePhoneToken(phone: ParsedPhoneToken | string): ParsedPhoneToken {
  if (typeof phone === 'string') {
    return parseArpabetPhoneToken(phone);
  }

  return phone;
}

function countMatchedPhoneSuffix(
  anchor: ParsedPronunciation,
  candidate: ParsedPronunciation,
): number {
  let matchedPhones = 0;
  let anchorIndex = anchor.length - 1;
  let candidateIndex = candidate.length - 1;

  while (anchorIndex >= 0 && candidateIndex >= 0) {
    const anchorPhone = anchor[anchorIndex];
    const candidatePhone = candidate[candidateIndex];

    if (!anchorPhone || !candidatePhone || anchorPhone.phone !== candidatePhone.phone) {
      break;
    }

    matchedPhones += 1;
    anchorIndex -= 1;
    candidateIndex -= 1;
  }

  return matchedPhones;
}

function countMatchedSyllableSuffix(
  anchorSyllables: readonly ArpabetSyllableNucleus[],
  candidateSyllables: readonly ArpabetSyllableNucleus[],
): number {
  let matchedSyllables = 0;
  let anchorIndex = anchorSyllables.length - 1;
  let candidateIndex = candidateSyllables.length - 1;

  while (anchorIndex >= 0 && candidateIndex >= 0) {
    const anchorSyllable = anchorSyllables[anchorIndex];
    const candidateSyllable = candidateSyllables[candidateIndex];

    if (
      !anchorSyllable ||
      !candidateSyllable ||
      anchorSyllable.phone !== candidateSyllable.phone
    ) {
      break;
    }

    matchedSyllables += 1;
    anchorIndex -= 1;
    candidateIndex -= 1;
  }

  return matchedSyllables;
}

function countMatchedStressSuffix(
  anchorSyllables: readonly ArpabetSyllableNucleus[],
  candidateSyllables: readonly ArpabetSyllableNucleus[],
  matchedSyllableCount: number,
): number {
  let matchedStresses = 0;

  for (let offset = 1; offset <= matchedSyllableCount; offset += 1) {
    const anchorSyllable = anchorSyllables[anchorSyllables.length - offset];
    const candidateSyllable =
      candidateSyllables[candidateSyllables.length - offset];

    if (
      anchorSyllable &&
      candidateSyllable &&
      anchorSyllable.stress === candidateSyllable.stress
    ) {
      matchedStresses += 1;
    }
  }

  return matchedStresses;
}
