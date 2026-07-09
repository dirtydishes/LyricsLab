export type ExactRhymeRankInput = {
  id: string;
  word: string;
  normalizedWord: string;
  score?: number | null;
  rankHint?: number | null;
  isPrimaryPronunciation?: boolean;
  matchedCount?: number | null;
};

export type RankedExactRhyme = {
  id: string;
  word: string;
  normalizedWord: string;
  score: number;
  rankHint: number | null;
  isPrimaryPronunciation: boolean;
  matchedCount: number;
  matchKind: 'exact';
  slantSimilarity: null;
};

const EXACT_RHYME_SCORE = 1;

export function rankExactRhymeCandidates(
  candidates: readonly ExactRhymeRankInput[],
): RankedExactRhyme[] {
  return candidates
    .map((candidate, inputIndex) => ({
      inputIndex,
      candidate: toRankedExactRhyme(candidate),
    }))
    .sort((left, right) => {
      const comparison = compareRankedExactRhymes(left.candidate, right.candidate);

      if (comparison !== 0) {
        return comparison;
      }

      return left.inputIndex - right.inputIndex;
    })
    .map(({ candidate }) => candidate);
}

export function compareRankedExactRhymes(
  left: RankedExactRhyme,
  right: RankedExactRhyme,
): number {
  return (
    compareDescending(left.score, right.score) ||
    compareNullableRankHint(left.rankHint, right.rankHint) ||
    compareBooleansDescending(
      left.isPrimaryPronunciation,
      right.isPrimaryPronunciation,
    ) ||
    compareDescending(left.matchedCount, right.matchedCount) ||
    compareCodepoints(left.normalizedWord, right.normalizedWord) ||
    compareCodepoints(left.id, right.id)
  );
}

export function compareCodepoints(left: string, right: string): number {
  const leftCodepoints = Array.from(left);
  const rightCodepoints = Array.from(right);
  const sharedLength = Math.min(leftCodepoints.length, rightCodepoints.length);

  for (let index = 0; index < sharedLength; index += 1) {
    const leftCodepoint = leftCodepoints[index]?.codePointAt(0) ?? 0;
    const rightCodepoint = rightCodepoints[index]?.codePointAt(0) ?? 0;

    if (leftCodepoint !== rightCodepoint) {
      return leftCodepoint - rightCodepoint;
    }
  }

  return leftCodepoints.length - rightCodepoints.length;
}

function toRankedExactRhyme(candidate: ExactRhymeRankInput): RankedExactRhyme {
  return {
    id: candidate.id,
    word: candidate.word,
    normalizedWord: candidate.normalizedWord,
    score: normalizeScore(candidate.score),
    rankHint: normalizeRankHint(candidate.rankHint),
    isPrimaryPronunciation: candidate.isPrimaryPronunciation ?? true,
    matchedCount: normalizeMatchedCount(candidate.matchedCount),
    matchKind: 'exact',
    slantSimilarity: null,
  };
}

function normalizeScore(score: number | null | undefined): number {
  return typeof score === 'number' && Number.isFinite(score)
    ? score
    : EXACT_RHYME_SCORE;
}

function normalizeRankHint(rankHint: number | null | undefined): number | null {
  return typeof rankHint === 'number' && Number.isFinite(rankHint)
    ? rankHint
    : null;
}

function normalizeMatchedCount(matchedCount: number | null | undefined): number {
  return typeof matchedCount === 'number' && Number.isFinite(matchedCount)
    ? Math.max(0, Math.trunc(matchedCount))
    : 1;
}

function compareDescending(left: number, right: number): number {
  return right - left;
}

function compareNullableRankHint(
  left: number | null,
  right: number | null,
): number {
  if (left === null && right === null) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left - right;
}

function compareBooleansDescending(left: boolean, right: boolean): number {
  if (left === right) {
    return 0;
  }

  return left ? -1 : 1;
}
