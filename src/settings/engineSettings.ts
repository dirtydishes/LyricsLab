import { RHYME_INDEX_ARTIFACT_VERSION } from '../rhyme/artifact';
import type { RhymeEngineRuntimeSnapshot } from '../rhymeData/rhymeEngineRuntime';

export type RhymeEngineState = 'error' | 'loading' | 'ready';

export type RhymeEngineSettingsSnapshot = {
  diagnostics: 'not-enabled' | 'available';
  errorMessage?: string;
  state: RhymeEngineState;
  version: string;
};

export type RhymeEngineSettingsViewModel = {
  canRetry: boolean;
  diagnosticsLabel: string;
  statusDetail: string;
  statusLabel: string;
  versionLabel: string;
};

export function getBundledEngineSettingsSnapshot(): RhymeEngineSettingsSnapshot {
  return {
    diagnostics: 'not-enabled',
    state: 'ready',
    version: `artifact-v${RHYME_INDEX_ARTIFACT_VERSION}`,
  };
}

export function toEngineSettingsSnapshot(
  snapshot: RhymeEngineRuntimeSnapshot,
): RhymeEngineSettingsSnapshot {
  return {
    diagnostics: 'not-enabled',
    errorMessage:
      snapshot.state === 'error' && snapshot.usingLastKnownGood
        ? `${snapshot.errorMessage ?? 'Reload failed.'} The last loaded engine remains available.`
        : snapshot.errorMessage,
    state: snapshot.state,
    version: snapshot.version,
  };
}

export function buildEngineSettingsViewModel(
  snapshot: RhymeEngineSettingsSnapshot,
): RhymeEngineSettingsViewModel {
  switch (snapshot.state) {
    case 'error':
      return {
        canRetry: true,
        diagnosticsLabel: diagnosticsLabel(snapshot.diagnostics),
        statusDetail:
          snapshot.errorMessage?.trim() || 'The offline engine could not load.',
        statusLabel: 'Needs attention',
        versionLabel: snapshot.version,
      };
    case 'loading':
      return {
        canRetry: false,
        diagnosticsLabel: diagnosticsLabel(snapshot.diagnostics),
        statusDetail: 'Preparing the bundled offline engine.',
        statusLabel: 'Loading',
        versionLabel: snapshot.version,
      };
    case 'ready':
      return {
        canRetry: false,
        diagnosticsLabel: diagnosticsLabel(snapshot.diagnostics),
        statusDetail: 'Available offline. No lyric content leaves this device.',
        statusLabel: 'Ready',
        versionLabel: snapshot.version,
      };
  }
}

function diagnosticsLabel(
  diagnostics: RhymeEngineSettingsSnapshot['diagnostics'],
) {
  return diagnostics === 'available'
    ? 'Available in this build'
    : 'Not enabled in this build';
}
