import { isCuratedEntryEligible as isCuratedEntryEligibleCore } from './suggestionEligibilityCore.cjs';

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
  return isCuratedEntryEligibleCore(normalizedWord, flags, context);
}
