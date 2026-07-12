export type SuggestionInsertionInput = {
  selectionEmpty: boolean;
  selectedText?: string;
  textAfterSelection: string;
  textBeforeCursor: string;
  word: string;
};

export type SuggestionInsertion = {
  consumeAfter: number;
  consumeBefore: number;
  text: string;
};

const ACTIVE_PREFIX_PATTERN = /[\p{L}\p{N}](?:[\p{L}\p{N}'’-]*[\p{L}\p{N}])?$/u;

export function createSuggestionInsertion({
  selectionEmpty,
  selectedText = '',
  textAfterSelection,
  textBeforeCursor,
  word,
}: SuggestionInsertionInput): SuggestionInsertion | null {
  const normalizedWord = word.trim();

  if (!normalizedWord) {
    return null;
  }

  const activePrefix = selectionEmpty
    ? textBeforeCursor.match(ACTIVE_PREFIX_PATTERN)?.[0] ?? ''
    : selectedText;
  const followingWhitespace = textAfterSelection.match(/^[\t ]+/u)?.[0] ?? '';

  return {
    consumeAfter: followingWhitespace.length,
    consumeBefore: selectionEmpty ? activePrefix.length : 0,
    text: `${applyPrefixCasing(normalizedWord, activePrefix)} `,
  };
}

export function applyPrefixCasing(word: string, prefix: string) {
  const letters = prefix.replace(/[^\p{L}]/gu, '');

  if (letters.length > 1 && letters === letters.toLocaleUpperCase()) {
    return word.toLocaleUpperCase();
  }

  const firstLetter = letters.at(0);
  const remainingLetters = letters.slice(1);

  if (
    firstLetter &&
    firstLetter === firstLetter.toLocaleUpperCase() &&
    remainingLetters === remainingLetters.toLocaleLowerCase()
  ) {
    return `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`;
  }

  return word;
}
