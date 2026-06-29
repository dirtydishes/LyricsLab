import { describe, expect, it } from 'vitest';

import { extractSuggestionContext } from './suggestionContext';

describe('extractSuggestionContext', () => {
  it('returns the current partial word and previous completed token', () => {
    expect(
      extractSuggestionContext({
        selectionEmpty: true,
        textBeforeCursor: 'cold room full of flo',
      }),
    ).toEqual({
      currentLineText: 'cold room full of flo',
      previousToken: 'of',
      selectionEmpty: true,
      wordBeforeCursor: 'flo',
    });
  });

  it('treats trailing whitespace as no active word', () => {
    expect(
      extractSuggestionContext({
        selectionEmpty: true,
        textBeforeCursor: 'cold room ',
      }),
    ).toEqual({
      currentLineText: 'cold room ',
      previousToken: 'room',
      selectionEmpty: true,
      wordBeforeCursor: '',
    });
  });

  it('uses only the active line for currentLineText', () => {
    expect(
      extractSuggestionContext({
        selectionEmpty: false,
        textBeforeCursor: 'first bar\nsecond bar dr',
      }),
    ).toEqual({
      currentLineText: 'second bar dr',
      previousToken: 'bar',
      selectionEmpty: false,
      wordBeforeCursor: 'dr',
    });
  });

  it('normalizes carriage return line endings', () => {
    expect(
      extractSuggestionContext({
        selectionEmpty: true,
        textBeforeCursor: 'first bar\r\nsecond ',
      }),
    ).toEqual({
      currentLineText: 'second ',
      previousToken: 'second',
      selectionEmpty: true,
      wordBeforeCursor: '',
    });
  });
});
