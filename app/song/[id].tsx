import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

import { useSongRepository } from '../../src/songs/SongRepositoryProvider';
import { LyricsEditorScreen } from '../../src/editor/LyricsEditorScreen';
import { useAppTheme } from '../../src/settings/SettingsProvider';

export default function SongRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const repository = useSongRepository();
  const { tokens } = useAppTheme();
  const router = useRouter();
  const songId = Array.isArray(id) ? id[0] : id;

  if (!songId) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: tokens.background }]}
      >
        <Text style={[styles.errorText, { color: tokens.danger }]}>
          Song not found
        </Text>
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
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
