/// <reference types="jest" />

import { getSuggestionPresentation } from '../suggestionPresentation';

describe('suggestion presentation', () => {
  it.each([
    [{ id: '1', word: 'flow' }, { label: 'Prompt', role: 'prompt' }],
    [
      { id: '2', label: 'Perfect flow', word: 'flow' },
      { label: 'Perfect', role: 'perfect' },
    ],
    [
      { id: '3', label: 'Near glow', word: 'glow' },
      { label: 'Near', role: 'near' },
    ],
    [
      { id: '4', label: '3 syllable perfect tomorrow', word: 'tomorrow' },
      { label: '3-syllable', role: 'perfect' },
    ],
  ] as const)('maps %o to an accessible role and discreet label', (suggestion, expected) => {
    expect(getSuggestionPresentation(suggestion)).toEqual(expected);
  });
});
