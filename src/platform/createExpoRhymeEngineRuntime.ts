import { Asset } from 'expo-asset';
import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import { File, FileMode } from 'expo-file-system';

import {
  decodeRhymeData,
  type DecodedRhymeData,
  type RhymeWordPolicy,
} from '../rhymeData/decodeRhymeData';
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
  readonly isProperNounEligible?: (
    normalizedWord: string,
    policy: RhymeWordPolicy,
  ) => boolean;
  readonly isSuggestionEligible?: (
    decoded: DecodedRhymeData,
    normalizedWord: string,
    activePrefix: string,
  ) => boolean;
};

/**
 * Platform construction boundary shared by the fixture tests and the single
 * Phase 05 app-level production provider.
 */
export function createExpoRhymeEngineRuntime(
  options: ExpoRhymeEngineRuntimeOptions,
): RhymeEngineRuntime {
  return createRhymeEngineRuntime({
    decode(bytes, shouldCancel) {
      return decodeRhymeData(bytes, {
        expectedManifestSha256: options.expectedManifestSha256,
        isProperNounEligible: options.isProperNounEligible,
        recordsPerChunk: 256,
        sha256: async (value) => {
          const contiguous = Uint8Array.from(value);
          return new Uint8Array(
            await digest(CryptoDigestAlgorithm.SHA256, contiguous.buffer),
          );
        },
        shouldCancel,
        yieldToHost,
      });
    },
    initialVersion: options.initialVersion,
    isSuggestionEligible: options.isSuggestionEligible,
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
