export const MAGIC = Buffer.from('LLRHYME\0', 'ascii');
export const FORMAT_VERSION = 1;
export const HEADER_BYTES = 96;
export const DIRECTORY_ENTRY_BYTES = 24;

export const SECTION = Object.freeze({
  METADATA: 1,
  STRING_BYTES: 2,
  STRING_INDEX: 3,
  PHONES: 4,
  WORDS: 5,
  PRONUNCIATIONS: 6,
  PHONE_IDS: 7,
  EXACT_INDEX: 8,
  SLANT_INDEX: 9,
  RANKS: 10,
  FLAGS: 11,
  SOURCES: 12,
});

export const SECTION_WIDTH = Object.freeze({
  [SECTION.METADATA]: 16,
  [SECTION.STRING_BYTES]: 1,
  [SECTION.STRING_INDEX]: 8,
  [SECTION.PHONES]: 4,
  [SECTION.WORDS]: 24,
  [SECTION.PRONUNCIATIONS]: 24,
  [SECTION.PHONE_IDS]: 4,
  [SECTION.EXACT_INDEX]: 12,
  [SECTION.SLANT_INDEX]: 12,
  [SECTION.RANKS]: 8,
  [SECTION.FLAGS]: 4,
  [SECTION.SOURCES]: 28,
});

export const WORD_FLAG = Object.freeze({
  RAP: 1,
  SAFETY_BLOCKED: 2,
  PROPER_NOUN: 4,
});

export function align4(value) {
  return (value + 3) & ~3;
}

export function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
