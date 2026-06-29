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

type SongListScreenProps = {
  onOpenSong: (songId: SongId) => void;
  refreshKey: number;
  repository: SongRepository;
};

export function SongListScreen({
  onOpenSong,
  refreshKey,
  repository,
}: SongListScreenProps) {
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>LyricsLab</Text>
            <Text style={styles.title}>Songs</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isCreating}
            onPress={createSong}
            style={({ pressed }) => [
              styles.newSongButton,
              pressed && styles.pressed,
              isCreating && styles.disabledButton,
            ]}
          >
            <Text style={styles.newSongButtonText}>
              {isCreating ? 'Creating' : '+ New'}
            </Text>
          </Pressable>
        </View>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setQuery}
          placeholder="Search title or lyrics"
          placeholderTextColor="#7b8494"
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#d94670" />
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
            ListEmptyComponent={<Text style={styles.emptyText}>{emptyCopy}</Text>}
            renderItem={({ item }) => (
              <SongRow
                onDelete={() => confirmDelete(item)}
                onPress={() => onOpenSong(item.id)}
                song={item}
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
};

function SongRow({ onDelete, onPress, song }: SongRowProps) {
  const preview = song.bodyText.trim();

  return (
    <View style={styles.songRow}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.songPressTarget,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.songText}>
          <Text numberOfLines={1} style={styles.songTitle}>
            {displaySongTitle(song)}
          </Text>
          <Text numberOfLines={1} style={styles.songPreview}>
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
          pressed && styles.deleteButtonPressed,
        ]}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
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
    backgroundColor: '#f7f7f5',
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
    color: '#b91c5c',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#161a22',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 4,
  },
  newSongButton: {
    alignItems: 'center',
    backgroundColor: '#182032',
    borderRadius: 8,
    minHeight: 44,
    minWidth: 94,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  newSongButtonText: {
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
    borderColor: '#d4d8de',
    borderRadius: 8,
    borderWidth: 1,
    color: '#1f2937',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  errorText: {
    color: '#b42318',
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
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
  },
  songRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dadde4',
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
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '800',
  },
  songPreview: {
    color: '#687385',
    fontSize: 13,
    marginTop: 5,
  },
  deleteButton: {
    borderColor: '#e0b4bd',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    minWidth: 72,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deleteButtonPressed: {
    backgroundColor: '#fbe8ec',
  },
  deleteButtonText: {
    color: '#a10f3f',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
});
