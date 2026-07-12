import productionRhymeArtifact from '../../assets/rhyme/production.rhymebin';
import {
  PRODUCTION_RHYME_ARTIFACT_VERSION,
  PRODUCTION_RHYME_MANIFEST_SHA256,
} from '../rhymeData/productionArtifact';
import type { RhymeEngineRuntime } from '../rhymeData/rhymeEngineRuntime';
import { createExpoRhymeEngineRuntime } from './createExpoRhymeEngineRuntime';

/**
 * App-ready but dormant Phase 04A construction adapter. Phase 05 owns calling
 * this factory and publishing its stable RhymeEngine proxy to editor state.
 */
export function createProductionRhymeEngineRuntime(): RhymeEngineRuntime {
  return createExpoRhymeEngineRuntime({
    artifactModuleId: productionRhymeArtifact,
    expectedManifestSha256: PRODUCTION_RHYME_MANIFEST_SHA256,
    initialVersion: PRODUCTION_RHYME_ARTIFACT_VERSION,
  });
}
