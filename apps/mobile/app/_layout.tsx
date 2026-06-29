import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SongRepositoryProvider } from '../src/songs/SongRepositoryProvider';

export default function RootLayout() {
  return (
    <SongRepositoryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="song/[id]" />
      </Stack>
      <StatusBar style="auto" />
    </SongRepositoryProvider>
  );
}
