import {
  extractRhymeTailFromPhonemes,
  formatPhoneToken,
  getArpabetSyllableNuclei,
  isArpabetVowelPhone,
  parseArpabetPronunciation,
  type ParsedPhoneToken,
  type PhoneStress,
} from './rhymeTail';

export type SyllableSpan = {
  readonly end: number;
  readonly nucleus: number;
  readonly start: number;
  readonly stress: PhoneStress | null;
};

export type PronunciationAnalysis = {
  readonly familyKey: string;
  readonly phones: readonly string[];
  readonly syllables: readonly SyllableSpan[];
  readonly tail: readonly ParsedPhoneToken[];
  readonly tailKey: string;
  readonly tailStartsAt: number;
};

export type SlantScore = {
  readonly coda: number;
  readonly phonetic: number;
  readonly stress: number;
  readonly vowel: number;
};

type TailSegment = {
  readonly consonants: readonly ParsedPhoneToken[];
  readonly vowel: ParsedPhoneToken;
};

type MutableTailSegment = {
  consonants: ParsedPhoneToken[];
  vowel: ParsedPhoneToken;
};

const VOWEL_FAMILIES: readonly ReadonlySet<string>[] = [
  new Set(['IY', 'IH']),
  new Set(['EY', 'EH', 'AE']),
  new Set(['AA', 'AO']),
  new Set(['OW', 'UH', 'UW']),
  new Set(['AH', 'ER']),
];

type ConsonantFeature = {
  readonly manner: string;
  readonly place: string;
  readonly voiced: boolean;
};

const CONSONANT_FEATURES: Readonly<Record<string, ConsonantFeature>> = {
  B: { manner: 'stop', place: 'labial', voiced: true },
  CH: { manner: 'affricate', place: 'postalveolar', voiced: false },
  D: { manner: 'stop', place: 'alveolar', voiced: true },
  DH: { manner: 'fricative', place: 'dental', voiced: true },
  F: { manner: 'fricative', place: 'labial', voiced: false },
  G: { manner: 'stop', place: 'velar', voiced: true },
  HH: { manner: 'fricative', place: 'glottal', voiced: false },
  JH: { manner: 'affricate', place: 'postalveolar', voiced: true },
  K: { manner: 'stop', place: 'velar', voiced: false },
  L: { manner: 'liquid', place: 'alveolar', voiced: true },
  M: { manner: 'nasal', place: 'labial', voiced: true },
  N: { manner: 'nasal', place: 'alveolar', voiced: true },
  NG: { manner: 'nasal', place: 'velar', voiced: true },
  P: { manner: 'stop', place: 'labial', voiced: false },
  R: { manner: 'liquid', place: 'alveolar', voiced: true },
  S: { manner: 'fricative', place: 'alveolar', voiced: false },
  SH: { manner: 'fricative', place: 'postalveolar', voiced: false },
  T: { manner: 'stop', place: 'alveolar', voiced: false },
  TH: { manner: 'fricative', place: 'dental', voiced: false },
  V: { manner: 'fricative', place: 'labial', voiced: true },
  W: { manner: 'glide', place: 'labial', voiced: true },
  Y: { manner: 'glide', place: 'palatal', voiced: true },
  Z: { manner: 'fricative', place: 'alveolar', voiced: true },
  ZH: { manner: 'fricative', place: 'postalveolar', voiced: true },
};

export function analyzePronunciation(
  phones: readonly string[],
): PronunciationAnalysis | null {
  const rhymeTail = extractRhymeTailFromPhonemes(phones);

  if (!rhymeTail) {
    return null;
  }

  const parsed = parseArpabetPronunciation(phones);
  const syllables = createSyllableSpans(parsed);
  const tail = rhymeTail.phones;

  return {
    familyKey: createFamilyKey(tail),
    phones: [...phones],
    syllables,
    tail,
    tailKey: tail.map(formatPhoneToken).join(' '),
    tailStartsAt: rhymeTail.startsAt,
  };
}

export function scoreFullTailSlant(
  anchor: PronunciationAnalysis,
  candidate: PronunciationAnalysis,
): SlantScore {
  const aligned = alignTailSegments(
    createTailSegments(anchor.tail),
    createTailSegments(candidate.tail),
  );

  return {
    coda: roundScore(aligned.coda),
    phonetic: clampScore(
      aligned.vowel * 0.55 + aligned.coda * 0.3 + aligned.stress * 0.15,
    ),
    stress: roundScore(aligned.stress),
    vowel: roundScore(aligned.vowel),
  };
}

function createTailSegments(
  tail: readonly ParsedPhoneToken[],
): readonly TailSegment[] {
  const segments: MutableTailSegment[] = [];

  for (const phone of tail) {
    if (isArpabetVowelPhone(phone)) {
      segments.push({ consonants: [], vowel: phone });
      continue;
    }

    segments.at(-1)?.consonants.push(phone);
  }

  return segments;
}

function alignTailSegments(
  anchor: readonly TailSegment[],
  candidate: readonly TailSegment[],
) {
  const length = Math.max(anchor.length, candidate.length);

  if (length === 0) {
    return { coda: 0, stress: 0, vowel: 0 };
  }

  let coda = 0;
  let stress = 0;
  let vowel = 0;

  for (let index = 0; index < length; index += 1) {
    const anchorSegment = anchor[index];
    const candidateSegment = candidate[index];

    if (!anchorSegment || !candidateSegment) {
      continue;
    }

    vowel += compareVowels(anchorSegment.vowel, candidateSegment.vowel);
    stress += compareStress(
      anchorSegment.vowel.stress,
      candidateSegment.vowel.stress,
    );
    coda += compareAlignedSequences(
      anchorSegment.consonants,
      candidateSegment.consonants,
      compareConsonants,
    );
  }

  return {
    coda: coda / length,
    stress: stress / length,
    vowel: vowel / length,
  };
}

export function countMatchedSyllables(
  anchor: PronunciationAnalysis,
  candidate: PronunciationAnalysis,
) {
  const anchorVowels = anchor.tail.filter(isArpabetVowelPhone);
  const candidateVowels = candidate.tail.filter(isArpabetVowelPhone);
  const pairCount = Math.min(anchorVowels.length, candidateVowels.length);
  let matched = 0;

  for (let index = 0; index < pairCount; index += 1) {
    const anchorVowel = anchorVowels[index];
    const candidateVowel = candidateVowels[index];

    if (
      !anchorVowel ||
      !candidateVowel ||
      compareVowels(anchorVowel, candidateVowel) < 0.85 ||
      compareStress(anchorVowel.stress, candidateVowel.stress) < 0.6
    ) {
      break;
    }

    matched += 1;
  }

  return matched;
}

function createSyllableSpans(
  pronunciation: readonly ParsedPhoneToken[],
): readonly SyllableSpan[] {
  const nuclei = getArpabetSyllableNuclei(pronunciation);

  return nuclei.map((nucleus, index) => {
    const nextNucleus = nuclei[index + 1];
    const start = getSyllableStart(nuclei, index);
    const end = nextNucleus ? getSyllableStart(nuclei, index + 1) : pronunciation.length;

    return {
      end,
      nucleus: nucleus.index,
      start,
      stress: nucleus.stress,
    };
  });
}

function getSyllableStart(
  nuclei: ReturnType<typeof getArpabetSyllableNuclei>,
  index: number,
) {
  if (index === 0) {
    return 0;
  }

  const nucleus = nuclei[index];
  const previousNucleus = nuclei[index - 1];

  if (!nucleus || !previousNucleus) {
    return 0;
  }

  const consonantCount = nucleus.index - previousNucleus.index - 1;
  return consonantCount > 0 ? nucleus.index - 1 : nucleus.index;
}

function createFamilyKey(tail: readonly ParsedPhoneToken[]) {
  return tail
    .map((phone) =>
      isArpabetVowelPhone(phone)
        ? `v:${phone.phone}`
        : `c:${CONSONANT_FEATURES[phone.phone]?.manner ?? phone.phone}`,
    )
    .join('|');
}

function compareAlignedSequences<T>(
  left: readonly T[],
  right: readonly T[],
  compare: (leftItem: T, rightItem: T) => number,
) {
  const length = Math.max(left.length, right.length);

  if (length === 0) {
    return 1;
  }

  let previous = new Array<number>(right.length + 1).fill(0);

  for (const leftItem of left) {
    const current = new Array<number>(right.length + 1).fill(0);

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const rightItem = right[rightIndex - 1];

      if (rightItem === undefined) {
        continue;
      }

      current[rightIndex] = Math.max(
        previous[rightIndex] ?? 0,
        current[rightIndex - 1] ?? 0,
        (previous[rightIndex - 1] ?? 0) + compare(leftItem, rightItem),
      );
    }

    previous = current;
  }

  return (previous[right.length] ?? 0) / length;
}

function compareVowels(left: ParsedPhoneToken, right: ParsedPhoneToken) {
  if (left.phone === right.phone) {
    return 1;
  }

  return VOWEL_FAMILIES.some(
    (family) => family.has(left.phone) && family.has(right.phone),
  )
    ? 0.88
    : 0;
}

function compareConsonants(left: ParsedPhoneToken, right: ParsedPhoneToken) {
  if (left.phone === right.phone) {
    return 1;
  }

  const leftFeatures = CONSONANT_FEATURES[left.phone];
  const rightFeatures = CONSONANT_FEATURES[right.phone];

  if (!leftFeatures || !rightFeatures) {
    return 0;
  }

  return (
    (leftFeatures.manner === rightFeatures.manner ? 0.5 : 0) +
    (leftFeatures.place === rightFeatures.place ? 0.3 : 0) +
    (leftFeatures.voiced === rightFeatures.voiced ? 0.2 : 0)
  );
}

function compareStress(
  left: PhoneStress | null,
  right: PhoneStress | null,
) {
  if (left === right) {
    return 1;
  }

  if ((left === 1 && right === 2) || (left === 2 && right === 1)) {
    return 0.8;
  }

  if (left === null || right === null) {
    return 0.5;
  }

  return 0.6;
}

function roundScore(score: number) {
  return Math.round(clampScore(score) * 1_000_000) / 1_000_000;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(1, score));
}
