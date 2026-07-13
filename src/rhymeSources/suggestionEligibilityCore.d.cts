export function isCuratedEntryEligible(
  normalizedWord: string,
  flags: {
    readonly properNoun: boolean;
    readonly safetyBlocked: boolean;
  },
  context:
    | { readonly mode: 'anchor' }
    | { readonly activePrefix: string; readonly mode: 'suggestion' },
): boolean;
