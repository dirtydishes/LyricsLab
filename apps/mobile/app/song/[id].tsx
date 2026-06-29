import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

import { useSongRepository } from '../../src/songs/SongRepositoryProvider';
import { LyricsEditorScreen } from '../../src/editor/LyricsEditorScreen';

export default function SongRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const repository = useSongRepository();
  const router = useRouter();
  const songId = Array.isArray(id) ? id[0] : id;

  if (!songId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Song not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <LyricsEditorScreen
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace('/');
      }}
      repository={repository}
      songId={songId}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'center',
    backgroundColor: '#f7f7f5',
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    color: '#b42318',
    fontSize: 16,
    fontWeight: '700',
  },
});
