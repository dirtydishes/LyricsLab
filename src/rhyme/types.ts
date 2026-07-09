export type RawLyricToken = string;

export type NormalizedLyricToken = string;

export type ArpabetStress = 0 | 1 | 2;

export type ArpabetPhone = {
  readonly symbol: string;
  readonly stress: ArpabetStress | null;
};

export type CmuPronunciation = {
  readonly alternate: number | null;
  readonly phones: readonly ArpabetPhone[];
};

export type RhymeLexeme = {
  readonly displayWord: string;
  readonly normalizedWord: NormalizedLyricToken;
  readonly pronunciations: readonly CmuPronunciation[];
};

export type RhymeTail = {
  readonly key: string;
  readonly phones: readonly ArpabetPhone[];
  readonly stressedPhoneIndex: number;
};

export type ExactRhymeCandidate = {
  readonly id: string;
  readonly word: string;
  readonly normalizedWord: NormalizedLyricToken;
  readonly pronunciation: CmuPronunciation;
  readonly rhymeTail: RhymeTail;
  readonly matchKind: 'exact';
  readonly slantSimilarity: null;
};

export type RhymeIndex = {
  readonly lexemesByToken: ReadonlyMap<NormalizedLyricToken, RhymeLexeme>;
  readonly lexemesByTail: ReadonlyMap<string, readonly RhymeLexeme[]>;
};

export type RhymeQuery = {
  readonly anchorToken: RawLyricToken;
  readonly excludedTokens?: readonly RawLyricToken[];
  readonly limit?: number;
};
