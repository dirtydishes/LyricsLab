/// <reference types="jest" />

import { isCuratedEntryEligible } from '../suggestionEligibility';

describe('curated source eligibility', () => {
  test('allows ordinary entries, including ordinary profanity', () => {
    expect(isCuratedEntryEligible('ordinary-profanity', {
      properNoun: false,
      safetyBlocked: false,
    }, { mode: 'suggestion', activePrefix: '' })).toBe(true);
  });

  test('keeps a high-risk entry analyzable but never unsolicited', () => {
    const flags = { properNoun: false, safetyBlocked: true };

    expect(isCuratedEntryEligible('blocked-term', flags, {
      mode: 'anchor',
    })).toBe(true);
    expect(isCuratedEntryEligible('blocked-term', flags, {
      mode: 'suggestion',
      activePrefix: 'blocked',
    })).toBe(false);
  });

  test('requires a normalized explicit prefix for proper names', () => {
    const flags = { properNoun: true, safetyBlocked: false };

    expect(isCuratedEntryEligible('brooklyn', flags, {
      mode: 'suggestion',
      activePrefix: '',
    })).toBe(false);
    expect(isCuratedEntryEligible('brooklyn', flags, {
      mode: 'suggestion',
      activePrefix: "  'BROO",
    })).toBe(true);
    expect(isCuratedEntryEligible('brooklyn', flags, {
      mode: 'suggestion',
      activePrefix: 'bron',
    })).toBe(false);
    expect(isCuratedEntryEligible('brooklyn', flags, {
      mode: 'anchor',
    })).toBe(true);
  });
});
