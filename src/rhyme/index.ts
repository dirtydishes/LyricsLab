import {
  parseCmuDictionary as parseCmuDictionarySource,
  parseCmuLine,
  type CmuPronunciationEntry,
} from './cmuParser';
import { normalizeRhymeToken } from './normalize';
import {
  buildRhymeIndex as buildIndexedRhymeIndex,
  findExactRhymeCandidates as findIndexedExactRhymeCandidates,
  type ExactRhymeCandidate as IndexedExactRhymeCandidate,
  type ParsedRhymeLexeme,
  type RhymeIndex as IndexedRhymeIndex,
} from './rhymeIndex';
import {
  extractRhymeTailFromPhonemes,
} from './rhymeTail';

export { normalizeRhymeToken };
export type { CmuPronunciationEntry };

export type RhymeIndex = IndexedRhymeIndex;

export type RhymeTail = {
  key: string;
  phonemes: readonly string[];
  startsAt: number;
};

export type FindExactRhymesOptions = {
  includeSelf?: boolean;
  limit?: number;
};

export type ExactRhymeQuery = {
  anchor: string;
  excludedWords?: readonly string[];
  maxResults?: number;
};

export type ExactRhymeCandidate = IndexedExactRhymeCandidate;

export function parseCmuDictionary(source: string): CmuPronunciationEntry[] {
  return parseCmuDictionarySource(source);
}

export function parseCmuDictionaryLines(
  lines: Iterable<string>,
): CmuPronunciationEntry[] {
  const entries: CmuPronunciationEntry[] = [];

  for (const line of lines) {
    const entry = parseCmuLine(line);

    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

export function buildRhymeIndex(
  entries: readonly CmuPronunciationEntry[],
): RhymeIndex {
  return createRhymeIndex(entries);
}

export function createRhymeIndex(
  entries: readonly CmuPronunciationEntry[],
): RhymeIndex {
  return buildIndexedRhymeIndex(groupPronunciationsByWord(entries));
}

export function findExactRhymes(
  index: RhymeIndex,
  token: string,
  options: FindExactRhymesOptions = {},
): string[] {
  const normalizedToken = normalizeRhymeToken(token);

  if (!normalizedToken || options.limit === 0) {
    return [];
  }

  const anchorLexeme = index.lexemesByToken.get(normalizedToken);

  if (!anchorLexeme) {
    return [];
  }

  const rhymes = new Set<string>();

  for (const pronunciation of anchorLexeme.pronunciations) {
    if (!pronunciation.rhymeTailKey) {
      continue;
    }

    for (const candidate of index.tailIndex.get(pronunciation.rhymeTailKey) ?? []) {
      const candidateWord = candidate.lexeme.normalizedWord;

      if (options.includeSelf || candidateWord !== normalizedToken) {
        rhymes.add(candidateWord);
      }
    }
  }

  const sortedRhymes = [...rhymes].sort();
  const limit = options.limit ?? sortedRhymes.length;

  return sortedRhymes.slice(0, Math.max(0, limit));
}

export function findExactRhymeCandidates(
  index: RhymeIndex,
  query: ExactRhymeQuery,
): ExactRhymeCandidate[] {
  return findIndexedExactRhymeCandidates(index, query.anchor, {
    excludeTokens: query.excludedWords,
    maxCandidates: query.maxResults,
  });
}

export function extractRhymeTail(
  phonemes: readonly string[],
): RhymeTail | null {
  const tail = extractRhymeTailFromPhonemes(phonemes);

  if (!tail) {
    return null;
  }

  return {
    key: tail.key,
    phonemes: phonemes.slice(tail.startsAt),
    startsAt: tail.startsAt,
  };
}

type MutableParsedRhymeLexeme = {
  normalizedWord: string;
  pronunciations: Array<{
    phones: readonly string[];
  }>;
  word: string;
};

function groupPronunciationsByWord(
  entries: readonly CmuPronunciationEntry[],
): ParsedRhymeLexeme[] {
  const lexemesByWord = new Map<string, MutableParsedRhymeLexeme>();

  for (const entry of entries) {
    const normalizedWord = normalizeRhymeToken(entry.normalizedWord);

    if (!normalizedWord) {
      continue;
    }

    const lexeme = lexemesByWord.get(normalizedWord) ?? {
      normalizedWord,
      pronunciations: [],
      word: normalizedWord,
    };

    lexeme.pronunciations.push({
      phones: entry.phonemes,
    });
    lexemesByWord.set(normalizedWord, lexeme);
  }

  return [...lexemesByWord.values()];
}
