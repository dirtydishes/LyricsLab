export type RawLyricToken = string;

export type NormalizedLyricToken = string;

const CURLY_APOSTROPHE_PATTERN = /[\u2018\u2019\u201A\u201B\u02BC\uFF07]/gu;
const TOKEN_EDGE_PATTERN = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

export function normalizeLyricToken(
  token: RawLyricToken,
): NormalizedLyricToken {
  return token
    .normalize('NFC')
    .toLowerCase()
    .replace(CURLY_APOSTROPHE_PATTERN, "'")
    .trim()
    .replace(TOKEN_EDGE_PATTERN, '');
}

export const normalizeRhymeToken = normalizeLyricToken;

export function normalizeLyricTokens(
  tokens: readonly RawLyricToken[],
): NormalizedLyricToken[] {
  return tokens.map(normalizeLyricToken).filter(isNonEmptyToken);
}

export function isNonEmptyToken(
  token: NormalizedLyricToken,
): token is NormalizedLyricToken {
  return token.length > 0;
}
