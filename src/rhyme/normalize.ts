import { normalizeRhymeToken as normalizeRhymeTokenCore } from './normalizeCore.cjs';

export type RawLyricToken = string;

export type NormalizedLyricToken = string;

export function normalizeLyricToken(
  token: RawLyricToken,
): NormalizedLyricToken {
  return normalizeRhymeTokenCore(token);
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
