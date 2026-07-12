import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  buildEngineSettingsViewModel,
  getBundledEngineSettingsSnapshot,
  type RhymeEngineSettingsSnapshot,
} from './engineSettings';
import { useAppTheme } from './SettingsProvider';
import {
  THEME_PREFERENCES,
  type ThemePreference,
} from '../theme/theme';

type SettingsScreenProps = {
  engineSnapshot?: RhymeEngineSettingsSnapshot;
  onBack: () => void;
  onRetryEngine?: () => void;
};

const THEME_LABELS: Record<ThemePreference, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
};

export function SettingsScreen({
  engineSnapshot = getBundledEngineSettingsSnapshot(),
  onBack,
  onRetryEngine,
}: SettingsScreenProps) {
  const { isLoading, preference, resolvedTheme, setPreference, tokens } =
    useAppTheme();
  const [error, setError] = useState<string | null>(null);
  const engine = useMemo(
    () => buildEngineSettingsViewModel(engineSnapshot),
    [engineSnapshot],
  );

  async function selectTheme(nextPreference: ThemePreference) {
    setError(null);

    try {
      await setPreference(nextPreference);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save the theme setting.',
      );
    }
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: tokens.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Back to songs"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: tokens.border },
              pressed && { backgroundColor: tokens.pressed },
            ]}
          >
            <Text style={[styles.backButtonText, { color: tokens.text }]}>
              Back
            </Text>
          </Pressable>
          <Text style={[styles.title, { color: tokens.text }]}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.text }]}>
            Appearance
          </Text>
          <Text
            style={[styles.sectionDescription, { color: tokens.textSecondary }]}
          >
            System follows your iPhone. Your choice is saved on this device.
          </Text>
          <View
            accessibilityLabel="Theme preference"
            accessibilityRole="radiogroup"
            style={[styles.segmentedControl, { borderColor: tokens.border }]}
          >
            {THEME_PREFERENCES.map((themePreference) => {
              const selected = preference === themePreference;

              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  disabled={isLoading}
                  key={themePreference}
                  onPress={() => {
                    void selectTheme(themePreference);
                  }}
                  style={({ pressed }) => [
                    styles.themeChoice,
                    selected && { backgroundColor: tokens.primaryAction },
                    pressed && !selected && { backgroundColor: tokens.pressed },
                  ]}
                >
                  <Text
                    style={[
                      styles.themeChoiceText,
                      {
                        color: selected
                          ? tokens.primaryActionText
                          : tokens.text,
                      },
                    ]}
                  >
                    {THEME_LABELS[themePreference]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.resolvedTheme, { color: tokens.textSecondary }]}>
            Currently using {resolvedTheme} appearance
          </Text>
          {error ? (
            <Text
              accessibilityRole="alert"
              style={[styles.error, { color: tokens.danger }]}
            >
              {error}
            </Text>
          ) : null}
        </View>

        <View style={[styles.divider, { backgroundColor: tokens.border }]} />

        <View style={styles.section}>
          <View style={styles.engineHeading}>
            <View style={styles.engineHeadingCopy}>
              <Text style={[styles.sectionTitle, { color: tokens.text }]}>
                Rhyme engine
              </Text>
              <Text style={[styles.engineStatus, { color: tokens.accent }]}>
                {engine.statusLabel}
              </Text>
            </View>
            <Pressable
              accessibilityHint="Attempts to load the offline rhyme engine again"
              accessibilityRole="button"
              disabled={!engine.canRetry || !onRetryEngine}
              onPress={onRetryEngine}
              style={({ pressed }) => [
                styles.retryButton,
                { borderColor: tokens.border },
                (!engine.canRetry || !onRetryEngine) && styles.disabled,
                pressed && { backgroundColor: tokens.pressed },
              ]}
            >
              <Text style={[styles.retryText, { color: tokens.text }]}>Retry</Text>
            </Pressable>
          </View>
          <Text
            style={[styles.sectionDescription, { color: tokens.textSecondary }]}
          >
            {engine.statusDetail}
          </Text>
          <DefinitionRow label="Version" value={engine.versionLabel} />
          <DefinitionRow label="Diagnostics" value={engine.diagnosticsLabel} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type DefinitionRowProps = {
  label: string;
  value: string;
};

function DefinitionRow({ label, value }: DefinitionRowProps) {
  const { tokens } = useAppTheme();

  return (
    <View style={styles.definitionRow}>
      <Text style={[styles.definitionLabel, { color: tokens.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.definitionValue, { color: tokens.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 72,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    gap: 28,
    paddingBottom: 44,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  definitionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  definitionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  definitionValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  disabled: {
    opacity: 0.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  engineHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  engineHeadingCopy: {
    gap: 3,
  },
  engineStatus: {
    fontSize: 14,
    fontWeight: '800',
  },
  error: {
    fontSize: 14,
    fontWeight: '700',
  },
  resolvedTheme: {
    fontSize: 13,
  },
  retryButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 74,
    paddingHorizontal: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '800',
  },
  safeArea: {
    flex: 1,
  },
  section: {
    gap: 12,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 560,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  segmentedControl: {
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
  },
  themeChoice: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 8,
  },
  themeChoiceText: {
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
  },
});
