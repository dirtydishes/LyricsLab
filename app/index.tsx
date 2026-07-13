import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { useSongRepository } from '../src/songs/SongRepositoryProvider';
import { SongListScreen } from '../src/songs/SongListScreen';

export default function SongsRoute() {
  const repository = useSongRepository();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((current) => current + 1);
    }, []),
  );

  return (
    <SongListScreen
      onOpenSong={(songId) => {
        router.push({ params: { id: songId }, pathname: '/song/[id]' });
      }}
      onOpenSettings={() => {
        router.push('/settings');
      }}
      refreshKey={refreshKey}
      repository={repository}
    />
  );
}
