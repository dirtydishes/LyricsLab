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
  const { previousToken, wordBeforeCursor } =
    getLineLocalTokens(currentLineText);

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

function getLineLocalTokens(currentLineText: string) {
  const rawTokens = currentLineText.match(/\S+/g) ?? [];
  const hasWordBeforeCursor =
    currentLineText.length > 0 && !/\s$/.test(currentLineText);
  const wordBeforeCursor = hasWordBeforeCursor
    ? cleanToken(rawTokens.at(-1) ?? '')
    : '';
  const completedTokens = hasWordBeforeCursor
    ? rawTokens.slice(0, -1)
    : rawTokens;

  return {
    previousToken: getLastCleanToken(completedTokens),
    wordBeforeCursor,
  };
}

function getLastCleanToken(tokens: readonly string[]) {
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = cleanToken(tokens[index]);

    if (token) {
      return token;
    }
  }

  return '';
}

function cleanToken(token: string) {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}
