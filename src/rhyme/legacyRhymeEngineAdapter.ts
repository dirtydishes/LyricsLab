import type { RhymeEngine, RhymeSuggestion } from './RhymeEngine';
import {
  findRhymeCandidates,
  type RhymeIndex,
} from './rhymeIndex';

export type LegacyRhymeIndexSource = RhymeIndex | (() => RhymeIndex);

export function createLegacyRhymeEngineAdapter(
  indexSource: LegacyRhymeIndexSource,
): RhymeEngine {
  return {
    suggest(query) {
      const index =
        typeof indexSource === 'function' ? indexSource() : indexSource;

      return findRhymeCandidates(index, {
        anchor: query.anchor,
        candidateKinds: ['exact', 'slant'],
        excludedWords: query.excludedWords,
        maxResults: query.maxResults,
        sourceTokens: query.sourceTokens,
      }).map(toRhymeSuggestion);
    },
  };
}

function toRhymeSuggestion(
  candidate: ReturnType<typeof findRhymeCandidates>[number],
): RhymeSuggestion {
  const label =
    candidate.matchedSyllables >= 2
      ? `${candidate.matchedSyllables}-syllable ${candidate.word}`
      : `${candidate.kind === 'exact' ? 'Perfect' : 'Near'} ${candidate.word}`;

  return {
    familyKey: candidate.rhymeTailKey,
    id: candidate.id,
    kind: candidate.kind,
    label,
    matchedSyllables: candidate.matchedSyllables,
    normalizedWord: candidate.normalizedWord,
    score: candidate.score,
    word: candidate.word,
  };
}
