/// <reference types="jest" />

import type { RhymeEngineRuntime } from '../../rhymeData/rhymeEngineRuntime';
import {
  createProductionRhymeEngineRuntime,
  PRODUCTION_RHYME_DATA_ARTIFACT_SHA256,
  PRODUCTION_RHYME_DATA_MANIFEST_SHA256,
  PRODUCTION_RHYME_DATA_VERSION,
} from '../createProductionRhymeEngineRuntime';
import { createExpoRhymeEngineRuntime } from '../createExpoRhymeEngineRuntime';

jest.mock('../../../assets/rhyme/production.rhymebin', () => 90210, {
  virtual: true,
});

jest.mock('../createExpoRhymeEngineRuntime', () => ({
  createExpoRhymeEngineRuntime: jest.fn(() => mockRuntime),
}));

const mockRuntime: RhymeEngineRuntime = {
  cancel: jest.fn(),
  engine: { suggest: jest.fn(() => []) },
  getSnapshot: jest.fn(() => ({
    state: 'loading',
    usingLastKnownGood: false,
    version: PRODUCTION_RHYME_DATA_VERSION,
  })),
  retry: jest.fn(async () => undefined),
  start: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
};

describe('production rhyme runtime factory', () => {
  it('addresses the production artifact through the existing Expo runtime seam', () => {
    expect(createProductionRhymeEngineRuntime()).toBe(mockRuntime);
    expect(createExpoRhymeEngineRuntime).toHaveBeenCalledWith({
      artifactModuleId: 90210,
      expectedManifestSha256: PRODUCTION_RHYME_DATA_MANIFEST_SHA256,
      initialVersion: PRODUCTION_RHYME_DATA_VERSION,
    });
    expect(PRODUCTION_RHYME_DATA_ARTIFACT_SHA256).toBe(
      '204a1471633da57ef447006b8d45128358b993deb085b4243c7067b7b61ab12d',
    );
  });
});
