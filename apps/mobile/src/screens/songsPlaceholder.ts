export type PlaceholderSong = {
  badge: string;
  id: string;
  status: string;
  title: string;
};

export const songsScreenCopy = {
  eyebrow: 'LyricsLab',
  title: 'Songs',
  subtitle: 'A placeholder mobile shell for the Expo rebuild lane.',
} as const;

export const placeholderSongs: PlaceholderSong[] = [
  {
    badge: 'Draft',
    id: 'phase-one-placeholder',
    status: 'Local songs arrive in Phase 2',
    title: 'Untitled idea',
  },
];
