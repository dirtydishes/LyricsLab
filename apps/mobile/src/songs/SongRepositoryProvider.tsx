import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import { createExpoSQLiteSongStore } from './expoSQLiteSongStore';
import {
  createSongRepository,
  type SongRepository,
} from './songRepository';

const SongRepositoryContext = createContext<SongRepository | null>(null);

export function SongRepositoryProvider({ children }: PropsWithChildren) {
  const repository = useMemo(
    () => createSongRepository(createExpoSQLiteSongStore()),
    [],
  );

  return (
    <SongRepositoryContext.Provider value={repository}>
      {children}
    </SongRepositoryContext.Provider>
  );
}

export function useSongRepository() {
  const repository = useContext(SongRepositoryContext);

  if (!repository) {
    throw new Error('Song repository is not available');
  }

  return repository;
}
