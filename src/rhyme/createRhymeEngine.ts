import type {
  RhymeEngine,
  RhymeEngineQuery,
  RhymeKind,
  RhymeSuggestion,
} from './RhymeEngine';
import { normalizeRhymeToken } from './normalize';
import {
  analyzePronunciation,
  countMatchedSyllables,
  scoreFullTailSlant,
  type PronunciationAnalysis,
  type SlantScore,
  type SyllableSpan,
} from './productionPhonology';

export const BALANCED_SLANT_THRESHOLD = 0.86;

export const RHYME_RANKING_WEIGHTS = {
  commonness: 0.08,
  exact: 0.15,
  multisyllabic: 0.12,
  phonetic: 0.65,
  repetition: 0.12,
} as const;

export type RhymePronunciationInput = {
  readonly phones: readonly string[];
};

export type RhymeLexemeInput = {
  readonly commonness?: number;
  readonly lemma?: string;
  readonly normalizedWord?: string;
  readonly pronunciations: readonly RhymePronunciationInput[];
  readonly word: string;
};

export type RhymeScoreDiagnostics = {
  readonly features: {
    readonly commonness: number;
    readonly exact: number;
    readonly multisyllabic: number;
    readonly phonetic: number;
    readonly repeated: number;
  };
  readonly slant: SlantScore | null;
  readonly total: number;
  readonly weighted: {
    readonly commonness: number;
    readonly exact: number;
    readonly multisyllabic: number;
    readonly phonetic: number;
    readonly repetitionPenalty: number;
  };
};

export type RhymeSuggestionDiagnostics = RhymeSuggestion & {
  readonly anchorPhones: readonly string[];
  readonly anchorSyllables: readonly SyllableSpan[];
  readonly anchorTailStartsAt: number;
  readonly candidatePhones: readonly string[];
  readonly candidateSyllables: readonly SyllableSpan[];
  readonly candidateTailStartsAt: number;
  readonly lemma: string;
  readonly scoreDiagnostics: RhymeScoreDiagnostics;
};

export type DiagnosticRhymeEngine = RhymeEngine & {
  diagnose(query: RhymeEngineQuery): readonly RhymeSuggestionDiagnostics[];
};

type IndexedPronunciation = PronunciationAnalysis;

type IndexedLexeme = {
  readonly commonness: number;
  readonly lemma: string;
  readonly normalizedWord: string;
  readonly pronunciations: readonly IndexedPronunciation[];
  readonly word: string;
};

type Pairing = {
  readonly anchor: IndexedPronunciation;
  readonly candidate: IndexedPronunciation;
  readonly diagnostics: RhymeScoreDiagnostics;
  readonly kind: RhymeKind;
  readonly matchedSyllables: number;
};

export function createRhymeEngine(
  lexemes: readonly RhymeLexemeInput[],
): RhymeEngine {
  return createDiagnosticRhymeEngine(lexemes);
}

export function createDiagnosticRhymeEngine(
  lexemes: readonly RhymeLexemeInput[],
): DiagnosticRhymeEngine {
  const indexedLexemes = indexLexemes(lexemes);
  const lexemesByWord = new Map(
    indexedLexemes.map((lexeme) => [lexeme.normalizedWord, lexeme]),
  );

  function diagnose(
    query: RhymeEngineQuery,
  ): readonly RhymeSuggestionDiagnostics[] {
    const anchorWord = normalizeRhymeToken(query.anchor);
    const anchor = lexemesByWord.get(anchorWord);
    const maxResults = normalizeMaxResults(query.maxResults);

    if (!anchor || maxResults === 0) {
      return [];
    }

    const excluded = buildExcludedSet(query.excludedWords);
    const repeatedLemmas = buildRepeatedLemmaSet(
      query.sourceTokens,
      lexemesByWord,
    );
    const candidatesByLemma = new Map<string, RhymeSuggestionDiagnostics>();

    for (const candidate of indexedLexemes) {
      if (
        candidate.normalizedWord === anchor.normalizedWord ||
        candidate.lemma === anchor.lemma ||
        excluded.has(candidate.normalizedWord) ||
        excluded.has(candidate.lemma)
      ) {
        continue;
      }

      const pairing = findBestPairing(
        anchor,
        candidate,
        repeatedLemmas.has(candidate.lemma),
      );

      if (!pairing) {
        continue;
      }

      const suggestion = createSuggestion(query.anchor, candidate, pairing);
      const existing = candidatesByLemma.get(candidate.lemma);

      if (!existing || compareSuggestions(suggestion, existing) < 0) {
        candidatesByLemma.set(candidate.lemma, suggestion);
      }
    }

    return [...candidatesByLemma.values()]
      .sort(compareSuggestions)
      .slice(0, maxResults);
  }

  return {
    diagnose,
    suggest(query) {
      return diagnose(query).map(stripDiagnostics);
    },
  };
}

function indexLexemes(
  inputs: readonly RhymeLexemeInput[],
): readonly IndexedLexeme[] {
  const lexemes = new Map<string, IndexedLexeme>();
  const sortedInputs = [...inputs].sort((left, right) =>
    compareStrings(
      `${normalizeRhymeToken(left.normalizedWord ?? left.word)}:${normalizeRhymeToken(left.lemma ?? left.word)}:${left.word}`,
      `${normalizeRhymeToken(right.normalizedWord ?? right.word)}:${normalizeRhymeToken(right.lemma ?? right.word)}:${right.word}`,
    ),
  );

  for (const input of sortedInputs) {
    const normalizedWord = normalizeRhymeToken(
      input.normalizedWord ?? input.word,
    );

    if (!normalizedWord) {
      continue;
    }

    const pronunciations = uniquePronunciations(input.pronunciations);

    if (pronunciations.length === 0) {
      continue;
    }

    const existing = lexemes.get(normalizedWord);
    const lemma = normalizeRhymeToken(input.lemma ?? normalizedWord);
    const combinedPronunciations = uniqueAnalyzedPronunciations([
      ...(existing?.pronunciations ?? []),
      ...pronunciations,
    ]);

    lexemes.set(normalizedWord, {
      commonness: Math.max(
        existing?.commonness ?? 0,
        clamp01(input.commonness ?? 0),
      ),
      lemma: existing?.lemma ?? lemma ?? normalizedWord,
      normalizedWord,
      pronunciations: combinedPronunciations,
      word: chooseSurfaceWord(existing?.word, input.word),
    });
  }

  return [...lexemes.values()].sort((left, right) =>
    compareStrings(left.normalizedWord, right.normalizedWord),
  );
}

function uniquePronunciations(
  pronunciations: readonly RhymePronunciationInput[],
) {
  const analyses = pronunciations.flatMap((pronunciation) => {
    const analysis = analyzePronunciation(pronunciation.phones);
    return analysis ? [analysis] : [];
  });

  return uniqueAnalyzedPronunciations(analyses);
}

function uniqueAnalyzedPronunciations(
  pronunciations: readonly IndexedPronunciation[],
) {
  const byPhones = new Map<string, IndexedPronunciation>();

  for (const pronunciation of pronunciations) {
    byPhones.set(pronunciation.phones.join(' '), pronunciation);
  }

  return [...byPhones.values()].sort((left, right) =>
    compareStrings(left.phones.join(' '), right.phones.join(' ')),
  );
}

function findBestPairing(
  anchor: IndexedLexeme,
  candidate: IndexedLexeme,
  repeated: boolean,
): Pairing | null {
  let best: Pairing | null = null;

  for (const anchorPronunciation of anchor.pronunciations) {
    for (const candidatePronunciation of candidate.pronunciations) {
      const exact =
        anchorPronunciation.tailKey === candidatePronunciation.tailKey;
      const slant = exact
        ? null
        : scoreFullTailSlant(anchorPronunciation, candidatePronunciation);

      if (!exact && (!slant || slant.phonetic < BALANCED_SLANT_THRESHOLD)) {
        continue;
      }

      const matchedSyllables = countMatchedSyllables(
        anchorPronunciation,
        candidatePronunciation,
      );
      const pairing: Pairing = {
        anchor: anchorPronunciation,
        candidate: candidatePronunciation,
        diagnostics: createScoreDiagnostics({
          commonness: candidate.commonness,
          exact,
          matchedSyllables,
          phonetic: exact ? 1 : slant?.phonetic ?? 0,
          repeated,
          slant,
        }),
        kind: exact ? 'exact' : 'slant',
        matchedSyllables,
      };

      if (!best || comparePairings(pairing, best) < 0) {
        best = pairing;
      }
    }
  }

  return best;
}

function createScoreDiagnostics({
  commonness,
  exact,
  matchedSyllables,
  phonetic,
  repeated,
  slant,
}: {
  readonly commonness: number;
  readonly exact: boolean;
  readonly matchedSyllables: number;
  readonly phonetic: number;
  readonly repeated: boolean;
  readonly slant: SlantScore | null;
}): RhymeScoreDiagnostics {
  const features = {
    commonness: clamp01(commonness),
    exact: exact ? 1 : 0,
    multisyllabic: matchedSyllables >= 2 ? 1 : 0,
    phonetic: clamp01(phonetic),
    repeated: repeated ? 1 : 0,
  };
  const weighted = {
    commonness: features.commonness * RHYME_RANKING_WEIGHTS.commonness,
    exact: features.exact * RHYME_RANKING_WEIGHTS.exact,
    multisyllabic:
      features.multisyllabic * RHYME_RANKING_WEIGHTS.multisyllabic,
    phonetic: features.phonetic * RHYME_RANKING_WEIGHTS.phonetic,
    repetitionPenalty:
      features.repeated * RHYME_RANKING_WEIGHTS.repetition,
  };

  return {
    features,
    slant,
    total: roundScore(
      weighted.phonetic +
        weighted.exact +
        weighted.multisyllabic +
        weighted.commonness -
        weighted.repetitionPenalty,
    ),
    weighted: {
      commonness: roundScore(weighted.commonness),
      exact: roundScore(weighted.exact),
      multisyllabic: roundScore(weighted.multisyllabic),
      phonetic: roundScore(weighted.phonetic),
      repetitionPenalty: roundScore(weighted.repetitionPenalty),
    },
  };
}

function createSuggestion(
  anchor: string,
  candidate: IndexedLexeme,
  pairing: Pairing,
): RhymeSuggestionDiagnostics {
  const word = applyAnchorCasing(candidate.word, anchor);
  const familyKey = pairing.candidate.familyKey;

  return {
    anchorPhones: pairing.anchor.phones,
    anchorSyllables: pairing.anchor.syllables,
    anchorTailStartsAt: pairing.anchor.tailStartsAt,
    candidatePhones: pairing.candidate.phones,
    candidateSyllables: pairing.candidate.syllables,
    candidateTailStartsAt: pairing.candidate.tailStartsAt,
    familyKey,
    id: `rhyme:${pairing.kind}:${candidate.normalizedWord}:${familyKey}`,
    kind: pairing.kind,
    label: createLabel(pairing.kind, pairing.matchedSyllables, word),
    lemma: candidate.lemma,
    matchedSyllables: pairing.matchedSyllables,
    normalizedWord: candidate.normalizedWord,
    score: pairing.diagnostics.total,
    scoreDiagnostics: pairing.diagnostics,
    word,
  };
}

function createLabel(
  kind: RhymeKind,
  matchedSyllables: number,
  word: string,
) {
  if (matchedSyllables >= 2) {
    return `${matchedSyllables}-syllable ${word}`;
  }

  return `${kind === 'exact' ? 'Perfect' : 'Near'} ${word}`;
}

function comparePairings(left: Pairing, right: Pairing) {
  return (
    compareNumbersDescending(left.diagnostics.total, right.diagnostics.total) ||
    compareNumbersDescending(
      left.diagnostics.features.phonetic,
      right.diagnostics.features.phonetic,
    ) ||
    compareNumbersDescending(left.matchedSyllables, right.matchedSyllables) ||
    compareStrings(left.candidate.tailKey, right.candidate.tailKey) ||
    compareStrings(left.candidate.phones.join(' '), right.candidate.phones.join(' ')) ||
    compareStrings(left.anchor.phones.join(' '), right.anchor.phones.join(' '))
  );
}

function compareSuggestions(
  left: RhymeSuggestionDiagnostics,
  right: RhymeSuggestionDiagnostics,
) {
  return (
    compareNumbersDescending(left.score, right.score) ||
    compareNumbersDescending(
      left.scoreDiagnostics.features.phonetic,
      right.scoreDiagnostics.features.phonetic,
    ) ||
    compareNumbersDescending(
      left.scoreDiagnostics.features.exact,
      right.scoreDiagnostics.features.exact,
    ) ||
    compareNumbersDescending(left.matchedSyllables, right.matchedSyllables) ||
    compareNumbersDescending(
      left.scoreDiagnostics.features.commonness,
      right.scoreDiagnostics.features.commonness,
    ) ||
    compareStrings(left.normalizedWord, right.normalizedWord) ||
    compareStrings(left.id, right.id)
  );
}

function buildExcludedSet(words: readonly string[] | undefined) {
  return new Set(
    (words ?? []).map(normalizeRhymeToken).filter((word) => word.length > 0),
  );
}

function buildRepeatedLemmaSet(
  words: readonly string[] | undefined,
  lexemesByWord: ReadonlyMap<string, IndexedLexeme>,
) {
  const lemmas = new Set<string>();

  for (const word of words ?? []) {
    const normalizedWord = normalizeRhymeToken(word);

    if (normalizedWord) {
      lemmas.add(lexemesByWord.get(normalizedWord)?.lemma ?? normalizedWord);
    }
  }

  return lemmas;
}

function stripDiagnostics({
  anchorPhones: _anchorPhones,
  anchorSyllables: _anchorSyllables,
  anchorTailStartsAt: _anchorTailStartsAt,
  candidatePhones: _candidatePhones,
  candidateSyllables: _candidateSyllables,
  candidateTailStartsAt: _candidateTailStartsAt,
  lemma: _lemma,
  scoreDiagnostics: _scoreDiagnostics,
  ...suggestion
}: RhymeSuggestionDiagnostics): RhymeSuggestion {
  return suggestion;
}

function chooseSurfaceWord(existing: string | undefined, candidate: string) {
  if (!existing) {
    return candidate;
  }

  return compareStrings(existing, candidate) <= 0 ? existing : candidate;
}

function applyAnchorCasing(word: string, anchor: string) {
  const letters = anchor.replace(/[^\p{L}]/gu, '');

  if (letters.length > 1 && letters === letters.toLocaleUpperCase()) {
    return word.toLocaleUpperCase();
  }

  const firstLetter = letters.at(0);

  if (firstLetter && firstLetter === firstLetter.toLocaleUpperCase()) {
    return `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`;
  }

  return word;
}

function normalizeMaxResults(maxResults: number | undefined) {
  if (maxResults === undefined) {
    return 12;
  }

  if (!Number.isFinite(maxResults)) {
    return 0;
  }

  return Math.max(0, Math.floor(maxResults));
}

function compareNumbersDescending(left: number, right: number) {
  return right - left;
}

function compareStrings(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number) {
  return Math.round(value * 1000) / 1000;
}
