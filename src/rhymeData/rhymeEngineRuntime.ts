import type { RhymeEngine } from '../rhyme/RhymeEngine';
import type { DecodedRhymeData } from './decodeRhymeData';

const DEFAULT_MAX_ARTIFACT_BYTES = 64 * 1024 * 1024;
const DEFAULT_READ_CHUNK_BYTES = 64 * 1024;

export type RhymeArtifactReader = {
  readonly size: number;
  readonly close: () => void;
  readonly read: (maxBytes: number) => Uint8Array;
};

export type RhymeArtifactSource = {
  readonly open: () => Promise<RhymeArtifactReader>;
};

export type RhymeEngineRuntimeSnapshot = {
  readonly errorMessage?: string;
  readonly state: 'error' | 'loading' | 'ready';
  readonly usingLastKnownGood: boolean;
  readonly version: string;
};

export type RhymeEngineRuntime = {
  readonly engine: RhymeEngine;
  getSnapshot(): RhymeEngineRuntimeSnapshot;
  retry(): Promise<void>;
  start(): void;
  subscribe(listener: () => void): () => void;
};

export type CreateRhymeEngineRuntimeOptions = {
  readonly decode: (bytes: Uint8Array) => Promise<DecodedRhymeData>;
  readonly initialVersion: string;
  readonly maxArtifactBytes?: number;
  readonly readChunkBytes?: number;
  readonly scheduleAfterFirstFrame: (task: () => void) => () => void;
  readonly source: RhymeArtifactSource;
  readonly yieldToHost?: () => Promise<void>;
};

export function createRhymeEngineRuntime(
  options: CreateRhymeEngineRuntimeOptions,
): RhymeEngineRuntime {
  let activeEngine: RhymeEngine | null = null;
  let attempt = 0;
  let started = false;
  let snapshot: RhymeEngineRuntimeSnapshot = {
    state: 'loading',
    usingLastKnownGood: false,
    version: options.initialVersion,
  };
  const listeners = new Set<() => void>();
  const engine: RhymeEngine = {
    suggest(query) {
      return activeEngine?.suggest(query) ?? [];
    },
  };

  async function load() {
    const currentAttempt = ++attempt;
    publish({
      state: 'loading',
      usingLastKnownGood: activeEngine !== null,
      version: snapshot.version,
    });

    try {
      const bytes = await readArtifact(options);
      const decoded = await options.decode(bytes);

      if (currentAttempt !== attempt) return;
      activeEngine = decoded.engine;
      publish({
        state: 'ready',
        usingLastKnownGood: false,
        version: decoded.version,
      });
    } catch (error) {
      if (currentAttempt !== attempt) return;
      publish({
        errorMessage: normalizeError(error),
        state: 'error',
        usingLastKnownGood: activeEngine !== null,
        version: snapshot.version,
      });
    }
  }

  function publish(next: RhymeEngineRuntimeSnapshot) {
    snapshot = Object.freeze(next);
    for (const listener of listeners) listener();
  }

  return {
    engine,
    getSnapshot: () => snapshot,
    retry: load,
    start() {
      if (started) return;
      started = true;
      options.scheduleAfterFirstFrame(() => {
        void load();
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

async function readArtifact(options: CreateRhymeEngineRuntimeOptions) {
  const reader = await options.source.open();
  const maxArtifactBytes = options.maxArtifactBytes ?? DEFAULT_MAX_ARTIFACT_BYTES;
  const readChunkBytes = options.readChunkBytes ?? DEFAULT_READ_CHUNK_BYTES;

  if (!Number.isInteger(reader.size) || reader.size <= 0 || reader.size > maxArtifactBytes) {
    reader.close();
    throw new Error('Bundled rhyme artifact size is invalid');
  }
  if (!Number.isInteger(readChunkBytes) || readChunkBytes <= 0 || readChunkBytes > DEFAULT_READ_CHUNK_BYTES) {
    reader.close();
    throw new Error('Rhyme artifact read chunk is invalid');
  }

  const output = new Uint8Array(reader.size);
  let offset = 0;
  try {
    while (offset < output.length) {
      const requested = Math.min(readChunkBytes, output.length - offset);
      const chunk = reader.read(requested);
      if (chunk.length === 0 || chunk.length > requested) {
        throw new Error('Bundled rhyme artifact ended unexpectedly');
      }
      output.set(chunk, offset);
      offset += chunk.length;
      if (options.yieldToHost) await options.yieldToHost();
    }
  } finally {
    reader.close();
  }
  return output;
}

function normalizeError(error: unknown) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : 'The bundled rhyme engine could not load.';
}
