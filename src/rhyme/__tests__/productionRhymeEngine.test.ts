/// <reference types="jest" />

import {
  BALANCED_SLANT_THRESHOLD,
  createDiagnosticRhymeEngine,
  createRhymeEngine,
  RHYME_RANKING_WEIGHTS,
  type RhymeLexemeInput,
} from '../createRhymeEngine';
import {
  createFixtureRhymeEngineFromCmu,
} from '../rhymeEngineTesting';

const CORE_FIXTURE: readonly RhymeLexemeInput[] = [
  lexeme('cat', ['K', 'AE1', 'T']),
  lexeme('bat', ['B', 'AE1', 'T'], { commonness: 0 }),
  lexeme('rat', ['R', 'AE1', 'T'], { commonness: 1 }),
  lexeme('cap', ['K', 'AE1', 'P'], { commonness: 1 }),
  lexeme('cab', ['K', 'AE1', 'B'], { commonness: 1 }),
  lexeme('ket', ['K', 'EH1', 'T'], { commonness: 1 }),
  lexeme('happy', ['HH', 'AE1', 'P', 'IY0']),
  lexeme('sappy', ['S', 'AE1', 'P', 'IY0']),
  lexeme('fun', ['F', 'AH1', 'N']),
  lexeme('run', ['R', 'AH1', 'N'], { commonness: 0.2, lemma: 'run' }),
  lexeme('running', ['R', 'AH1', 'N'], {
    commonness: 0.9,
    lemma: 'run',
  }),
];

describe('production rhyme engine', () => {
  it('applies the accepted weights and rejects balanced slants below 0.86', () => {
    const engine = createDiagnosticRhymeEngine(CORE_FIXTURE);
    const suggestions = engine.diagnose({ anchor: 'cat' });
    const exact = suggestionFor(suggestions, 'rat');
    const acceptedSlant = suggestionFor(suggestions, 'cap');

    expect(RHYME_RANKING_WEIGHTS).toEqual({
      commonness: 0.08,
      exact: 0.15,
      multisyllabic: 0.12,
      phonetic: 0.65,
      repetition: 0.12,
    });
    expect(acceptedSlant.scoreDiagnostics.slant).toEqual({
      coda: 0.7,
      phonetic: 0.91,
      stress: 1,
      vowel: 1,
    });
    expect(acceptedSlant.scoreDiagnostics.features.phonetic).toBeGreaterThanOrEqual(
      BALANCED_SLANT_THRESHOLD,
    );
    expect(suggestions.map(({ normalizedWord }) => normalizedWord)).not.toContain(
      'cab',
    );
    expect(exact.score).toBeGreaterThan(acceptedSlant.score);
  });

  it('keeps SUBTLEX commonness to its tie-break-sized contribution', () => {
    const suggestions = createDiagnosticRhymeEngine(CORE_FIXTURE).diagnose({
      anchor: 'cat',
    });

    expect(suggestionFor(suggestions, 'rat').scoreDiagnostics.weighted.commonness).toBe(
      0.08,
    );
    expect(suggestionFor(suggestions, 'bat').scoreDiagnostics.weighted.commonness).toBe(
      0,
    );
    expect(suggestions.indexOf(suggestionFor(suggestions, 'rat'))).toBeLessThan(
      suggestions.indexOf(suggestionFor(suggestions, 'bat')),
    );
    expect(suggestions.indexOf(suggestionFor(suggestions, 'bat'))).toBeLessThan(
      suggestions.indexOf(suggestionFor(suggestions, 'ket')),
    );
  });

  it('preserves alternates and chooses the strongest valid pairing', () => {
    const engine = createFixtureRhymeEngineFromCmu(`
WIND W IH1 N D
WIND(2) W AY1 N D
KIND K AY1 N D
TIN T IH1 N
`);

    expect(engine.diagnose({ anchor: 'wind' })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          anchorPhones: ['W', 'AY1', 'N', 'D'],
          candidatePhones: ['K', 'AY1', 'N', 'D'],
          kind: 'exact',
          normalizedWord: 'kind',
        }),
      ]),
    );
  });

  it('rejects tails that only match after consonants cross syllable boundaries', () => {
    const engine = createDiagnosticRhymeEngine([
      lexeme('meter', ['M', 'IY1', 'T', 'ER0']),
      lexeme('misordered', ['M', 'IY1', 'ER0', 'T']),
    ]);

    expect(engine.diagnose({ anchor: 'meter' })).toEqual([]);
  });

  it('aligns consonant clusters within a syllable instead of comparing offsets', () => {
    const engine = createDiagnosticRhymeEngine([
      lexeme('clustered', ['K', 'AE1', 'S', 'T', 'R']),
      lexeme('shorter', ['SH', 'AE1', 'T', 'R']),
    ]);
    const suggestion = suggestionFor(
      engine.diagnose({ anchor: 'clustered' }),
      'shorter',
    );

    expect(suggestion.scoreDiagnostics.slant).toEqual({
      coda: 0.666667,
      phonetic: 0.9,
      stress: 1,
      vowel: 1,
    });
  });

  it('rejects raw scores below 0.86 instead of rounding them into acceptance', () => {
    const engine = createDiagnosticRhymeEngine([
      lexeme('threshold', [
        'AE1', 'T',
        'AE0', 'T',
        'AE0', 'T',
        'AE0', 'T',
        'AE0', 'T',
      ]),
      lexeme('rounded', [
        'AE2', 'T',
        'AE0', 'T',
        'AE0', 'P',
        'EH0', 'B',
        'EH0',
      ]),
    ]);

    expect(engine.diagnose({ anchor: 'threshold' })).toEqual([]);
  });

  it('reports deterministic syllable spans and multisyllabic tails', () => {
    const suggestion = suggestionFor(
      createDiagnosticRhymeEngine(CORE_FIXTURE).diagnose({
        anchor: 'happy',
      }),
      'sappy',
    );

    expect(suggestion.matchedSyllables).toBe(2);
    expect(suggestion.anchorTailStartsAt).toBe(1);
    expect(suggestion.anchorSyllables).toEqual([
      { end: 2, nucleus: 1, start: 0, stress: 1 },
      { end: 4, nucleus: 3, start: 2, stress: 0 },
    ]);
    expect(suggestion.label).toBe('2-syllable sappy');
  });

  it('groups inflections by lemma while preserving distinct rhyme families', () => {
    const engine = createDiagnosticRhymeEngine(CORE_FIXTURE);
    const lemmaSuggestions = engine.diagnose({ anchor: 'fun' });
    const familySuggestions = engine.diagnose({ anchor: 'cat' });

    expect(
      lemmaSuggestions.filter(({ lemma }) => lemma === 'run'),
    ).toHaveLength(1);
    expect(suggestionFor(lemmaSuggestions, 'running').lemma).toBe('run');
    expect(
      new Set(familySuggestions.map(({ familyKey }) => familyKey)).size,
    ).toBeGreaterThan(1);
  });

  it('honors exclusions and applies repetition only from current-song tokens', () => {
    const engine = createDiagnosticRhymeEngine(CORE_FIXTURE);
    const repeated = engine.diagnose({
      anchor: 'cat',
      excludedWords: ['cap'],
      sourceTokens: ['rat'],
    });

    expect(repeated.map(({ normalizedWord }) => normalizedWord)).not.toContain(
      'cap',
    );
    expect(suggestionFor(repeated, 'rat').scoreDiagnostics.weighted.repetitionPenalty).toBe(
      0.12,
    );
    expect(repeated.indexOf(suggestionFor(repeated, 'bat'))).toBeLessThan(
      repeated.indexOf(suggestionFor(repeated, 'rat')),
    );
  });

  it('excludes an entire lemma when any indexed inflection is excluded', () => {
    const suggestions = createDiagnosticRhymeEngine(CORE_FIXTURE).diagnose({
      anchor: 'fun',
      excludedWords: ['running'],
    });

    expect(suggestions.map(({ lemma }) => lemma)).not.toContain('run');
  });

  it('keeps diagnostics out of the production engine runtime surface', () => {
    expect(Object.keys(createRhymeEngine(CORE_FIXTURE))).toEqual([
      'suggest',
    ]);
  });

  it('leaves omitted result limits uncapped for caller-side filtering', () => {
    const fixture = [
      lexeme('anchor', ['AE1', 'T']),
      ...Array.from({ length: 13 }, (_, index) =>
        lexeme(`candidate${index}`, ['AE1', 'T']),
      ),
    ];
    const engine = createRhymeEngine(fixture);

    expect(engine.suggest({ anchor: 'anchor' })).toHaveLength(13);
    expect(engine.suggest({ anchor: 'anchor', maxResults: 3 })).toHaveLength(3);
  });

  it('normalizes invalid lemma and commonness metadata to safe defaults', () => {
    const engine = createDiagnosticRhymeEngine([
      lexeme('cat', ['K', 'AE1', 'T']),
      lexeme('bat', ['B', 'AE1', 'T'], {
        commonness: Number.NaN,
        lemma: '!!!',
      }),
      lexeme('rat', ['R', 'AE1', 'T'], { lemma: '???' }),
    ]);
    const suggestions = engine.diagnose({ anchor: 'cat' });

    expect(suggestions.map(({ normalizedWord }) => normalizedWord)).toEqual([
      'bat',
      'rat',
    ]);
    expect(suggestions.map(({ lemma }) => lemma)).toEqual(['bat', 'rat']);
    expect(suggestions.map(({ score }) => score)).toEqual([0.8, 0.8]);
  });

  it('keeps stable IDs, casing, and ordering across repeated and reordered input', () => {
    const forward = createRhymeEngine(CORE_FIXTURE);
    const reverse = createRhymeEngine([...CORE_FIXTURE].reverse());
    const query = { anchor: 'CAT' } as const;

    expect(forward.suggest(query)).toEqual(forward.suggest(query));
    expect(reverse.suggest(query)).toEqual(forward.suggest(query));
    expect(forward.suggest(query)[0]).toEqual(
      expect.objectContaining({
        id: 'rhyme:exact:rat',
        word: expect.stringMatching(/^[A-Z]+$/u),
      }),
    );
    expect(forward.suggest({ anchor: 'Cat' })[0]?.word).toBe('Rat');
    expect(forward.suggest({ anchor: 'CaT' })[0]?.word).toBe('rat');
  });

  it('keeps pairing and IDs stable when pronunciation order is reversed', () => {
    const lexemes: readonly RhymeLexemeInput[] = [
      {
        pronunciations: [
          { phones: ['K', 'AE1', 'T'] },
          { phones: ['K', 'EH1', 'T'] },
        ],
        word: 'cat',
      },
      {
        pronunciations: [
          { phones: ['B', 'EH1', 'T'] },
          { phones: ['B', 'AE1', 'T'] },
        ],
        word: 'bet',
      },
    ];
    const reversedPronunciations = lexemes.map((entry) => ({
      ...entry,
      pronunciations: [...entry.pronunciations].reverse(),
    }));

    expect(createRhymeEngine(reversedPronunciations).suggest({ anchor: 'cat' }))
      .toEqual(createRhymeEngine(lexemes).suggest({ anchor: 'cat' }));
  });
});

function lexeme(
  word: string,
  phones: readonly string[],
  metadata: Pick<RhymeLexemeInput, 'commonness' | 'lemma'> = {},
): RhymeLexemeInput {
  return {
    ...metadata,
    pronunciations: [{ phones }],
    word,
  };
}

function suggestionFor<
  T extends { readonly normalizedWord: string },
>(suggestions: readonly T[], normalizedWord: string): T {
  const suggestion = suggestions.find(
    (candidate) => candidate.normalizedWord === normalizedWord,
  );

  if (!suggestion) {
    throw new Error(`missing suggestion: ${normalizedWord}`);
  }

  return suggestion;
}
