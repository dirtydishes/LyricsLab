import productionRhymeArtifact from '../../assets/rhyme/production.rhymebin';
import {
  PRODUCTION_RHYME_ARTIFACT_VERSION,
  PRODUCTION_RHYME_MANIFEST_SHA256,
} from '../rhymeData/productionArtifact';
import type { RhymeEngineRuntime } from '../rhymeData/rhymeEngineRuntime';
import { isCuratedEntryEligible } from '../rhymeSources/suggestionEligibility';
import { createExpoRhymeEngineRuntime } from './createExpoRhymeEngineRuntime';

/**
 * Phase 05 production construction adapter. Only the app-level provider calls
 * this factory and publishes its stable RhymeEngine proxy to editor state.
 */
export function createProductionRhymeEngineRuntime(): RhymeEngineRuntime {
  return createExpoRhymeEngineRuntime({
    artifactModuleId: productionRhymeArtifact,
    expectedManifestSha256: PRODUCTION_RHYME_MANIFEST_SHA256,
    initialVersion: PRODUCTION_RHYME_ARTIFACT_VERSION,
    // Decode a bounded candidate superset once per completed anchor. The
    // provider applies the explicit live prefix through the same reviewed
    // policy below without rerunning phonological candidate generation.
    isProperNounEligible: () => true,
    isSuggestionEligible(decoded, normalizedWord, activePrefix) {
      const policy = decoded.policy?.get(normalizedWord);
      return policy
        ? isCuratedEntryEligible(normalizedWord, policy, {
            activePrefix,
            mode: 'suggestion',
          })
        : true;
    },
  });
}
