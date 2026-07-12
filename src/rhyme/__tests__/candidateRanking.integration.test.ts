/// <reference types="jest" />

import {
  createRhymeIndex,
  findExactRhymeCandidates,
  findRhymeCandidates,
  parseCmuDictionary,
  type RhymeCandidate,
} from '../index';

const CANDIDATE_FIXTURE = `
;;; intentionally unsorted to prove ranking does not depend on fixture order
WHITE W AY1 T
LIGHT L AY1 T
LIGHT(2) L AY1 T
NIGHT N AY1 T
BRIGHT B R AY1 T
SIGHT S AY1 T
MIGHT M AY1 T
RIGHT R AY1 T
FIGHT F AY1 T
TIGHT T AY1 T
BYTE B AY1 T
BITE B AY1 T
SPITE S P AY1 T

TIME T AY1 M
LINE L AY1 N
AND AH0 N D
SHH SH
`;

const MIXED_CANDIDATE_FIXTURE = `
;;; intentionally tiny fixture for Phase 06 mixed exact/slant ranking
TIME T AY1 M
RHYME R AY1 M
CLIMB K L AY1 M
DIME D AY1 M
LINE L AY1 N
MIND M AY1 N D
TIDE T AY1 D
FRAME F R EY1 M
TEAM T IY1 M

READY R EH1 D IY0
STEADY S T EH1 D IY0
CONFETTI K AH0 N F EH1 T IY0
CITY S IH1 T IY0
PRETTY P R IH1 T IY0
`;

const fixtureIndex = createRhymeIndex(parseCmuDictionary(CANDIDATE_FIXTURE));
const mixedFixtureIndex = createRhymeIndex(
  parseCmuDictionary(MIXED_CANDIDATE_FIXTURE),
);

function exactRhymes(
  anchor: string,
  options: {
    excludedWords?: readonly string[];
    maxResults?: number;
  } = {},
) {
  return findExactRhymeCandidates(fixtureIndex, {
    anchor,
    excludedWords: options.excludedWords,
    maxResults: options.maxResults ?? 20,
  });
}

function wordsFor(
  anchor: string,
  options: Parameters<typeof exactRhymes>[1] = {},
) {
  return exactRhymes(anchor, options).map((candidate) => candidate.word);
}

function mixedRhymes(
  anchor: string,
  options: {
    excludedWords?: readonly string[];
    maxResults?: number;
    minSlantSimilarity?: number;
    sourceTokens?: readonly string[];
  } = {},
) {
  return findRhymeCandidates(mixedFixtureIndex, {
    anchor,
    excludedWords: options.excludedWords,
    maxResults: options.maxResults ?? 20,
    minSlantSimilarity: options.minSlantSimilarity,
    sourceTokens: options.sourceTokens,
  });
}

function mixedWordsFor(
  anchor: string,
  options: Parameters<typeof mixedRhymes>[1] = {},
) {
  return mixedRhymes(anchor, options).map((candidate) => candidate.word);
}

function candidateByWord(
  candidates: readonly RhymeCandidate[],
  word: string,
): RhymeCandidate {
  const candidate = candidates.find(
    (entry) => entry.normalizedWord === word,
  );

  expect(candidate).toBeDefined();

  return candidate as RhymeCandidate;
}

function positionOf(words: readonly string[], word: string) {
  const index = words.indexOf(word);

  expect(index).toBeGreaterThanOrEqual(0);

  return index;
}

describe('rhyme candidate generation and ranking integration', () => {
  it('dedupes alternate pronunciations to one public candidate per target word', () => {
    const lightResults = exactRhymes('bright').filter(
      (candidate) => candidate.normalizedWord === 'light',
    );

    expect(lightResults).toEqual([
      {
        id: 'rhyme:exact:light',
        kind: 'exact',
        normalizedWord: 'light',
        rhymeTailKey: 'AY1 T',
        score: 1,
        slantSimilarity: null,
        word: 'light',
      },
    ]);
  });

  it('excludes the anchor source word and caller-provided excluded words after normalization', () => {
    expect(
      wordsFor('Light!', {
        excludedWords: ['night,', 'WHITE'],
      }),
    ).toEqual([
      'bite',
      'bright',
      'byte',
      'fight',
      'might',
      'right',
      'sight',
      'spite',
      'tight',
    ]);
  });

  it('returns no candidates for empty, out-of-vocabulary, or no-tail anchors', () => {
    expect(wordsFor('')).toEqual([]);
    expect(wordsFor('not-in-fixture')).toEqual([]);
    expect(wordsFor('and')).toEqual([]);
    expect(wordsFor('shh')).toEqual([]);
  });

  it('ranks exact candidates deterministically by normalized word codepoint order', () => {
    expect(wordsFor('bright')).toEqual([
      'bite',
      'byte',
      'fight',
      'light',
      'might',
      'night',
      'right',
      'sight',
      'spite',
      'tight',
      'white',
    ]);
  });

  it('respects maxResults after source exclusion, dedupe, and ranking', () => {
    expect(
      wordsFor('bright', {
        maxResults: 4,
      }),
    ).toEqual(['bite', 'byte', 'fight', 'light']);

    expect(
      wordsFor('bright', {
        maxResults: 0,
      }),
    ).toEqual([]);
  });

  it('keeps the exact-only API shape stable beside Phase 06 mixed ranking metadata', () => {
    const candidates = exactRhymes('bright', { maxResults: 1 });

    expect(Object.keys(candidates[0] ?? {}).sort()).toEqual([
      'id',
      'kind',
      'normalizedWord',
      'rhymeTailKey',
      'score',
      'slantSimilarity',
      'word',
    ]);
    expect(candidates).toStrictEqual([
      {
        id: 'rhyme:exact:bite',
        kind: 'exact',
        normalizedWord: 'bite',
        rhymeTailKey: 'AY1 T',
        score: 1,
        slantSimilarity: null,
        word: 'bite',
      },
    ]);
  });

  it('returns exact and slant candidates from the mixed Phase 06 API', () => {
    const candidates = mixedRhymes('time');

    expect(candidates.slice(0, 3)).toEqual([
      expect.objectContaining({
        kind: 'exact',
        matchedSyllables: 1,
        normalizedWord: 'climb',
        repetitionPenalty: 0,
        slantSimilarity: null,
        stressCompatibility: 1,
        word: 'climb',
      }),
      expect.objectContaining({
        kind: 'exact',
        matchedSyllables: 1,
        normalizedWord: 'dime',
        repetitionPenalty: 0,
        slantSimilarity: null,
        stressCompatibility: 1,
        word: 'dime',
      }),
      expect.objectContaining({
        kind: 'exact',
        matchedSyllables: 1,
        normalizedWord: 'rhyme',
        repetitionPenalty: 0,
        slantSimilarity: null,
        stressCompatibility: 1,
        word: 'rhyme',
      }),
    ]);
    expect(candidates.some((candidate) => candidate.kind === 'slant')).toBe(
      true,
    );
  });

  it('orders balanced slant candidates by explainable phonetic closeness', () => {
    const candidates = mixedRhymes('time', {
      minSlantSimilarity: 0,
    });
    const words = candidates.map((candidate) => candidate.word);
    const line = candidateByWord(candidates, 'line');
    const frame = candidateByWord(candidates, 'frame');
    const team = candidateByWord(candidates, 'team');

    expect(positionOf(words, 'line')).toBeLessThan(positionOf(words, 'frame'));
    expect(positionOf(words, 'mind')).toBeLessThan(positionOf(words, 'team'));
    expect(positionOf(words, 'tide')).toBeLessThan(positionOf(words, 'team'));
    expect(line).toEqual(
      expect.objectContaining({
        id: 'rhyme:slant:line',
        kind: 'slant',
        matchedSyllables: 1,
        normalizedWord: 'line',
        repetitionPenalty: 0,
        rhymeTailKey: 'AY1 N',
        stressCompatibility: 1,
        word: 'line',
      }),
    );
    expect(numericFeature(frame, 'matchedSyllables')).toBe(0);
    expect(line.score).toBeGreaterThan(frame.score);
    expect(line.slantSimilarity).toEqual(expect.any(Number));
    expect(line.slantSimilarity).toBeGreaterThan(frame.slantSimilarity ?? 0);
    expect(team.slantSimilarity).toEqual(expect.any(Number));
    expect(candidateByWord(candidates, 'rhyme').score).toBeGreaterThan(
      line.score,
    );
  });

  it('accounts for matched syllables and stress compatibility in mixed ranking', () => {
    const candidates = mixedRhymes('ready', {
      minSlantSimilarity: 0,
    });
    const steady = candidateByWord(candidates, 'steady');
    const confetti = candidateByWord(candidates, 'confetti');
    const city = candidateByWord(candidates, 'city');

    expect(steady).toEqual(
      expect.objectContaining({
        kind: 'exact',
        matchedSyllables: 2,
        slantSimilarity: null,
        stressCompatibility: 1,
        word: 'steady',
      }),
    );
    expect(confetti).toEqual(
      expect.objectContaining({
        kind: 'slant',
        matchedSyllables: 2,
        stressCompatibility: 1,
        word: 'confetti',
      }),
    );
    expect(numericFeature(city, 'matchedSyllables')).toBe(1);
    expect(confetti.score).toBeGreaterThan(city.score);
  });

  it('demotes repeated source tokens without hard-excluding them from mixed ranking', () => {
    const candidates = mixedRhymes('time', {
      sourceTokens: ['rhyme', 'line'],
    });
    const words = candidates.map((candidate) => candidate.word);
    const dime = candidateByWord(candidates, 'dime');
    const rhyme = candidateByWord(candidates, 'rhyme');
    const line = candidateByWord(candidates, 'line');
    const mind = candidateByWord(candidates, 'mind');

    expect(numericFeature(dime, 'repetitionPenalty')).toBe(0);
    expect(numericFeature(mind, 'repetitionPenalty')).toBe(0);
    expect(numericFeature(rhyme, 'repetitionPenalty')).toBeGreaterThan(0);
    expect(numericFeature(line, 'repetitionPenalty')).toBeGreaterThan(0);
    expect(positionOf(words, 'rhyme')).toBeGreaterThan(
      positionOf(words, 'dime'),
    );
    expect(positionOf(words, 'line')).toBeGreaterThan(
      positionOf(words, 'mind'),
    );
  });

  it('hard-excludes normalized words and applies maxResults after mixed ranking', () => {
    const words = mixedWordsFor('time', {
      excludedWords: ['RHYME!', 'line'],
      maxResults: 3,
    });

    expect(words).toHaveLength(3);
    expect(words).toEqual(expect.arrayContaining(['climb', 'dime']));
    expect(words).not.toContain('rhyme');
    expect(words).not.toContain('line');

    expect(
      mixedWordsFor('time', {
        maxResults: 0,
      }),
    ).toEqual([]);
  });
});

function numericFeature(candidate: RhymeCandidate, key: string): number {
  const value = (candidate as Record<string, unknown>)[key];

  expect(value).toEqual(expect.any(Number));

  return value as number;
}
