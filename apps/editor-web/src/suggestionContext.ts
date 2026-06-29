export type SuggestionContext = {
  currentLineText: string;
  previousToken: string;
  selectionEmpty: boolean;
  wordBeforeCursor: string;
};

export type SuggestionContextInput = {
  selectionEmpty: boolean;
  textBeforeCursor: string;
};

export function extractSuggestionContext({
  selectionEmpty,
  textBeforeCursor,
}: SuggestionContextInput): SuggestionContext {
  const normalizedText = normalizeLineEndings(textBeforeCursor);
  const currentLineText = getCurrentLineText(normalizedText);
  const wordBeforeCursor = getWordBeforeCursor(currentLineText);
  const previousToken = getPreviousToken(normalizedText, wordBeforeCursor);

  return {
    currentLineText,
    previousToken,
    selectionEmpty,
    wordBeforeCursor,
  };
}

function normalizeLineEndings(text: string) {
  return text.replace(/\r\n?/g, '\n');
}

function getCurrentLineText(textBeforeCursor: string) {
  const lastLineBreakIndex = textBeforeCursor.lastIndexOf('\n');
  return textBeforeCursor.slice(lastLineBreakIndex + 1);
}

function getWordBeforeCursor(currentLineText: string) {
  if (currentLineText.length === 0 || /\s$/.test(currentLineText)) {
    return '';
  }

  return currentLineText.match(/\S+$/)?.[0] ?? '';
}

function getPreviousToken(textBeforeCursor: string, wordBeforeCursor: string) {
  const completedText =
    wordBeforeCursor.length > 0
      ? textBeforeCursor.slice(0, -wordBeforeCursor.length)
      : textBeforeCursor;

  return completedText.trimEnd().match(/\S+$/)?.[0] ?? '';
}
