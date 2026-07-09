import { normalizeLyricToken } from './normalize';

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

  return {
    alternate,
    displayWord,
    normalizedWord: normalizeCmuWord(displayWord),
    phonemes,
  };
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
