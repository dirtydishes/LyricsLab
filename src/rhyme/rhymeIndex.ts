import { normalizeRhymeToken } from './normalize';
import {
  extractRhymeTailFromPhonemes,
  parseArpabetPhoneToken,
} from './rhymeTail';

export { normalizeRhymeToken } from './normalize';

export type ParsedRhymePronunciation = {
  readonly phones: readonly string[];
  readonly rhymeTail?: readonly string[] | null;
};

export type ParsedRhymeLexeme = {
  readonly word: string;
  readonly normalizedWord?: string;
  readonly pronunciations: readonly ParsedRhymePronunciation[];
};

export type IndexedRhymePronunciation = {
  readonly lexeme: IndexedRhymeLexeme;
  readonly phones: readonly string[];
  readonly order: number;
  readonly rhymeTail: readonly string[] | null;
  readonly rhymeTailKey: string | null;
};

export type IndexedRhymeLexeme = {
  readonly word: string;
  readonly normalizedWord: string;
  readonly order: number;
  readonly pronunciations: readonly IndexedRhymePronunciation[];
};

export type RhymeIndex = {
  readonly lexemes: readonly IndexedRhymeLexeme[];
  readonly lexemesByToken: ReadonlyMap<string, IndexedRhymeLexeme>;
  readonly tailIndex: ReadonlyMap<string, readonly IndexedRhymePronunciation[]>;
};

export type ExactRhymeCandidate = {
  readonly id: string;
  readonly kind: 'exact';
  readonly word: string;
  readonly normalizedWord: string;
  readonly rhymeTailKey: string;
  readonly score: 1;
  readonly slantSimilarity: null;
};

export type RhymeCandidateRankFeatures = {
  readonly matchedSyllables: number;
  readonly repetitionPenalty: number;
  readonly stressCompatibility: number;
};

export type RankedExactRhymeCandidate = ExactRhymeCandidate &
  RhymeCandidateRankFeatures;

export type SlantRhymeCandidate = RhymeCandidateRankFeatures & {
  readonly id: string;
  readonly kind: 'slant';
  readonly word: string;
  readonly normalizedWord: string;
  readonly rhymeTailKey: string;
  readonly score: number;
  readonly slantSimilarity: number;
};

export type RhymeCandidate = RankedExactRhymeCandidate | SlantRhymeCandidate;

export type RhymeCandidateKind = RhymeCandidate['kind'];

export type ExactRhymeQueryOptions = {
  readonly sourceTokens?: readonly string[];
  readonly excludeTokens?: readonly string[];
  readonly excludedWords?: readonly string[];
  readonly maxCandidates?: number;
  readonly maxResults?: number;
};

export type RhymeQueryOptions = ExactRhymeQueryOptions & {
  readonly candidateKinds?: readonly RhymeCandidateKind[];
  readonly minSlantSimilarity?: number;
};

export type ExactRhymeQuery = ExactRhymeQueryOptions & {
  readonly anchor?: string;
  readonly anchorToken?: string;
};

export type RhymeQuery = RhymeQueryOptions & {
  readonly anchor?: string;
  readonly anchorToken?: string;
};

export type RhymeCandidateQuery = RhymeQuery;

type MutableIndexedRhymeLexeme = Omit<
  IndexedRhymeLexeme,
  'pronunciations'
> & {
  readonly pronunciations: IndexedRhymePronunciation[];
};

type CandidateAccumulator = ExactRhymeCandidate & {
  readonly lexemeOrder: number;
  readonly pronunciationOrder: number;
};

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
  readonly phones: ReturnType<typeof parseArpabetPhoneToken>[];
  readonly stressPattern: readonly number[];
  readonly syllableCount: number;
  readonly vowelPhones: readonly ReturnType<typeof parseArpabetPhoneToken>[];
};

const DEFAULT_MIN_SLANT_SIMILARITY = 0.35;
const DEFAULT_MAX_SLANT_RESULTS = 96;
const MAX_SLANT_ANCHOR_TAILS = 4;
const MAX_SLANT_BUCKET_SCAN = 96;
const MAX_SLANT_CANDIDATE_POOL = 256;
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

export function buildRhymeIndex(
  lexemes: readonly ParsedRhymeLexeme[],
): RhymeIndex {
  const lexemesByToken = new Map<string, MutableIndexedRhymeLexeme>();
  const indexedLexemes: MutableIndexedRhymeLexeme[] = [];
  const tailIndex = new Map<string, IndexedRhymePronunciation[]>();

  for (const lexeme of lexemes) {
    const normalizedWord = normalizeRhymeToken(
      lexeme.normalizedWord ?? lexeme.word,
    );

    if (!normalizedWord) {
      continue;
    }

    let indexedLexeme = lexemesByToken.get(normalizedWord);

    if (!indexedLexeme) {
      indexedLexeme = {
        normalizedWord,
        order: indexedLexemes.length,
        pronunciations: [],
        word: lexeme.word,
      };
      lexemesByToken.set(normalizedWord, indexedLexeme);
      indexedLexemes.push(indexedLexeme);
    }

    for (const pronunciation of lexeme.pronunciations) {
      const rhymeTail = normalizeRhymeTail(
        pronunciation.rhymeTail === undefined
          ? extractExactRhymeTail(pronunciation.phones)
          : pronunciation.rhymeTail,
      );
      const rhymeTailKey =
        rhymeTail === null ? null : createRhymeTailKey(rhymeTail);
      const indexedPronunciation: IndexedRhymePronunciation = {
        lexeme: indexedLexeme,
        order: indexedLexeme.pronunciations.length,
        phones: [...pronunciation.phones],
        rhymeTail,
        rhymeTailKey,
      };

      indexedLexeme.pronunciations.push(indexedPronunciation);

      if (rhymeTailKey === null) {
        continue;
      }

      const bucket = tailIndex.get(rhymeTailKey) ?? [];
      bucket.push(indexedPronunciation);
      tailIndex.set(rhymeTailKey, bucket);
    }
  }

  return {
    lexemes: indexedLexemes,
    lexemesByToken,
    tailIndex,
  };
}

export function findExactRhymeCandidates(
  index: RhymeIndex,
  query: ExactRhymeQuery,
): ExactRhymeCandidate[];

export function findExactRhymeCandidates(
  index: RhymeIndex,
  anchorToken: string,
  options?: ExactRhymeQueryOptions,
): ExactRhymeCandidate[];

export function findExactRhymeCandidates(
  index: RhymeIndex,
  anchorOrQuery: string | ExactRhymeQuery,
  options: ExactRhymeQueryOptions = {},
): ExactRhymeCandidate[] {
  const query = normalizeExactRhymeQuery(anchorOrQuery, options);

  if (query.maxResults !== undefined && query.maxResults <= 0) {
    return [];
  }

  const anchorNormalizedWord = normalizeRhymeToken(query.anchorToken);
  const anchorLexeme = index.lexemesByToken.get(anchorNormalizedWord);

  if (!anchorLexeme) {
    return [];
  }

  const anchorTailKeys = uniqueValues(
    anchorLexeme.pronunciations
      .map((pronunciation) => pronunciation.rhymeTailKey)
      .filter((rhymeTailKey): rhymeTailKey is string => rhymeTailKey !== null),
  );

  if (anchorTailKeys.length === 0) {
    return [];
  }

  const blockedWords = buildBlockedWordSet(anchorNormalizedWord, query);
  const candidatesByWord = new Map<string, CandidateAccumulator>();

  for (const anchorTailKey of anchorTailKeys) {
    const bucket = index.tailIndex.get(anchorTailKey) ?? [];

    for (const pronunciation of bucket) {
      const targetLexeme = pronunciation.lexeme;

      if (blockedWords.has(targetLexeme.normalizedWord)) {
        continue;
      }

      if (
        pronunciation.rhymeTail === null ||
        pronunciation.rhymeTailKey === null
      ) {
        continue;
      }

      const candidate = createCandidate(targetLexeme, pronunciation);
      const existing = candidatesByWord.get(candidate.normalizedWord);

      if (!existing || compareCandidates(candidate, existing) < 0) {
        candidatesByWord.set(candidate.normalizedWord, candidate);
      }
    }
  }

  const candidates = [...candidatesByWord.values()].sort(compareCandidates);
  const limitedCandidates =
    query.maxResults === undefined
      ? candidates
      : candidates.slice(0, Math.floor(query.maxResults));

  return limitedCandidates.map(stripCandidateSortMetadata);
}

export function findRhymeCandidates(
  index: RhymeIndex,
  query: RhymeQuery,
): RhymeCandidate[];

export function findRhymeCandidates(
  index: RhymeIndex,
  anchorToken: string,
  options?: RhymeQueryOptions,
): RhymeCandidate[];

export function findRhymeCandidates(
  index: RhymeIndex,
  anchorOrQuery: string | RhymeQuery,
  options: RhymeQueryOptions = {},
): RhymeCandidate[] {
  const query = normalizeRhymeQuery(anchorOrQuery, options);

  if (query.maxResults !== undefined && query.maxResults <= 0) {
    return [];
  }

  const anchorNormalizedWord = normalizeRhymeToken(query.anchorToken);
  const anchorLexeme = index.lexemesByToken.get(anchorNormalizedWord);

  if (!anchorLexeme) {
    return [];
  }

  const candidateKinds = new Set(query.candidateKinds);
  const maxResults =
    query.maxResults === undefined ? undefined : Math.floor(query.maxResults);
  const repeatedWords = buildRepeatedWordSet(query);
  const exactQuery = createMixedExactQuery(query);
  const exactCandidates = candidateKinds.has('exact')
    ? findExactRhymeCandidates(index, anchorNormalizedWord, exactQuery)
        .map((candidate) =>
          createRankedExactCandidate(
            index,
            anchorLexeme,
            candidate,
            repeatedWords,
          ),
        )
        .sort(compareRhymeCandidates)
    : [];

  if (
    maxResults !== undefined &&
    exactCandidates.length >= maxResults
  ) {
    return exactCandidates.slice(0, maxResults);
  }

  if (!candidateKinds.has('slant')) {
    return exactCandidates;
  }

  const remainingResults =
    maxResults === undefined ? undefined : maxResults - exactCandidates.length;
  const slantCandidates = findSlantRhymeCandidates(
    index,
    anchorNormalizedWord,
    anchorLexeme,
    query,
    new Set(exactCandidates.map((candidate) => candidate.normalizedWord)),
    repeatedWords,
    remainingResults,
  );

  const candidates = [...exactCandidates, ...slantCandidates].sort(
    compareRhymeCandidates,
  );

  return maxResults === undefined ? candidates : candidates.slice(0, maxResults);
}

export function extractExactRhymeTail(
  phones: readonly string[],
): readonly string[] | null {
  return extractRhymeTailFromPhonemes(phones)?.phonemes ?? null;
}

export function createRhymeTailKey(tail: readonly string[]): string {
  return tail.join(' ');
}

function buildBlockedWordSet(
  anchorNormalizedWord: string,
  options: RhymeCandidateExclusionOptions,
) {
  const blockedWords = new Set<string>([anchorNormalizedWord]);

  for (const token of [
    ...(options.sourceTokens ?? []),
    ...(options.excludeTokens ?? []),
    ...(options.excludedWords ?? []),
  ]) {
    const normalizedToken = normalizeRhymeToken(token);

    if (normalizedToken) {
      blockedWords.add(normalizedToken);
    }
  }

  return blockedWords;
}

function buildRepeatedWordSet(options: Pick<RhymeQueryOptions, 'sourceTokens'>) {
  const repeatedWords = new Set<string>();

  for (const token of options.sourceTokens ?? []) {
    const normalizedToken = normalizeRhymeToken(token);

    if (normalizedToken) {
      repeatedWords.add(normalizedToken);
    }
  }

  return repeatedWords;
}

function createMixedExactQuery(
  query: NormalizedRhymeQuery,
): NormalizedExactRhymeQuery {
  return {
    ...query,
    sourceTokens: [],
  };
}

type RhymeCandidateExclusionOptions = Pick<
  ExactRhymeQueryOptions,
  'excludeTokens' | 'excludedWords' | 'sourceTokens'
>;

type NormalizedExactRhymeQuery = Required<
  Pick<ExactRhymeQuery, 'anchorToken'>
> &
  ExactRhymeQueryOptions & {
    readonly maxResults?: number;
  };

function normalizeExactRhymeQuery(
  anchorOrQuery: string | ExactRhymeQuery,
  options: ExactRhymeQueryOptions,
): NormalizedExactRhymeQuery {
  if (typeof anchorOrQuery === 'string') {
    return {
      ...options,
      anchorToken: anchorOrQuery,
      maxResults: options.maxResults ?? options.maxCandidates,
    };
  }

  return {
    ...anchorOrQuery,
    anchorToken: anchorOrQuery.anchorToken ?? anchorOrQuery.anchor ?? '',
    maxResults: anchorOrQuery.maxResults ?? anchorOrQuery.maxCandidates,
  };
}

type NormalizedRhymeQuery = Required<Pick<RhymeQuery, 'anchorToken'>> &
  RhymeQueryOptions & {
    readonly candidateKinds: readonly RhymeCandidateKind[];
    readonly maxResults?: number;
    readonly minSlantSimilarity: number;
  };

function normalizeRhymeQuery(
  anchorOrQuery: string | RhymeQuery,
  options: RhymeQueryOptions,
): NormalizedRhymeQuery {
  const query =
    typeof anchorOrQuery === 'string'
      ? {
          ...options,
          anchorToken: anchorOrQuery,
          maxResults: options.maxResults ?? options.maxCandidates,
        }
      : {
          ...anchorOrQuery,
          anchorToken: anchorOrQuery.anchorToken ?? anchorOrQuery.anchor ?? '',
          maxResults: anchorOrQuery.maxResults ?? anchorOrQuery.maxCandidates,
        };

  return {
    ...query,
    candidateKinds: normalizeCandidateKinds(query),
    minSlantSimilarity:
      query.minSlantSimilarity ?? DEFAULT_MIN_SLANT_SIMILARITY,
  };
}

function normalizeCandidateKinds(
  query: RhymeQueryOptions,
): readonly RhymeCandidateKind[] {
  const candidateKinds = query.candidateKinds;

  if (candidateKinds === undefined || candidateKinds.length === 0) {
    if (query.maxResults === undefined && query.minSlantSimilarity === undefined) {
      return ['exact'];
    }

    return ['exact', 'slant'];
  }

  const normalizedKinds: RhymeCandidateKind[] = [];
  const seenKinds = new Set<RhymeCandidateKind>();

  for (const candidateKind of candidateKinds) {
    if (seenKinds.has(candidateKind)) {
      continue;
    }

    normalizedKinds.push(candidateKind);
    seenKinds.add(candidateKind);
  }

  return normalizedKinds;
}

function normalizeRhymeTail(
  rhymeTail: readonly string[] | null,
): readonly string[] | null {
  if (rhymeTail === null || rhymeTail.length === 0) {
    return null;
  }

  return [...rhymeTail];
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

function findSlantRhymeCandidates(
  index: RhymeIndex,
  anchorNormalizedWord: string,
  anchorLexeme: IndexedRhymeLexeme,
  query: NormalizedRhymeQuery,
  exactCandidateWords: ReadonlySet<string>,
  repeatedWords: ReadonlySet<string>,
  maxResults: number | undefined,
): SlantRhymeCandidate[] {
  const anchorTailProfiles = createTailProfiles(
    anchorLexeme.pronunciations,
  ).slice(0, MAX_SLANT_ANCHOR_TAILS);

  if (anchorTailProfiles.length === 0) {
    return [];
  }

  const anchorTailKeys = new Set(
    anchorTailProfiles.map((tailProfile) => tailProfile.key),
  );
  const blockedWords = buildBlockedWordSet(
    anchorNormalizedWord,
    createMixedExactQuery(query),
  );
  const slantLookup = getSlantLookup(index);
  const candidatesByWord = new Map<string, SlantCandidateAccumulator>();
  const slantResultLimit = normalizeSlantResultLimit(maxResults);

  for (const anchorTailProfile of anchorTailProfiles) {
    for (const lookupKey of anchorTailProfile.lookupKeys) {
      const bucket = slantLookup.bucketsByKey.get(lookupKey) ?? [];
      const boundedBucket = bucket.slice(0, MAX_SLANT_BUCKET_SCAN);

      for (const targetEntry of boundedBucket) {
        if (
          blockedWords.has(targetEntry.lexeme.normalizedWord) ||
          exactCandidateWords.has(targetEntry.lexeme.normalizedWord) ||
          targetEntry.pronunciation.rhymeTailKey === null ||
          anchorTailKeys.has(targetEntry.pronunciation.rhymeTailKey)
        ) {
          continue;
        }

        const slantSimilarity = bestSlantSimilarity(
          anchorTailProfiles,
          targetEntry.tailProfile,
        );

        if (slantSimilarity < query.minSlantSimilarity) {
          continue;
        }

        const candidate = createSlantCandidate(
          anchorTailProfiles,
          targetEntry.lexeme,
          targetEntry.pronunciation,
          targetEntry.tailProfile,
          slantSimilarity,
          repeatedWords,
        );
        const existing = candidatesByWord.get(candidate.normalizedWord);

        if (!existing || compareSlantCandidates(candidate, existing) < 0) {
          candidatesByWord.set(candidate.normalizedWord, candidate);
          trimSlantCandidatePool(candidatesByWord);
        }
      }
    }
  }

  const candidates = [...candidatesByWord.values()].sort(compareSlantCandidates);
  const limitedCandidates = candidates.slice(0, slantResultLimit);

  return limitedCandidates.map(stripSlantCandidateSortMetadata);
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
  phones: readonly ReturnType<typeof parseArpabetPhoneToken>[],
) {
  const firstPhone = phones[0]?.phone;
  const firstStress = phones[0]?.stress;
  const lastPhone = phones[phones.length - 1]?.phone;
  const codaPhones = phones.slice(1).map((phone) => phone.phone);
  const vowelFamilyIndex =
    firstPhone === undefined ? -1 : getVowelFamilyIndex(firstPhone);

  return uniqueValues([
    firstPhone === undefined ? '' : `vowel:${firstPhone}`,
    firstPhone === undefined || lastPhone === undefined
      ? ''
      : `vowel-last:${firstPhone}:${lastPhone}`,
    vowelFamilyIndex < 0 ? '' : `family:${vowelFamilyIndex}`,
    vowelFamilyIndex < 0 || lastPhone === undefined
      ? ''
      : `family-last:${vowelFamilyIndex}:${lastPhone}`,
    firstStress === undefined || firstStress === null
      ? ''
      : `stress:${firstStress}`,
    codaPhones.length === 0 ? '' : `coda:${codaPhones.join(' ')}`,
    codaPhones.length < 2
      ? ''
      : `coda-suffix:${codaPhones.slice(-2).join(' ')}`,
  ].filter((lookupKey) => lookupKey.length > 0));
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

function createCandidate(
  targetLexeme: IndexedRhymeLexeme,
  pronunciation: IndexedRhymePronunciation,
): CandidateAccumulator {
  if (pronunciation.rhymeTail === null || pronunciation.rhymeTailKey === null) {
    throw new Error('exact rhyme candidates require an indexed rhyme tail');
  }

  return {
    id: `rhyme:exact:${targetLexeme.normalizedWord}`,
    kind: 'exact',
    lexemeOrder: targetLexeme.order,
    normalizedWord: targetLexeme.normalizedWord,
    pronunciationOrder: pronunciation.order,
    rhymeTailKey: pronunciation.rhymeTailKey,
    score: 1,
    slantSimilarity: null,
    word: targetLexeme.word,
  };
}

function createRankedExactCandidate(
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
  anchorVowels: readonly ReturnType<typeof parseArpabetPhoneToken>[],
  targetVowels: readonly ReturnType<typeof parseArpabetPhoneToken>[],
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
  anchorStress: ReturnType<typeof parseArpabetPhoneToken>['stress'],
  targetStress: ReturnType<typeof parseArpabetPhoneToken>['stress'],
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

function compareRhymeCandidates(left: RhymeCandidate, right: RhymeCandidate) {
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

function compareCandidates(
  left: CandidateAccumulator,
  right: CandidateAccumulator,
) {
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

function stripCandidateSortMetadata({
  lexemeOrder: _lexemeOrder,
  pronunciationOrder: _pronunciationOrder,
  ...candidate
}: CandidateAccumulator): ExactRhymeCandidate {
  return candidate;
}

function stripSlantCandidateSortMetadata({
  lexemeOrder: _lexemeOrder,
  pronunciationOrder: _pronunciationOrder,
  ...candidate
}: SlantCandidateAccumulator): SlantRhymeCandidate {
  return candidate;
}
