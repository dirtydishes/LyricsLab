import {
  parseArpabetPhoneToken,
} from './rhymeTail';
import type {
  ExactRhymeCandidate,
  IndexedRhymeLexeme,
  IndexedRhymePronunciation,
  RankedExactRhymeCandidate,
  RhymeCandidate,
  RhymeCandidateRankFeatures,
  RhymeIndex,
  SlantRhymeCandidate,
} from './rhymeIndex';

type ParsedArpabetPhone = ReturnType<typeof parseArpabetPhoneToken>;

type SlantCandidateAccumulator = SlantRhymeCandidate & {
  readonly lexemeOrder: number;
  readonly pronunciationOrder: number;
};

type SlantLookup = {
  readonly bucketsByKey: ReadonlyMap<string, readonly SlantLookupEntry[]>;
};

type SlantLookupEntry = {
  readonly lexeme: IndexedRhymeLexeme;
  readonly pronunciation: IndexedRhymePronunciation;
  readonly tailProfile: RhymeTailProfile;
};

type RhymeTailProfile = {
  readonly key: string;
  readonly lookupKeys: readonly string[];
  readonly phonemes: readonly string[];
  readonly phones: readonly ParsedArpabetPhone[];
  readonly stressPattern: readonly number[];
  readonly syllableCount: number;
  readonly vowelPhones: readonly ParsedArpabetPhone[];
};

export type SlantRhymeSearch = {
  readonly anchorLexeme: IndexedRhymeLexeme;
  readonly blockedWords: ReadonlySet<string>;
  readonly exactCandidateWords: ReadonlySet<string>;
  readonly maxResults?: number;
  readonly minSlantSimilarity: number;
  readonly repeatedWords: ReadonlySet<string>;
};

export const DEFAULT_MIN_SLANT_SIMILARITY = 0.35;

const DEFAULT_MAX_SLANT_RESULTS = 96;
const MAX_SLANT_ANCHOR_TAILS = 4;
const MAX_SLANT_BROAD_BUCKET_SCAN = 96;
const MAX_SLANT_CANDIDATE_POOL = 256;
const MAX_SLANT_SPECIFIC_BUCKET_SCAN = 128;
const MAX_SLANT_SIMILARITY = 0.99;
const SOURCE_REPETITION_PENALTY = 0.2;

const VOWEL_FAMILIES: readonly ReadonlySet<string>[] = [
  new Set(['IY', 'IH', 'EH']),
  new Set(['EY', 'EH', 'AE']),
  new Set(['AA', 'AH', 'AO']),
  new Set(['OW', 'UH', 'UW']),
  new Set(['AW', 'AY', 'OY']),
  new Set(['ER']),
];

const CONSONANT_FAMILIES: readonly ReadonlySet<string>[] = [
  new Set(['M', 'N', 'NG']),
  new Set(['P', 'B', 'T', 'D', 'K', 'G']),
  new Set(['F', 'V', 'TH', 'DH', 'S', 'Z', 'SH', 'ZH', 'HH']),
  new Set(['CH', 'JH']),
  new Set(['L', 'R']),
  new Set(['W', 'Y']),
];

const slantLookupCache = new WeakMap<RhymeIndex, SlantLookup>();

export function createRankedExactCandidate(
  index: RhymeIndex,
  anchorLexeme: IndexedRhymeLexeme,
  candidate: ExactRhymeCandidate,
  repeatedWords: ReadonlySet<string>,
): RankedExactRhymeCandidate {
  const targetLexeme = index.lexemesByToken.get(candidate.normalizedWord);
  const anchorTailProfiles = createTailProfiles(anchorLexeme.pronunciations);
  const targetTailProfile = targetLexeme
    ? createTailProfiles(targetLexeme.pronunciations).find(
        (tailProfile) => tailProfile.key === candidate.rhymeTailKey,
      )
    : undefined;
  const rankFeatures = targetTailProfile
    ? bestRhymeRankFeatures(anchorTailProfiles, targetTailProfile)
    : {
        matchedSyllables: 1,
        stressCompatibility: 1,
      };

  return {
    ...candidate,
    ...rankFeatures,
    repetitionPenalty: getRepetitionPenalty(
      candidate.normalizedWord,
      repeatedWords,
    ),
  };
}

export function findSlantRhymeCandidates(
  index: RhymeIndex,
  search: SlantRhymeSearch,
): SlantRhymeCandidate[] {
  const anchorTailProfiles = createTailProfiles(
    search.anchorLexeme.pronunciations,
  ).slice(0, MAX_SLANT_ANCHOR_TAILS);

  if (anchorTailProfiles.length === 0) {
    return [];
  }

  const anchorTailKeys = new Set(
    anchorTailProfiles.map((tailProfile) => tailProfile.key),
  );
  const slantLookup = getSlantLookup(index);
  const candidatesByWord = new Map<string, SlantCandidateAccumulator>();
  const slantResultLimit = normalizeSlantResultLimit(search.maxResults);

  collectSlantCandidatesFromLookupKeys({
    anchorTailKeys,
    anchorTailProfiles,
    candidatesByWord,
    includeBroadKeys: false,
    search,
    slantLookup,
  });

  if (candidatesByWord.size < slantResultLimit) {
    collectSlantCandidatesFromLookupKeys({
      anchorTailKeys,
      anchorTailProfiles,
      candidatesByWord,
      includeBroadKeys: true,
      search,
      slantLookup,
    });
  }

  const candidates = [...candidatesByWord.values()].sort(compareSlantCandidates);
  const limitedCandidates = candidates.slice(0, slantResultLimit);

  return limitedCandidates.map(stripSlantCandidateSortMetadata);
}

function collectSlantCandidatesFromLookupKeys({
  anchorTailKeys,
  anchorTailProfiles,
  candidatesByWord,
  includeBroadKeys,
  search,
  slantLookup,
}: {
  readonly anchorTailKeys: ReadonlySet<string>;
  readonly anchorTailProfiles: readonly RhymeTailProfile[];
  readonly candidatesByWord: Map<string, SlantCandidateAccumulator>;
  readonly includeBroadKeys: boolean;
  readonly search: SlantRhymeSearch;
  readonly slantLookup: SlantLookup;
}) {
  for (const anchorTailProfile of anchorTailProfiles) {
    for (const lookupKey of anchorTailProfile.lookupKeys) {
      if (isBroadLookupKey(lookupKey) !== includeBroadKeys) {
        continue;
      }

      const bucket = slantLookup.bucketsByKey.get(lookupKey) ?? [];
      const boundedBucket = selectLookupScanEntries(
        bucket,
        getLookupKeyScanLimit(lookupKey),
      );

      for (const targetEntry of boundedBucket) {
        if (
          search.blockedWords.has(targetEntry.lexeme.normalizedWord) ||
          search.exactCandidateWords.has(targetEntry.lexeme.normalizedWord) ||
          targetEntry.pronunciation.rhymeTailKey === null ||
          anchorTailKeys.has(targetEntry.pronunciation.rhymeTailKey)
        ) {
          continue;
        }

        const slantSimilarity = bestSlantSimilarity(
          anchorTailProfiles,
          targetEntry.tailProfile,
        );

        if (slantSimilarity < search.minSlantSimilarity) {
          continue;
        }

        const candidate = createSlantCandidate(
          anchorTailProfiles,
          targetEntry.lexeme,
          targetEntry.pronunciation,
          targetEntry.tailProfile,
          slantSimilarity,
          search.repeatedWords,
        );
        const existing = candidatesByWord.get(candidate.normalizedWord);

        if (!existing || compareSlantCandidates(candidate, existing) < 0) {
          candidatesByWord.set(candidate.normalizedWord, candidate);
          trimSlantCandidatePool(candidatesByWord);
        }
      }
    }
  }
}

export function compareRhymeCandidates(
  left: RhymeCandidate,
  right: RhymeCandidate,
) {
  const scoreDifference = right.score - left.score;

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  const repetitionDifference = left.repetitionPenalty - right.repetitionPenalty;

  if (repetitionDifference !== 0) {
    return repetitionDifference;
  }

  const slantDifference =
    (right.slantSimilarity ?? MAX_SLANT_SIMILARITY) -
    (left.slantSimilarity ?? MAX_SLANT_SIMILARITY);

  if (slantDifference !== 0) {
    return slantDifference;
  }

  const matchedSyllableDifference =
    right.matchedSyllables - left.matchedSyllables;

  if (matchedSyllableDifference !== 0) {
    return matchedSyllableDifference;
  }

  const stressDifference =
    right.stressCompatibility - left.stressCompatibility;

  if (stressDifference !== 0) {
    return stressDifference;
  }

  const wordDifference = compareStrings(
    left.normalizedWord,
    right.normalizedWord,
  );

  if (wordDifference !== 0) {
    return wordDifference;
  }

  return compareStrings(left.id, right.id);
}

function createTailProfiles(
  pronunciations: readonly IndexedRhymePronunciation[],
): RhymeTailProfile[] {
  const profilesByKey = new Map<string, RhymeTailProfile>();

  for (const pronunciation of pronunciations) {
    if (pronunciation.rhymeTail === null || pronunciation.rhymeTailKey === null) {
      continue;
    }

    if (profilesByKey.has(pronunciation.rhymeTailKey)) {
      continue;
    }

    profilesByKey.set(
      pronunciation.rhymeTailKey,
      createTailProfile(pronunciation.rhymeTailKey, pronunciation.rhymeTail),
    );
  }

  return [...profilesByKey.values()];
}

function createTailProfile(
  key: string,
  phonemes: readonly string[],
): RhymeTailProfile {
  const phones = phonemes.map(parseArpabetPhoneToken);
  const vowelPhones = phones.filter((phone) => isRhymeVowelPhone(phone.phone));
  const stressPattern = vowelPhones.flatMap((phone) =>
    phone.stress === null ? [] : [phone.stress],
  );

  return {
    key,
    lookupKeys: createSlantLookupKeys(phones),
    phonemes,
    phones,
    stressPattern,
    syllableCount: Math.max(1, vowelPhones.length),
    vowelPhones,
  };
}

function getSlantLookup(index: RhymeIndex): SlantLookup {
  const cachedLookup = slantLookupCache.get(index);

  if (cachedLookup) {
    return cachedLookup;
  }

  const bucketsByKey = new Map<string, SlantLookupEntry[]>();

  for (const lexeme of index.lexemes) {
    for (const pronunciation of lexeme.pronunciations) {
      if (pronunciation.rhymeTail === null || pronunciation.rhymeTailKey === null) {
        continue;
      }

      const tailProfile = createTailProfile(
        pronunciation.rhymeTailKey,
        pronunciation.rhymeTail,
      );
      const entry: SlantLookupEntry = {
        lexeme,
        pronunciation,
        tailProfile,
      };

      for (const lookupKey of tailProfile.lookupKeys) {
        const bucket = bucketsByKey.get(lookupKey) ?? [];
        bucket.push(entry);
        bucketsByKey.set(lookupKey, bucket);
      }
    }
  }

  for (const bucket of bucketsByKey.values()) {
    bucket.sort(compareSlantLookupEntries);
  }

  const lookup: SlantLookup = {
    bucketsByKey,
  };

  slantLookupCache.set(index, lookup);

  return lookup;
}

function createSlantLookupKeys(
  phones: readonly ParsedArpabetPhone[],
) {
  const firstPhone = phones[0]?.phone;
  const firstStress = phones[0]?.stress;
  const lastPhone = phones[phones.length - 1]?.phone;
  const codaPhones = phones.slice(1).map((phone) => phone.phone);
  const codaKey = codaPhones.join(' ');
  const vowelFamilyIndex =
    firstPhone === undefined ? -1 : getVowelFamilyIndex(firstPhone);

  return uniqueValues([
    firstPhone === undefined || codaPhones.length === 0
      ? ''
      : `vowel-coda:${firstPhone}:${codaKey}`,
    vowelFamilyIndex < 0 || codaPhones.length === 0
      ? ''
      : `family-coda:${vowelFamilyIndex}:${codaKey}`,
    firstPhone === undefined || lastPhone === undefined
      ? ''
      : `vowel-last:${firstPhone}:${lastPhone}`,
    vowelFamilyIndex < 0 || lastPhone === undefined
      ? ''
      : `family-last:${vowelFamilyIndex}:${lastPhone}`,
    codaPhones.length < 2
      ? ''
      : `coda-suffix:${codaPhones.slice(-2).join(' ')}`,
    codaPhones.length === 0 ? '' : `coda:${codaKey}`,
    firstPhone === undefined ? '' : `vowel:${firstPhone}`,
    vowelFamilyIndex < 0 ? '' : `family:${vowelFamilyIndex}`,
    firstStress === undefined || firstStress === null
      ? ''
      : `stress:${firstStress}`,
  ].filter((lookupKey) => lookupKey.length > 0));
}

function getLookupKeyScanLimit(lookupKey: string) {
  if (!isBroadLookupKey(lookupKey)) {
    return MAX_SLANT_SPECIFIC_BUCKET_SCAN;
  }

  return MAX_SLANT_BROAD_BUCKET_SCAN;
}

function isBroadLookupKey(lookupKey: string) {
  return (
    lookupKey.startsWith('vowel:') ||
    lookupKey.startsWith('family:') ||
    lookupKey.startsWith('stress:')
  );
}

function selectLookupScanEntries(
  bucket: readonly SlantLookupEntry[],
  maxEntries: number,
) {
  if (bucket.length <= maxEntries) {
    return bucket;
  }

  const selectedEntries: SlantLookupEntry[] = [];
  const selectedIndexes = new Set<number>();
  const headCount = Math.ceil(maxEntries / 2);

  for (let index = 0; index < headCount; index += 1) {
    selectedIndexes.add(index);
  }

  const remainingCount = maxEntries - selectedIndexes.size;

  if (remainingCount > 0) {
    const tailStart = headCount;
    const tailLength = bucket.length - tailStart;
    const step = tailLength / remainingCount;

    for (let offset = 0; offset < remainingCount; offset += 1) {
      selectedIndexes.add(
        Math.min(
          bucket.length - 1,
          tailStart + Math.floor(offset * step),
        ),
      );
    }
  }

  for (const index of [...selectedIndexes].sort((left, right) => left - right)) {
    const entry = bucket[index];

    if (entry) {
      selectedEntries.push(entry);
    }
  }

  return selectedEntries;
}

function normalizeSlantResultLimit(maxResults: number | undefined) {
  if (maxResults === undefined || !Number.isFinite(maxResults)) {
    return DEFAULT_MAX_SLANT_RESULTS;
  }

  return Math.min(
    MAX_SLANT_CANDIDATE_POOL,
    Math.max(0, Math.floor(maxResults)),
  );
}

function createSlantCandidate(
  anchorTailProfiles: readonly RhymeTailProfile[],
  targetLexeme: IndexedRhymeLexeme,
  pronunciation: IndexedRhymePronunciation,
  targetTailProfile: RhymeTailProfile,
  slantSimilarity: number,
  repeatedWords: ReadonlySet<string>,
): SlantCandidateAccumulator {
  if (pronunciation.rhymeTailKey === null) {
    throw new Error('slant rhyme candidates require an indexed rhyme tail');
  }

  const score = normalizeSlantSimilarity(slantSimilarity);
  const rankFeatures = bestRhymeRankFeatures(
    anchorTailProfiles,
    targetTailProfile,
  );
  const repetitionPenalty = getRepetitionPenalty(
    targetLexeme.normalizedWord,
    repeatedWords,
  );

  return {
    id: `rhyme:slant:${targetLexeme.normalizedWord}`,
    kind: 'slant',
    lexemeOrder: targetLexeme.order,
    matchedSyllables: rankFeatures.matchedSyllables,
    normalizedWord: targetLexeme.normalizedWord,
    pronunciationOrder: pronunciation.order,
    repetitionPenalty,
    rhymeTailKey: pronunciation.rhymeTailKey,
    score: normalizeSlantSimilarity(score - repetitionPenalty),
    slantSimilarity: score,
    stressCompatibility: rankFeatures.stressCompatibility,
    word: targetLexeme.word,
  };
}

function bestSlantSimilarity(
  anchorTailProfiles: readonly RhymeTailProfile[],
  targetTailProfile: RhymeTailProfile,
): number {
  let bestSimilarity = 0;

  for (const anchorTailProfile of anchorTailProfiles) {
    bestSimilarity = Math.max(
      bestSimilarity,
      calculateSlantSimilarity(anchorTailProfile, targetTailProfile),
    );
  }

  return bestSimilarity;
}

function bestRhymeRankFeatures(
  anchorTailProfiles: readonly RhymeTailProfile[],
  targetTailProfile: RhymeTailProfile,
): Pick<
  RhymeCandidateRankFeatures,
  'matchedSyllables' | 'stressCompatibility'
> {
  let bestFeatures: Pick<
    RhymeCandidateRankFeatures,
    'matchedSyllables' | 'stressCompatibility'
  > = {
    matchedSyllables: 0,
    stressCompatibility: 0,
  };

  for (const anchorTailProfile of anchorTailProfiles) {
    const features = calculateRhymeRankFeatures(
      anchorTailProfile,
      targetTailProfile,
    );

    if (compareRhymeRankFeatures(features, bestFeatures) < 0) {
      bestFeatures = features;
    }
  }

  return bestFeatures;
}

function calculateRhymeRankFeatures(
  anchorTailProfile: RhymeTailProfile,
  targetTailProfile: RhymeTailProfile,
): Pick<
  RhymeCandidateRankFeatures,
  'matchedSyllables' | 'stressCompatibility'
> {
  return {
    matchedSyllables: countMatchedSyllables(
      anchorTailProfile.vowelPhones,
      targetTailProfile.vowelPhones,
    ),
    stressCompatibility: compareStressPatterns(
      anchorTailProfile.stressPattern,
      targetTailProfile.stressPattern,
    ),
  };
}

function compareRhymeRankFeatures(
  left: Pick<
    RhymeCandidateRankFeatures,
    'matchedSyllables' | 'stressCompatibility'
  >,
  right: Pick<
    RhymeCandidateRankFeatures,
    'matchedSyllables' | 'stressCompatibility'
  >,
) {
  const matchedSyllableDifference =
    right.matchedSyllables - left.matchedSyllables;

  if (matchedSyllableDifference !== 0) {
    return matchedSyllableDifference;
  }

  return right.stressCompatibility - left.stressCompatibility;
}

function countMatchedSyllables(
  anchorVowels: readonly ParsedArpabetPhone[],
  targetVowels: readonly ParsedArpabetPhone[],
) {
  const sharedLength = Math.min(anchorVowels.length, targetVowels.length);
  let matchedSyllables = 0;

  for (let offset = 1; offset <= sharedLength; offset += 1) {
    const anchorVowel = anchorVowels[anchorVowels.length - offset];
    const targetVowel = targetVowels[targetVowels.length - offset];

    if (
      anchorVowel &&
      targetVowel &&
      anchorVowel.phone === targetVowel.phone &&
      compareStress(anchorVowel.stress, targetVowel.stress) > 0
    ) {
      matchedSyllables += 1;
      continue;
    }

    break;
  }

  return matchedSyllables;
}

function compareStressPatterns(
  anchorStressPattern: readonly number[],
  targetStressPattern: readonly number[],
) {
  const maxLength = Math.max(
    anchorStressPattern.length,
    targetStressPattern.length,
  );

  if (maxLength === 0) {
    return 1;
  }

  const sharedLength = Math.min(
    anchorStressPattern.length,
    targetStressPattern.length,
  );
  let matches = 0;

  for (let index = 0; index < sharedLength; index += 1) {
    if (anchorStressPattern[index] === targetStressPattern[index]) {
      matches += 1;
    }
  }

  return matches / maxLength;
}

function calculateSlantSimilarity(
  anchorTailProfile: RhymeTailProfile,
  targetTailProfile: RhymeTailProfile,
): number {
  const vowelSimilarity = compareVowelPhones(
    anchorTailProfile.phones[0]?.phone,
    targetTailProfile.phones[0]?.phone,
  );
  const codaSimilarity = compareTailCoda(anchorTailProfile, targetTailProfile);
  const suffixSimilarity = compareTailSuffix(
    anchorTailProfile.phonemes,
    targetTailProfile.phonemes,
  );
  const stressSimilarity = compareStress(
    anchorTailProfile.phones[0]?.stress ?? null,
    targetTailProfile.phones[0]?.stress ?? null,
  );
  const lengthSimilarity = compareTailLength(
    anchorTailProfile.phonemes,
    targetTailProfile.phonemes,
  );
  const matchedSyllableSimilarity =
    countMatchedSyllables(
      anchorTailProfile.vowelPhones,
      targetTailProfile.vowelPhones,
    ) /
    Math.max(anchorTailProfile.syllableCount, targetTailProfile.syllableCount);

  return normalizeSlantSimilarity(
    vowelSimilarity * 0.35 +
      codaSimilarity * 0.25 +
      suffixSimilarity * 0.15 +
      stressSimilarity * 0.15 +
      matchedSyllableSimilarity * 0.05 +
      lengthSimilarity * 0.05,
  );
}

function compareVowelPhones(
  anchorPhone: string | undefined,
  targetPhone: string | undefined,
) {
  if (anchorPhone === undefined || targetPhone === undefined) {
    return 0;
  }

  if (anchorPhone === targetPhone) {
    return 1;
  }

  return shareVowelFamily(anchorPhone, targetPhone) ? 0.65 : 0;
}

function shareVowelFamily(leftPhone: string, rightPhone: string) {
  return VOWEL_FAMILIES.some(
    (family) => family.has(leftPhone) && family.has(rightPhone),
  );
}

function getVowelFamilyIndex(phone: string) {
  return VOWEL_FAMILIES.findIndex((family) => family.has(phone));
}

function isRhymeVowelPhone(phone: string) {
  return getVowelFamilyIndex(phone) >= 0;
}

function compareTailCoda(
  anchorTailProfile: RhymeTailProfile,
  targetTailProfile: RhymeTailProfile,
) {
  const anchorCodaPhone = getPrimaryCodaPhone(anchorTailProfile);
  const targetCodaPhone = getPrimaryCodaPhone(targetTailProfile);

  if (anchorCodaPhone === undefined || targetCodaPhone === undefined) {
    return 0;
  }

  if (anchorCodaPhone === targetCodaPhone) {
    return 1;
  }

  return shareConsonantFamily(anchorCodaPhone, targetCodaPhone) ? 0.8 : 0;
}

function getPrimaryCodaPhone(tailProfile: RhymeTailProfile) {
  for (const phone of tailProfile.phones.slice(1)) {
    if (isRhymeVowelPhone(phone.phone)) {
      return undefined;
    }

    return phone.phone;
  }

  return undefined;
}

function shareConsonantFamily(leftPhone: string, rightPhone: string) {
  return CONSONANT_FAMILIES.some(
    (family) => family.has(leftPhone) && family.has(rightPhone),
  );
}

function compareTailSuffix(
  anchorPhonemes: readonly string[],
  targetPhonemes: readonly string[],
) {
  const maxLength = Math.max(anchorPhonemes.length, targetPhonemes.length);

  if (maxLength === 0) {
    return 0;
  }

  let sharedSuffixLength = 0;

  while (
    sharedSuffixLength < anchorPhonemes.length &&
    sharedSuffixLength < targetPhonemes.length &&
    anchorPhonemes[anchorPhonemes.length - sharedSuffixLength - 1] ===
      targetPhonemes[targetPhonemes.length - sharedSuffixLength - 1]
  ) {
    sharedSuffixLength += 1;
  }

  return sharedSuffixLength / maxLength;
}

function compareStress(
  anchorStress: ParsedArpabetPhone['stress'],
  targetStress: ParsedArpabetPhone['stress'],
) {
  if (anchorStress === null || targetStress === null) {
    return 0;
  }

  if (anchorStress === targetStress) {
    return 1;
  }

  return anchorStress > 0 && targetStress > 0 ? 0.7 : 0;
}

function compareTailLength(
  anchorPhonemes: readonly string[],
  targetPhonemes: readonly string[],
) {
  const maxLength = Math.max(anchorPhonemes.length, targetPhonemes.length);

  if (maxLength === 0) {
    return 0;
  }

  return (
    1 - Math.abs(anchorPhonemes.length - targetPhonemes.length) / maxLength
  );
}

function normalizeSlantSimilarity(score: number) {
  return Math.min(
    MAX_SLANT_SIMILARITY,
    Math.max(0, Math.round(score * 1000) / 1000),
  );
}

function getRepetitionPenalty(
  normalizedWord: string,
  repeatedWords: ReadonlySet<string>,
) {
  return repeatedWords.has(normalizedWord) ? SOURCE_REPETITION_PENALTY : 0;
}

function compareSlantCandidates(
  left: SlantCandidateAccumulator,
  right: SlantCandidateAccumulator,
) {
  const scoreDifference = right.score - left.score;

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  const wordDifference = compareStrings(
    left.normalizedWord,
    right.normalizedWord,
  );

  if (wordDifference !== 0) {
    return wordDifference;
  }

  const idDifference = compareStrings(left.id, right.id);

  if (idDifference !== 0) {
    return idDifference;
  }

  const lexemeOrderDifference = left.lexemeOrder - right.lexemeOrder;

  if (lexemeOrderDifference !== 0) {
    return lexemeOrderDifference;
  }

  return left.pronunciationOrder - right.pronunciationOrder;
}

function trimSlantCandidatePool(
  candidatesByWord: Map<string, SlantCandidateAccumulator>,
) {
  if (candidatesByWord.size <= MAX_SLANT_CANDIDATE_POOL) {
    return;
  }

  const candidates = [...candidatesByWord.values()].sort(compareSlantCandidates);

  for (const candidate of candidates.slice(MAX_SLANT_CANDIDATE_POOL)) {
    candidatesByWord.delete(candidate.normalizedWord);
  }
}

function compareSlantLookupEntries(
  left: SlantLookupEntry,
  right: SlantLookupEntry,
) {
  const lexemeOrderDifference = left.lexeme.order - right.lexeme.order;

  if (lexemeOrderDifference !== 0) {
    return lexemeOrderDifference;
  }

  return left.pronunciation.order - right.pronunciation.order;
}

function compareStrings(left: string, right: string) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function uniqueValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    unique.push(value);
  }

  return unique;
}

function stripSlantCandidateSortMetadata({
  lexemeOrder: _lexemeOrder,
  pronunciationOrder: _pronunciationOrder,
  ...candidate
}: SlantCandidateAccumulator): SlantRhymeCandidate {
  return candidate;
}
