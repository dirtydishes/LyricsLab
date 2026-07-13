import cmuRhymeArtifactData from './generated/cmuRhymeArtifact.json';
import {
  getRhymeIndexArtifactBuildInfo,
  loadRhymeIndexFromArtifact,
  type RhymeIndexArtifact,
  type RhymeIndexArtifactBuildInfo,
} from './artifact';
import type { RhymeIndex } from './rhymeIndex';

const cmuRhymeArtifact = cmuRhymeArtifactData as unknown as RhymeIndexArtifact;

let bundledCmuRhymeIndex: RhymeIndex | null = null;

export function getBundledCmuRhymeIndex(): RhymeIndex {
  if (!bundledCmuRhymeIndex) {
    bundledCmuRhymeIndex = loadRhymeIndexFromArtifact(cmuRhymeArtifact);
  }

  return bundledCmuRhymeIndex;
}

export function getBundledCmuArtifactInfo(): RhymeIndexArtifactBuildInfo {
  const buildInfo = getRhymeIndexArtifactBuildInfo(cmuRhymeArtifact);

  if (!buildInfo) {
    throw new Error('bundled CMU artifact is missing build information');
  }

  return buildInfo;
}
