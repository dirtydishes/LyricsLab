import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { SongRepository } from '../songs/songRepository';
import type { Song, SongId } from '../songs/types';

const TITLE_SAVE_DEBOUNCE_MS = 450;

type LyricsEditorScreenProps = {
  onBack: () => void;
  repository: SongRepository;
  songId: SongId;
};

export function LyricsEditorScreen({
  onBack,
  repository,
  songId,
}: LyricsEditorScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [song, setSong] = useState<Song | null>(null);
  const [title, setTitle] = useState('');
  const lastSavedTitleRef = useRef('');
  const titleRef = useRef('');

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    let isMounted = true;

    async function loadSong() {
      setIsLoading(true);
      setError(null);

      try {
        const nextSong = await repository.getSong(songId);

        if (!isMounted) {
          return;
        }

        setSong(nextSong);
        setTitle(nextSong?.title ?? '');
        lastSavedTitleRef.current = nextSong?.title ?? '';

        if (!nextSong) {
          setError('Song not found');
        }
      } catch (loadError) {
        if (isMounted) {
          setError(toErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSong();

    return () => {
      isMounted = false;
    };
  }, [repository, songId]);

  const saveTitle = useCallback(
    async (nextTitle: string) => {
      if (!song || nextTitle === lastSavedTitleRef.current) {
        return song;
      }

      setIsSavingTitle(true);
      setError(null);

      try {
        const updatedSong = await repository.updateSong(song.id, {
          title: nextTitle,
        });
        lastSavedTitleRef.current = updatedSong.title;
        setSong(updatedSong);
        return updatedSong;
      } catch (saveError) {
        setError(toErrorMessage(saveError));
        return null;
      } finally {
        setIsSavingTitle(false);
      }
    },
    [repository, song],
  );

  useEffect(() => {
    if (!song || title === lastSavedTitleRef.current) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      void saveTitle(title);
    }, TITLE_SAVE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [saveTitle, song, title]);

  async function navigateBack() {
    await saveTitle(titleRef.current);
    onBack();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}
      >
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void navigateBack();
              }}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
            <Text style={styles.saveState}>
              {isSavingTitle ? 'Saving' : 'Saved'}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#d94670" />
            </View>
          ) : song ? (
            <>
              <TextInput
                autoCapitalize="sentences"
                onBlur={() => {
                  void saveTitle(titleRef.current);
                }}
                onChangeText={setTitle}
                placeholder="Untitled Song"
                placeholderTextColor="#798394"
                returnKeyType="done"
                style={styles.titleInput}
                value={title}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.bodyPlaceholder}>
                <Text style={styles.bodyText}>
                  {song.bodyText.trim() || 'Lyrics body'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.centerState}>
              <Text style={styles.errorText}>{error ?? 'Song not found'}</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f7f7f5',
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    alignItems: 'center',
    borderColor: '#cfd5dd',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    minWidth: 76,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#253041',
    fontSize: 15,
    fontWeight: '800',
  },
  saveState: {
    color: '#697487',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
  titleInput: {
    color: '#161a22',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 34,
    marginBottom: 14,
    minHeight: 52,
    paddingVertical: 6,
  },
  errorText: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  bodyPlaceholder: {
    backgroundColor: '#ffffff',
    borderColor: '#d6dae1',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  bodyText: {
    color: '#4b5563',
    fontSize: 17,
    lineHeight: 26,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
