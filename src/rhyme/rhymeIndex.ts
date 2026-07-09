import { normalizeRhymeToken } from './normalize';
import { extractRhymeTailFromPhonemes } from './rhymeTail';

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

export type ExactRhymeQueryOptions = {
  readonly sourceTokens?: readonly string[];
  readonly excludeTokens?: readonly string[];
  readonly excludedWords?: readonly string[];
  readonly maxCandidates?: number;
  readonly maxResults?: number;
};

export type ExactRhymeQuery = ExactRhymeQueryOptions & {
  readonly anchor?: string;
  readonly anchorToken?: string;
};

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
  options: NormalizedExactRhymeQuery,
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
