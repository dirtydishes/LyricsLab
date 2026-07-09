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

  it('uses only the active line for currentLineText and tokens', () => {
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

  it('does not read previousToken from earlier lines', () => {
    expect(
      extractSuggestionContext({
        selectionEmpty: true,
        textBeforeCursor: 'first bar\nflo',
      }),
    ).toEqual({
      currentLineText: 'flo',
      previousToken: '',
      selectionEmpty: true,
      wordBeforeCursor: 'flo',
    });
  });

  it('strips leading and trailing punctuation from tokens while preserving raw case', () => {
    expect(
      extractSuggestionContext({
        selectionEmpty: true,
        textBeforeCursor: 'we can\'t "DREAM!"',
      }),
    ).toEqual({
      currentLineText: 'we can\'t "DREAM!"',
      previousToken: "can't",
      selectionEmpty: true,
      wordBeforeCursor: 'DREAM',
    });
  });

  it('strips punctuation from a completed previous token', () => {
    expect(
      extractSuggestionContext({
        selectionEmpty: true,
        textBeforeCursor: 'cold, ',
      }),
    ).toEqual({
      currentLineText: 'cold, ',
      previousToken: 'cold',
      selectionEmpty: true,
      wordBeforeCursor: '',
    });
  });

  it('passes false only when the editor selection is non-empty', () => {
    expect(
      extractSuggestionContext({
        selectionEmpty: false,
        textBeforeCursor: 'Cold room',
      }),
    ).toEqual({
      currentLineText: 'Cold room',
      previousToken: 'Cold',
      selectionEmpty: false,
      wordBeforeCursor: 'room',
    });
  });

  it('normalizes carriage return and CRLF line endings', () => {
    expect(
      extractSuggestionContext({
        selectionEmpty: true,
        textBeforeCursor: 'first bar\rsecond bar\r\nThird ',
      }),
    ).toEqual({
      currentLineText: 'Third ',
      previousToken: 'Third',
      selectionEmpty: true,
      wordBeforeCursor: '',
    });
  });
});
