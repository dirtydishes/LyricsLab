import { normalizeLyricToken } from './normalize';

const CMU_VOWELS = new Set([
  'AA',
  'AE',
  'AH',
  'AO',
  'AW',
  'AY',
  'EH',
  'ER',
  'EY',
  'IH',
  'IY',
  'OW',
  'OY',
  'UH',
  'UW',
]);

const CMU_CONSONANTS = new Set([
  'B',
  'CH',
  'D',
  'DH',
  'F',
  'G',
  'HH',
  'JH',
  'K',
  'L',
  'M',
  'N',
  'NG',
  'P',
  'R',
  'S',
  'SH',
  'T',
  'TH',
  'V',
  'W',
  'Y',
  'Z',
  'ZH',
]);

export type CmuPronunciationEntry = {
  alternate: number | null;
  displayWord: string;
  normalizedWord: string;
  phonemes: string[];
};

export function parseCmuDictionary(source: string): CmuPronunciationEntry[] {
  const entries: CmuPronunciationEntry[] = [];

  for (const line of source.split(/\r\n|\n|\r/)) {
    const entry = parseCmuLine(line);

    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

export function parseCmuLine(line: string): CmuPronunciationEntry | null {
  const entryText = stripInlineComment(line).trim();

  if (!entryText || entryText.startsWith(';;;')) {
    return null;
  }

  const [headword, ...phonemes] = entryText.split(/\s+/);

  if (!headword || phonemes.length === 0) {
    return null;
  }

  const { alternate, displayWord } = parseCmuHeadword(headword);
  const normalizedWord = normalizeCmuWord(displayWord);

  if (
    !normalizedWord ||
    phonemes.some((phoneme) => !isValidCmuPhoneme(phoneme))
  ) {
    return null;
  }

  return {
    alternate,
    displayWord,
    normalizedWord,
    phonemes,
  };
}

function isValidCmuPhoneme(phoneme: string) {
  const match = phoneme.match(/^([A-Z]+)([012])?$/u);

  if (!match) {
    return false;
  }

  const [, phone, stress] = match;

  return phone !== undefined &&
    (CMU_VOWELS.has(phone)
      ? stress !== undefined
      : CMU_CONSONANTS.has(phone) && stress === undefined);
}

export function normalizeCmuWord(word: string) {
  return normalizeLyricToken(parseCmuHeadword(word.trim()).displayWord);
}

function parseCmuHeadword(headword: string) {
  const alternateMatch = headword.match(/^(.*)\((\d+)\)$/);

  if (!alternateMatch) {
    return {
      alternate: null,
      displayWord: headword,
    };
  }

  return {
    alternate: Number(alternateMatch[2]),
    displayWord: alternateMatch[1],
  };
}

function stripInlineComment(line: string) {
  const commentStart = line.indexOf('#');

  return commentStart === -1 ? line : line.slice(0, commentStart);
}
