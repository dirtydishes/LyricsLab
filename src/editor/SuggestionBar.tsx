import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { WordSuggestion } from './suggestions';
import { getSuggestionPresentation } from './suggestionPresentation';
import { useAppTheme } from '../settings/SettingsProvider';
import type { SuggestionRoleTokens } from '../theme/theme';

type SuggestionBarProps = {
  onSelectSuggestion: (suggestion: WordSuggestion) => void;
  suggestions: readonly WordSuggestion[];
};

export function SuggestionBar({
  onSelectSuggestion,
  suggestions,
}: SuggestionBarProps) {
  const { tokens } = useAppTheme();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: tokens.surface, borderColor: tokens.border },
      ]}
    >
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {suggestions.map((suggestion) => {
          const presentation = getSuggestionPresentation(suggestion);
          const roleTokens = tokens.suggestion[presentation.role];

          return (
            <Pressable
              accessibilityLabel={`${presentation.label}: ${suggestion.word}`}
              accessibilityRole="button"
              key={suggestion.id}
              onPress={() => {
                onSelectSuggestion(suggestion);
              }}
              style={({ pressed }) => [
                styles.suggestionButton,
                roleStyle(roleTokens),
                pressed && { backgroundColor: tokens.pressed },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[styles.suggestionLabel, { color: roleTokens.text }]}
              >
                {presentation.label}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.suggestionText, { color: roleTokens.text }]}
              >
                {suggestion.word}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function roleStyle(roleTokens: SuggestionRoleTokens) {
  return {
    backgroundColor: roleTokens.background,
    borderColor: roleTokens.border,
  };
}

const styles = StyleSheet.create({
  container: {
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
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 72,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  suggestionLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
