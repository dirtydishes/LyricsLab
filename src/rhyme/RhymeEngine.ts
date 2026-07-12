export type RhymeKind = 'exact' | 'slant';

export type RhymeEngineQuery = {
  readonly anchor: string;
  readonly excludedWords?: readonly string[];
  readonly maxResults?: number;
  readonly sourceTokens?: readonly string[];
};

export type RhymeSuggestion = {
  readonly familyKey: string;
  readonly id: string;
  readonly kind: RhymeKind;
  readonly label: string;
  readonly matchedSyllables: number;
  readonly normalizedWord: string;
  readonly score: number;
  readonly word: string;
};

export type RhymeEngine = {
  suggest(query: RhymeEngineQuery): readonly RhymeSuggestion[];
};
