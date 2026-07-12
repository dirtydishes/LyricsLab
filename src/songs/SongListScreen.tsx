import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Song, SongId } from './types';
import type { SongRepository } from './songRepository';
import { useAppTheme } from '../settings/SettingsProvider';
import type { ThemeTokens } from '../theme/theme';

type SongListScreenProps = {
  onOpenSong: (songId: SongId) => void;
  onOpenSettings: () => void;
  refreshKey: number;
  repository: SongRepository;
};

export function SongListScreen({
  onOpenSong,
  onOpenSettings,
  refreshKey,
  repository,
}: SongListScreenProps) {
  const { tokens } = useAppTheme();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);

  const loadSongs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextSongs = query.trim()
        ? await repository.searchSongs(query)
        : await repository.listSongs();
      setSongs(nextSongs);
    } catch (loadError) {
      setError(toErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [query, repository]);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        const nextSongs = query.trim()
          ? await repository.searchSongs(query)
          : await repository.listSongs();

        if (isMounted) {
          setSongs(nextSongs);
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

    void run();

    return () => {
      isMounted = false;
    };
  }, [query, refreshKey, repository]);

  const emptyCopy = useMemo(() => {
    return query.trim() ? 'No matches' : 'No songs yet';
  }, [query]);

  async function createSong() {
    setIsCreating(true);
    setError(null);

    try {
      const song = await repository.createSong();
      onOpenSong(song.id);
    } catch (createError) {
      setError(toErrorMessage(createError));
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteSong(songId: SongId) {
    setError(null);

    try {
      await repository.deleteSong(songId);
      await loadSongs();
    } catch (deleteError) {
      setError(toErrorMessage(deleteError));
    }
  }

  function confirmDelete(song: Song) {
    Alert.alert('Delete song?', displaySongTitle(song), [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: () => {
          void deleteSong(song.id);
        },
        style: 'destructive',
        text: 'Delete',
      },
    ]);
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: tokens.background }]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: tokens.accent }]}>
              LyricsLab
            </Text>
            <Text style={[styles.title, { color: tokens.text }]}>Songs</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onOpenSettings}
              style={({ pressed }) => [
                styles.settingsButton,
                { borderColor: tokens.border },
                pressed && { backgroundColor: tokens.pressed },
              ]}
            >
              <Text
                style={[styles.settingsButtonText, { color: tokens.text }]}
              >
                Settings
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isCreating}
              onPress={createSong}
              style={({ pressed }) => [
                styles.newSongButton,
                { backgroundColor: tokens.primaryAction },
                pressed && styles.pressed,
                isCreating && styles.disabledButton,
              ]}
            >
              <Text
                style={[
                  styles.newSongButtonText,
                  { color: tokens.primaryActionText },
                ]}
              >
                {isCreating ? 'Creating' : '+ New'}
              </Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          placeholder="Search title or lyrics"
          placeholderTextColor={tokens.placeholder}
          returnKeyType="search"
          style={[
            styles.searchInput,
            {
              backgroundColor: tokens.inputBackground,
              borderColor: tokens.border,
              color: tokens.text,
            },
          ]}
          value={query}
        />

        {error ? (
          <Text style={[styles.errorText, { color: tokens.danger }]}>
            {error}
          </Text>
        ) : null}

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={tokens.accent} />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={[
              styles.listContent,
              songs.length === 0 && styles.emptyListContent,
            ]}
            data={songs}
            keyExtractor={(song) => song.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: tokens.textSecondary }]}>
                {emptyCopy}
              </Text>
            }
            renderItem={({ item }) => (
              <SongRow
                onDelete={() => confirmDelete(item)}
                onPress={() => onOpenSong(item.id)}
                song={item}
                tokens={tokens}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

type SongRowProps = {
  onDelete: () => void;
  onPress: () => void;
  song: Song;
  tokens: ThemeTokens;
};

function SongRow({ onDelete, onPress, song, tokens }: SongRowProps) {
  const preview = song.bodyText.trim();

  return (
    <View
      style={[
        styles.songRow,
        { backgroundColor: tokens.surface, borderColor: tokens.border },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.songPressTarget,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.songText}>
          <Text
            numberOfLines={1}
            style={[styles.songTitle, { color: tokens.text }]}
          >
            {displaySongTitle(song)}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.songPreview, { color: tokens.textSecondary }]}
          >
            {preview || formatUpdatedAt(song.updatedAt)}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        hitSlop={10}
        onPress={onDelete}
        style={({ pressed }) => [
          styles.deleteButton,
          { borderColor: tokens.suggestion.near.border },
          pressed && { backgroundColor: tokens.dangerSurface },
        ]}
      >
        <Text style={[styles.deleteButtonText, { color: tokens.danger }]}>
          Delete
        </Text>
      </Pressable>
    </View>
  );
}

function displaySongTitle(song: Song) {
  const title = song.title.trim();
  return title.length > 0 ? title : 'Untitled Song';
}

function formatUpdatedAt(updatedAt: string) {
  const parsed = new Date(updatedAt);

  if (Number.isNaN(parsed.getTime())) {
    return 'Saved';
  }

  return `Saved ${parsed.toLocaleDateString()}`;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 4,
  },
  newSongButton: {
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 44,
    minWidth: 94,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  newSongButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.72,
  },
  searchInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    gap: 10,
    paddingBottom: 32,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  songRow: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 76,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  songPressTarget: {
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 7,
  },
  songText: {
    flex: 1,
    minWidth: 0,
  },
  songTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  songPreview: {
    fontSize: 13,
    marginTop: 5,
  },
  deleteButton: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    minWidth: 72,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  settingsButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
