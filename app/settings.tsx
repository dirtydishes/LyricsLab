import { useRouter } from 'expo-router';

import { SettingsScreen } from '../src/settings/SettingsScreen';

export default function SettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace('/');
      }}
    />
  );
}
