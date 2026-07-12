/// <reference types="jest" />

import { buildEngineSettingsViewModel } from '../engineSettings';

describe('engine Settings visibility', () => {
  it('shows ready version and diagnostics state without a retry action', () => {
    expect(
      buildEngineSettingsViewModel({
        diagnostics: 'not-enabled',
        state: 'ready',
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

  it('makes retry available after a load failure without exposing lyrics', () => {
    expect(
      buildEngineSettingsViewModel({
        diagnostics: 'available',
        errorMessage: 'Artifact checksum mismatch',
        state: 'error',
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
