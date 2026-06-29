/// <reference types="jest" />

import { placeholderSongs, songsScreenCopy } from '../songsPlaceholder';

describe('songs placeholder', () => {
  it('keeps the phase one screen anchored on songs', () => {
    expect(songsScreenCopy.title).toBe('Songs');
    expect(placeholderSongs).toHaveLength(1);
    expect(placeholderSongs[0]).toMatchObject({
      badge: 'Draft',
      id: 'phase-one-placeholder',
    });
  });
});
