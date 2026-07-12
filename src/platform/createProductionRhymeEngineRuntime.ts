import productionRhymeArtifact from '../../assets/rhyme/production.rhymebin';

import { type RhymeEngineRuntime } from '../rhymeData/rhymeEngineRuntime';
import { createExpoRhymeEngineRuntime } from './createExpoRhymeEngineRuntime';

export const PRODUCTION_RHYME_DATA_VERSION = '2026.07.12-phase04a';
export const PRODUCTION_RHYME_DATA_MANIFEST_SHA256 =
  '9df2e79105888978c3c89b0304cd2f6e8815a353b8c311a9c564b47c3379280a';
export const PRODUCTION_RHYME_DATA_ARTIFACT_SHA256 =
  '204a1471633da57ef447006b8d45128358b993deb085b4243c7067b7b61ab12d';

/**
 * Dormant Phase 04A production artifact factory. Phase 05 owns provider and
 * settings activation; this file only proves the production bundle can be
 * addressed through the existing native runtime seam.
 */
export function createProductionRhymeEngineRuntime(): RhymeEngineRuntime {
  return createExpoRhymeEngineRuntime({
    artifactModuleId: productionRhymeArtifact,
    expectedManifestSha256: PRODUCTION_RHYME_DATA_MANIFEST_SHA256,
    initialVersion: PRODUCTION_RHYME_DATA_VERSION,
  });
}
