import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SettingsProvider, useAppTheme } from '../src/settings/SettingsProvider';
import { SongRepositoryProvider } from '../src/songs/SongRepositoryProvider';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <SongRepositoryProvider>
        <ThemedApp />
      </SongRepositoryProvider>
    </SettingsProvider>
  );
}

function ThemedApp() {
  const { tokens } = useAppTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="song/[id]" />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style={tokens.statusBarStyle} />
    </>
  );
}
