import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ProductionRhymeProvider } from '../../src/platform/ProductionRhymeProvider';
import { SettingsProvider, useAppTheme } from '../../src/settings/SettingsProvider';

export default function DiagnosticsLayout() {
  return (
    <SettingsProvider>
      <ProductionRhymeProvider>
        <DiagnosticsStack />
      </ProductionRhymeProvider>
    </SettingsProvider>
  );
}

function DiagnosticsStack() {
  const { tokens } = useAppTheme();
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style={tokens.statusBarStyle} />
    </>
  );
}
