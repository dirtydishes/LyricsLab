import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { WordSuggestion } from './suggestions';
import {
  getSuggestionAccessibilityLabel,
  getSuggestionPresentation,
  getSuggestionStateLabel,
} from './suggestionPresentation';
import {
  getSuggestionTransitionDuration,
  type ProductionSuggestionView,
} from './productionSuggestions';
import { useAppTheme } from '../settings/SettingsProvider';
import type { SuggestionRoleTokens } from '../theme/theme';

type SuggestionBarProps = {
  measurementReceivedAt?: number;
  onFirstCommittedFrame?: (durationMs: number) => void;
  onRetry: () => void;
  onSelectSuggestion: (suggestion: WordSuggestion) => void;
  view: ProductionSuggestionView;
};

export function SuggestionBar({
  measurementReceivedAt,
  onFirstCommittedFrame,
  onRetry,
  onSelectSuggestion,
  view,
}: SuggestionBarProps) {
  const { tokens } = useAppTheme();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const previousKind = useRef(view.kind);

  useEffect(() => {
    if (measurementReceivedAt === undefined || !onFirstCommittedFrame) return;
    const frame = requestAnimationFrame(() => {
      onFirstCommittedFrame(performance.now() - measurementReceivedAt);
    });
    return () => cancelAnimationFrame(frame);
  }, [measurementReceivedAt, onFirstCommittedFrame, view]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const duration = getSuggestionTransitionDuration(
      previousKind.current,
      view.kind,
      reduceMotion,
    );
    previousKind.current = view.kind;
    opacity.stopAnimation();
    if (duration === 0) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      duration,
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, reduceMotion, view.kind]);

  if (view.kind === 'hidden') return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        {
          backgroundColor: tokens.surface,
          borderColor: tokens.border,
          opacity,
        },
      ]}
    >
      {view.kind === 'results' ? (
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {view.suggestions.map((suggestion) => {
            const presentation = getSuggestionPresentation(suggestion);
            const roleTokens = tokens.suggestion[presentation.role];
            const focused = focusedId === suggestion.id;

            return (
              <Pressable
                accessibilityHint={`Replaces the current prefix with ${suggestion.word}`}
                accessibilityLabel={getSuggestionAccessibilityLabel(
                  presentation,
                  suggestion.word,
                )}
                accessibilityRole="button"
                focusable
                key={suggestion.id}
                onBlur={() => setFocusedId(null)}
                onFocus={() => setFocusedId(suggestion.id)}
                onPress={() => onSelectSuggestion(suggestion)}
                style={({ pressed }) => [
                  styles.suggestionButton,
                  roleStyle(roleTokens),
                  focused && { borderColor: tokens.accent, borderWidth: 2 },
                  pressed && { backgroundColor: tokens.pressed },
                ]}
              >
                <Text
                  allowFontScaling
                  numberOfLines={1}
                  style={[styles.suggestionLabel, { color: roleTokens.text }]}
                >
                  {presentation.label}
                </Text>
                <Text
                  allowFontScaling
                  numberOfLines={1}
                  style={[styles.suggestionText, { color: roleTokens.text }]}
                >
                  {suggestion.word}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.stateRow}>
          <View
            accessibilityLabel={view.message}
            accessibilityRole="text"
            style={[
              styles.statePill,
              roleStyle(tokens.suggestion.prompt),
            ]}
          >
            <Text
              allowFontScaling
              style={[
                styles.stateLabel,
                { color: tokens.suggestion.prompt.text },
              ]}
            >
              {getSuggestionStateLabel(view.kind)}
            </Text>
            <Text
              allowFontScaling
              style={[
                styles.stateMessage,
                { color: tokens.suggestion.prompt.text },
              ]}
            >
              {view.message}
            </Text>
          </View>
          {view.canRetry ? (
            <Pressable
              accessibilityHint="Attempts to load the bundled offline rhyme engine again"
              accessibilityLabel="Retry rhyme engine"
              accessibilityRole="button"
              onPress={onRetry}
              style={({ pressed }) => [
                styles.retryButton,
                { borderColor: tokens.border },
                pressed && { backgroundColor: tokens.pressed },
              ]}
            >
              <Text style={[styles.retryText, { color: tokens.text }]}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Animated.View>
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
    minHeight: 54,
  },
  content: {
    alignItems: 'center',
    columnGap: 8,
    minHeight: 52,
    paddingHorizontal: 8,
  },
  retryButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  scrollView: {
    flexGrow: 0,
  },
  stateLabel: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  stateMessage: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  statePill: {
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 8,
  },
  suggestionButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 5,
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
    lineHeight: 19,
  },
});
