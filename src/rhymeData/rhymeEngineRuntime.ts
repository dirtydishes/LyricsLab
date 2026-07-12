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
  cancel(): void;
  getSnapshot(): RhymeEngineRuntimeSnapshot;
  retry(): Promise<void>;
  start(): void;
  subscribe(listener: () => void): () => void;
};

export type CreateRhymeEngineRuntimeOptions = {
  readonly decode: (
    bytes: Uint8Array,
    shouldCancel: () => boolean,
  ) => Promise<DecodedRhymeData>;
  readonly initialVersion: string;
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
  let cancelScheduledStart: (() => void) | null = null;
  let scheduleGeneration = 0;
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
      const isCurrent = () => currentAttempt === attempt;
      const bytes = await readArtifact(options, isCurrent);
      if (!isCurrent()) return;
      const decoded = await options.decode(bytes, () => !isCurrent());

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
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
        // A subscriber cannot turn a completed load into an engine failure.
      }
    }
  }

  function cancelSchedule() {
    scheduleGeneration += 1;
    cancelScheduledStart?.();
    cancelScheduledStart = null;
  }

  return {
    engine,
    cancel() {
      cancelSchedule();
      attempt += 1;
      started = false;
    },
    getSnapshot: () => snapshot,
    retry() {
      started = true;
      cancelSchedule();
      return load();
    },
    start() {
      if (started) return;
      started = true;
      const currentSchedule = ++scheduleGeneration;
      cancelScheduledStart = options.scheduleAfterFirstFrame(() => {
        if (currentSchedule !== scheduleGeneration) return;
        cancelScheduledStart = null;
        void load();
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

async function readArtifact(
  options: CreateRhymeEngineRuntimeOptions,
  isCurrent: () => boolean,
) {
  const reader = await options.source.open();
  const readChunkBytes = options.readChunkBytes ?? DEFAULT_READ_CHUNK_BYTES;
  try {
    if (
      !Number.isInteger(reader.size) ||
      reader.size <= 0 ||
      reader.size > DEFAULT_MAX_ARTIFACT_BYTES
    ) {
      throw new Error('Bundled rhyme artifact size is invalid');
    }
    if (!Number.isInteger(readChunkBytes) || readChunkBytes <= 0 || readChunkBytes > DEFAULT_READ_CHUNK_BYTES) {
      throw new Error('Rhyme artifact read chunk is invalid');
    }
    if (!isCurrent()) throw new Error('Rhyme artifact load was cancelled');

    const output = new Uint8Array(reader.size);
    let offset = 0;
    while (offset < output.length) {
      if (!isCurrent()) throw new Error('Rhyme artifact load was cancelled');
      const requested = Math.min(readChunkBytes, output.length - offset);
      const chunk = reader.read(requested);
      if (chunk.length === 0 || chunk.length > requested) {
        throw new Error('Bundled rhyme artifact ended unexpectedly');
      }
      output.set(chunk, offset);
      offset += chunk.length;
      if (options.yieldToHost) await options.yieldToHost();
    }
    return output;
  } finally {
    reader.close();
  }
}

function normalizeError(error: unknown) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : 'The bundled rhyme engine could not load.';
}
