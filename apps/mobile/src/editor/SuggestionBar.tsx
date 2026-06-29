import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { WordSuggestion } from './suggestions';

type SuggestionBarProps = {
  onSelectSuggestion: (suggestion: WordSuggestion) => void;
  suggestions: readonly WordSuggestion[];
};

export function SuggestionBar({
  onSelectSuggestion,
  suggestions,
}: SuggestionBarProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {suggestions.map((suggestion) => (
          <Pressable
            accessibilityRole="button"
            key={suggestion.id}
            onPress={() => {
              onSelectSuggestion(suggestion);
            }}
            style={({ pressed }) => [
              styles.suggestionButton,
              pressed && styles.suggestionButtonPressed,
            ]}
          >
            <Text numberOfLines={1} style={styles.suggestionText}>
              {suggestion.label ?? suggestion.word}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderColor: '#d6dae1',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    minHeight: 52,
  },
  content: {
    alignItems: 'center',
    columnGap: 8,
    minHeight: 50,
    paddingHorizontal: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  suggestionButton: {
    alignItems: 'center',
    backgroundColor: '#f7f7f5',
    borderColor: '#cfd5dd',
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: 14,
  },
  suggestionButtonPressed: {
    backgroundColor: '#edeff3',
  },
  suggestionText: {
    color: '#253041',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
