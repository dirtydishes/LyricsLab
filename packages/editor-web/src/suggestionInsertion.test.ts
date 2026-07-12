import { describe, expect, it } from 'vitest';

import {
  applyPrefixCasing,
  createSuggestionInsertion,
} from './suggestionInsertion';

describe('createSuggestionInsertion', () => {
  it('replaces the active prefix and appends exactly one trailing space', () => {
    expect(
      createSuggestionInsertion({
        selectionEmpty: true,
        textAfterSelection: '',
        textBeforeCursor: 'write the fl',
        word: 'flow',
      }),
    ).toEqual({ consumeAfter: 0, consumeBefore: 2, text: 'flow ' });
  });

  it('consumes existing horizontal whitespace instead of duplicating it', () => {
    expect(
      createSuggestionInsertion({
        selectionEmpty: true,
        textAfterSelection: '   next',
        textBeforeCursor: 'fl',
        word: ' flow ',
      }),
    ).toEqual({ consumeAfter: 3, consumeBefore: 2, text: 'flow ' });
  });

  it('replaces a non-empty selection without treating it as an active prefix', () => {
    expect(
      createSuggestionInsertion({
        selectedText: 'glow',
        selectionEmpty: false,
        textAfterSelection: '  tonight',
        textBeforeCursor: 'write ',
        word: 'flow',
      }),
    ).toEqual({ consumeAfter: 2, consumeBefore: 0, text: 'flow ' });
  });

  it('does not consume a paragraph boundary', () => {
    expect(
      createSuggestionInsertion({
        selectionEmpty: true,
        textAfterSelection: '\nnext line',
        textBeforeCursor: 'fl',
        word: 'flow',
      }),
    ).toEqual({ consumeAfter: 0, consumeBefore: 2, text: 'flow ' });
  });
});

describe('applyPrefixCasing', () => {
  it.each([
    ['flow', 'fl', 'flow'],
    ['flow', 'F', 'Flow'],
    ['flow', 'Fl', 'Flow'],
    ['flow', 'FL', 'FLOW'],
    ['McFly', 'mC', 'McFly'],
  ])('maps %s with prefix %s to %s', (word, prefix, expected) => {
    expect(applyPrefixCasing(word, prefix)).toBe(expected);
  });
});
