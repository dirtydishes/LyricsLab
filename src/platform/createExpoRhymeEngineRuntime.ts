import { Asset } from 'expo-asset';
import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import { File, FileMode } from 'expo-file-system';

import { decodeRhymeData } from '../rhymeData/decodeRhymeData';
import {
  createRhymeEngineRuntime,
  type RhymeArtifactSource,
  type RhymeEngineRuntime,
} from '../rhymeData/rhymeEngineRuntime';
import { createAfterFirstFrameScheduler } from './afterFirstFrameScheduler';

export type ExpoRhymeEngineRuntimeOptions = {
  readonly artifactModuleId: number;
  readonly expectedManifestSha256: string;
  readonly initialVersion: string;
};

/**
 * Dormant Phase 03 construction boundary. Phase 04A supplies the production
 * artifact and Phase 05 owns activation in the editor/settings providers.
 */
export function createExpoRhymeEngineRuntime(
  options: ExpoRhymeEngineRuntimeOptions,
): RhymeEngineRuntime {
  return createRhymeEngineRuntime({
    decode(bytes) {
      return decodeRhymeData(bytes, {
        expectedManifestSha256: options.expectedManifestSha256,
        recordsPerChunk: 256,
        sha256: async (value) => {
          const contiguous = Uint8Array.from(value);
          return new Uint8Array(
            await digest(CryptoDigestAlgorithm.SHA256, contiguous.buffer),
          );
        },
        yieldToHost,
      });
    },
    initialVersion: options.initialVersion,
    scheduleAfterFirstFrame: createNativeAfterFirstFrameScheduler(),
    source: createExpoBundledArtifactSource(options.artifactModuleId),
    yieldToHost,
  });
}

function createNativeAfterFirstFrameScheduler() {
  return createAfterFirstFrameScheduler({
    cancelFrame: cancelAnimationFrame,
    cancelIdle: cancelIdleCallback,
    requestFrame: (callback) => requestAnimationFrame(callback),
    requestIdle: (callback) =>
      requestIdleCallback(callback, { timeout: 250 }),
  });
}

function createExpoBundledArtifactSource(moduleId: number): RhymeArtifactSource {
  return {
    async open() {
      const asset = Asset.fromModule(moduleId);
      await asset.downloadAsync();
      if (!asset.localUri) throw new Error('Bundled rhyme artifact is unavailable');
      const handle = new File(asset.localUri).open(FileMode.ReadOnly);
      try {
        const size = handle.size;
        if (size === null) {
          throw new Error('Bundled rhyme artifact size is unavailable');
        }
        return {
          size,
          close: () => handle.close(),
          read: (maxBytes) => handle.readBytes(maxBytes),
        };
      } catch (error) {
        handle.close();
        throw error;
      }
    },
  };
}

function yieldToHost() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}
