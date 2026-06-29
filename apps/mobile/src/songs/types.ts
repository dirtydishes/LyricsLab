export type SongId = string;

export type Song = {
  id: SongId;
  title: string;
  bodyText: string;
  bodyJson: unknown | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSongInput = {
  title?: string;
  bodyText?: string;
  bodyJson?: unknown | null;
};

export type UpdateSongPatch = Partial<
  Pick<Song, 'title' | 'bodyText' | 'bodyJson'>
>;
