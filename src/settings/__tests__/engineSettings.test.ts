/// <reference types="jest" />

import {
  buildEngineSettingsViewModel,
  toEngineSettingsSnapshot,
} from '../engineSettings';

describe('engine Settings visibility', () => {
  it('reports failed reload retention through the existing settings boundary', () => {
    expect(
      toEngineSettingsSnapshot({
        errorMessage: 'Hash mismatch.',
        state: 'error',
        usingLastKnownGood: true,
        version: 'fixture-1',
      }),
    ).toEqual({
      diagnostics: 'not-enabled',
      errorMessage: 'Hash mismatch. The last loaded engine remains available.',
      state: 'error',
      usingLastKnownGood: true,
      version: 'fixture-1',
    });
  });

  it('shows ready version and diagnostics state without a retry action', () => {
    expect(
      buildEngineSettingsViewModel({
        diagnostics: 'not-enabled',
        state: 'ready',
        usingLastKnownGood: false,
        version: 'artifact-v1',
      }),
    ).toEqual({
      canRetry: false,
      diagnosticsLabel: 'Not enabled in this build',
      statusDetail: 'Available offline. No lyric content leaves this device.',
      statusLabel: 'Ready',
      versionLabel: 'artifact-v1',
    });
  });

  it('reports a last-good engine truthfully while a retry is loading', () => {
    expect(
      buildEngineSettingsViewModel(
        toEngineSettingsSnapshot({
          state: 'loading',
          usingLastKnownGood: true,
          version: 'artifact-v2',
        }),
      ),
    ).toMatchObject({
      canRetry: false,
      statusDetail: 'The current offline engine remains available while it refreshes.',
      statusLabel: 'Refreshing',
      versionLabel: 'artifact-v2',
    });
  });

  it('makes retry available after a load failure without exposing lyrics', () => {
    expect(
      buildEngineSettingsViewModel({
        diagnostics: 'available',
        errorMessage: 'Artifact checksum mismatch',
        state: 'error',
        usingLastKnownGood: false,
        version: 'artifact-v2',
      }),
    ).toMatchObject({
      canRetry: true,
      diagnosticsLabel: 'Available in this build',
      statusDetail: 'Artifact checksum mismatch',
      statusLabel: 'Needs attention',
      versionLabel: 'artifact-v2',
    });
  });
});
