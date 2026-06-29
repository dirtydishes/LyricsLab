import { StatusBar } from 'expo-status-bar';
import { SongsScreen } from './src/screens/SongsScreen';

export default function App() {
  return (
    <>
      <SongsScreen />
      <StatusBar style="auto" />
    </>
  );
}
