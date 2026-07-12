/// <reference types="jest" />

import type { RhymeEngine } from '../../rhyme/RhymeEngine';
import type { DecodedRhymeData } from '../decodeRhymeData';
import { createRhymeEngineRuntime, type RhymeArtifactReader } from '../rhymeEngineRuntime';

describe('rhyme engine runtime', () => {
  it('waits for the post-frame scheduler and publishes only a complete engine', async () => {
    let scheduled: (() => void) | undefined;
    const reads: number[] = [];
    const reader = createReader(Uint8Array.from({ length: 10 }, (_, index) => index), reads);
    const decoded = deferred<DecodedRhymeData>();
    const runtime = createRhymeEngineRuntime({
      decode: () => decoded.promise,
      initialVersion: 'pending',
      readChunkBytes: 4,
      scheduleAfterFirstFrame(task) {
        scheduled = task;
        return () => undefined;
      },
      source: { open: jest.fn(async () => reader) },
      yieldToHost: jest.fn(async () => undefined),
    });

    runtime.start();
    expect(reader.read).not.toHaveBeenCalled();
    expect(runtime.engine.suggest({ anchor: 'cat' })).toEqual([]);
    scheduled?.();
    await flushPromises();
    expect(reads).toEqual([4, 4, 2]);
    expect(runtime.engine.suggest({ anchor: 'cat' })).toEqual([]);

    decoded.resolve(decodedData('fixture-1', engineWithLabel('hat')));
    await flushPromises();
    expect(runtime.getSnapshot()).toEqual({ state: 'ready', usingLastKnownGood: false, version: 'fixture-1' });
    expect(runtime.engine.suggest({ anchor: 'cat' })[0]?.word).toBe('hat');
    expect(reader.close).toHaveBeenCalledTimes(1);
  });

  it('retains the last known-good engine after failure and retries deterministically', async () => {
    const outcomes: Array<Promise<DecodedRhymeData>> = [
      Promise.resolve(decodedData('one', engineWithLabel('hat'))),
      Promise.reject(new Error('corrupt reload')),
      Promise.resolve(decodedData('two', engineWithLabel('night'))),
    ];
    const runtime = createRhymeEngineRuntime({
      decode: () => outcomes.shift() ?? Promise.reject(new Error('missing outcome')),
      initialVersion: 'pending',
      scheduleAfterFirstFrame: () => () => undefined,
      source: { open: async () => createReader(Uint8Array.of(1)) },
    });

    await runtime.retry();
    await runtime.retry();
    expect(runtime.getSnapshot()).toEqual({
      errorMessage: 'corrupt reload',
      state: 'error',
      usingLastKnownGood: true,
      version: 'one',
    });
    expect(runtime.engine.suggest({ anchor: 'cat' })[0]?.word).toBe('hat');
    await runtime.retry();
    expect(runtime.getSnapshot()).toEqual({ state: 'ready', usingLastKnownGood: false, version: 'two' });
    expect(runtime.engine.suggest({ anchor: 'cat' })[0]?.word).toBe('night');
  });

  it('prevents a stale overlapping load from replacing a newer result', async () => {
    const older = deferred<DecodedRhymeData>();
    const newer = deferred<DecodedRhymeData>();
    const outcomes = [older.promise, newer.promise];
    const runtime = createRhymeEngineRuntime({
      decode: () => outcomes.shift()!,
      initialVersion: 'pending',
      scheduleAfterFirstFrame: () => () => undefined,
      source: { open: async () => createReader(Uint8Array.of(1)) },
    });
    const olderAttempt = runtime.retry();
    await flushPromises();
    const newerAttempt = runtime.retry();
    newer.resolve(decodedData('newer', engineWithLabel('night')));
    await newerAttempt;
    older.resolve(decodedData('older', engineWithLabel('hat')));
    await olderAttempt;
    expect(runtime.getSnapshot().version).toBe('newer');
    expect(runtime.engine.suggest({ anchor: 'cat' })[0]?.word).toBe('night');
  });
});

function createReader(bytes: Uint8Array, reads: number[] = []): RhymeArtifactReader {
  let offset = 0;
  return {
    size: bytes.length,
    close: jest.fn(),
    read: jest.fn((maxBytes: number) => {
      reads.push(maxBytes);
      const chunk = bytes.slice(offset, offset + maxBytes);
      offset += chunk.length;
      return chunk;
    }),
  };
}

function decodedData(version: string, engine: RhymeEngine): DecodedRhymeData {
  return { artifactId: 'fixture', engine, sourceManifestSha256: '0'.repeat(64), version };
}

function engineWithLabel(word: string): RhymeEngine {
  return {
    suggest: () => [{
      familyKey: 'fixture', id: `fixture:${word}`, kind: 'exact', label: word,
      matchedSyllables: 1, normalizedWord: word, score: 1, word,
    }],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}
