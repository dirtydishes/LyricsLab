export const RHYME_DATA_FORMAT_VERSION = 2;
export const RHYME_DATA_HEADER_BYTES = 96;
export const RHYME_DATA_DIRECTORY_ENTRY_BYTES = 24;
export const RHYME_DATA_MAX_PHONES_PER_PRONUNCIATION = 64;
export const RHYME_DATA_MAX_PRONUNCIATIONS_PER_WORD = 32;
export const RHYME_DATA_MAX_STRING_BYTES = 4096;
export const RHYME_DATA_MAGIC = [76, 76, 82, 72, 89, 77, 69, 0] as const;

export const RhymeDataSection = {
  metadata: 1,
  stringBytes: 2,
  stringIndex: 3,
  phones: 4,
  words: 5,
  pronunciations: 6,
  phoneIds: 7,
  exactIndex: 8,
  slantIndex: 9,
  ranks: 10,
  flags: 11,
  sources: 12,
} as const;

export const RHYME_DATA_SECTION_WIDTHS: Readonly<Record<number, number>> = {
  [RhymeDataSection.metadata]: 16,
  [RhymeDataSection.stringBytes]: 1,
  [RhymeDataSection.stringIndex]: 8,
  [RhymeDataSection.phones]: 4,
  [RhymeDataSection.words]: 24,
  [RhymeDataSection.pronunciations]: 24,
  [RhymeDataSection.phoneIds]: 4,
  [RhymeDataSection.exactIndex]: 12,
  [RhymeDataSection.slantIndex]: 12,
  [RhymeDataSection.ranks]: 8,
  [RhymeDataSection.flags]: 4,
  [RhymeDataSection.sources]: 28,
};

export const RHYME_DATA_REQUIRED_SECTIONS = Object.freeze(
  Object.values(RhymeDataSection),
);

export const RhymeDataWordFlag = {
  properNoun: 4,
  rap: 1,
  safetyBlocked: 2,
} as const;

export type RhymeDataSectionDescriptor = {
  readonly count: number;
  readonly id: number;
  readonly length: number;
  readonly offset: number;
  readonly width: number;
};
