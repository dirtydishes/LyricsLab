import { useRouter } from 'expo-router';

import { SettingsScreen } from '../src/settings/SettingsScreen';
import { useProductionRhyme } from '../src/platform/ProductionRhymeProvider';
import { toEngineSettingsSnapshot } from '../src/settings/engineSettings';

export default function SettingsRoute() {
  const router = useRouter();
  const { retry, runtime } = useProductionRhyme();

  return (
    <SettingsScreen
      engineSnapshot={toEngineSettingsSnapshot(runtime.getSnapshot())}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace('/');
      }}
      onRetryEngine={() => {
        void retry();
      }}
    />
  );
}
