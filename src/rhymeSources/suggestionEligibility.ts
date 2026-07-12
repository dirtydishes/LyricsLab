export type CuratedSuggestionFlags = {
  readonly properNoun: boolean;
  readonly safetyBlocked: boolean;
};

export type CuratedSuggestionContext =
  | { readonly mode: 'anchor' }
  | { readonly activePrefix: string; readonly mode: 'suggestion' };

/**
 * Applies the Phase 04 editorial eligibility policy without knowing about the
 * binary artifact, loader, editor, or ranking implementation.
 */
export function isCuratedEntryEligible(
  normalizedWord: string,
  flags: CuratedSuggestionFlags,
  context: CuratedSuggestionContext,
): boolean {
  if (context.mode === 'anchor') {
    return true;
  }

  if (flags.safetyBlocked) {
    return false;
  }

  if (!flags.properNoun) {
    return true;
  }

  const prefix = normalizePrefix(context.activePrefix);
  return prefix.length > 0 && normalizedWord.startsWith(prefix);
}

function normalizePrefix(prefix: string): string {
  return prefix
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u02BC\uFF07]/gu, "'")
    .trim()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}
