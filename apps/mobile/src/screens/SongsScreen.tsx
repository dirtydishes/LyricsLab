import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { placeholderSongs, songsScreenCopy } from './songsPlaceholder';

export function SongsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{songsScreenCopy.eyebrow}</Text>
          <Text style={styles.title}>{songsScreenCopy.title}</Text>
          <Text style={styles.subtitle}>{songsScreenCopy.subtitle}</Text>
        </View>

        <View style={styles.list}>
          {placeholderSongs.map((song) => (
            <View key={song.id} style={styles.songRow}>
              <View>
                <Text style={styles.songTitle}>{song.title}</Text>
                <Text style={styles.songMeta}>{song.status}</Text>
              </View>
              <Text style={styles.songBadge}>{song.badge}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f8fb',
  },
  container: {
    flex: 1,
    gap: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    gap: 10,
  },
  eyebrow: {
    color: '#b91c5c',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 23,
  },
  list: {
    gap: 12,
  },
  songRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8dee9',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 74,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  songTitle: {
    color: '#1f2937',
    fontSize: 17,
    fontWeight: '700',
  },
  songMeta: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },
  songBadge: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
  },
});
