/// <reference types="jest" />

import type { RhymeEngine } from '../../rhyme/RhymeEngine';
import type { DecodedRhymeData } from '../decodeRhymeData';
import {
  createRhymeEngineRuntime,
  type RhymeArtifactReader,
  type RhymeEngineRuntime,
} from '../rhymeEngineRuntime';

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
    const stableProxy = runtime.engine;

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
    expect(runtime.engine).toBe(stableProxy);
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

  it('cancels scheduled work and invalidates an in-flight generation', async () => {
    let scheduled: (() => void) | undefined;
    const cancelScheduled = jest.fn();
    const inFlight = deferred<DecodedRhymeData>();
    const source = { open: jest.fn(async () => createReader(Uint8Array.of(1))) };
    const runtime = createRhymeEngineRuntime({
      decode: () => inFlight.promise,
      initialVersion: 'pending',
      scheduleAfterFirstFrame(task) {
        scheduled = task;
        return cancelScheduled;
      },
      source,
    });

    runtime.start();
    runtime.cancel();
    scheduled?.();
    await flushPromises();
    expect(cancelScheduled).toHaveBeenCalledTimes(1);
    expect(source.open).not.toHaveBeenCalled();

    const attempt = runtime.retry();
    await flushPromises();
    runtime.cancel();
    inFlight.resolve(decodedData('stale', engineWithLabel('hat')));
    await attempt;
    expect(runtime.getSnapshot().version).toBe('pending');
    expect(runtime.engine.suggest({ anchor: 'cat' })).toEqual([]);
  });

  it('exposes generation cancellation to in-progress decoding', async () => {
    let shouldCancel: (() => boolean) | undefined;
    const decoding = deferred<DecodedRhymeData>();
    const runtime = createRhymeEngineRuntime({
      decode: (_bytes, isCancelled) => {
        shouldCancel = isCancelled;
        return decoding.promise;
      },
      initialVersion: 'pending',
      scheduleAfterFirstFrame: () => () => undefined,
      source: { open: async () => createReader(Uint8Array.of(1)) },
    });

    const attempt = runtime.retry();
    await flushPromises();
    expect(shouldCancel?.()).toBe(false);
    runtime.cancel();
    expect(shouldCancel?.()).toBe(true);
    decoding.resolve(decodedData('stale', engineWithLabel('hat')));
    await attempt;
  });

  it('isolates subscriber failures from state publication', async () => {
    const runtime = createRhymeEngineRuntime({
      decode: async () => decodedData('ready', engineWithLabel('hat')),
      initialVersion: 'pending',
      scheduleAfterFirstFrame: () => () => undefined,
      source: { open: async () => createReader(Uint8Array.of(1)) },
    });
    const healthySubscriber = jest.fn();
    const observedStates: string[] = [];
    runtime.subscribe(() => {
      throw new Error('subscriber failure');
    });
    runtime.subscribe(() => {
      observedStates.push(runtime.getSnapshot().state);
      healthySubscriber();
    });

    await expect(runtime.retry()).resolves.toBeUndefined();
    expect(runtime.getSnapshot().state).toBe('ready');
    expect(healthySubscriber).toHaveBeenCalledTimes(2);
    expect(observedStates).toEqual(['loading', 'ready']);
  });

  it('closes artifact readers after invalid size and read failures', async () => {
    const invalidSizeReader = createReader(Uint8Array.of(1));
    Object.defineProperty(invalidSizeReader, 'size', { value: 0 });
    const readFailureReader: RhymeArtifactReader = {
      size: 1,
      close: jest.fn(),
      read: jest.fn(() => {
        throw new Error('read failed');
      }),
    };
    const readers = [invalidSizeReader, readFailureReader];
    const runtime = createRhymeEngineRuntime({
      decode: async () => decodedData('ready', engineWithLabel('hat')),
      initialVersion: 'pending',
      scheduleAfterFirstFrame: () => () => undefined,
      source: { open: async () => readers.shift()! },
    });

    await runtime.retry();
    expect(invalidSizeReader.close).toHaveBeenCalledTimes(1);
    await runtime.retry();
    expect(readFailureReader.close).toHaveBeenCalledTimes(1);
    expect(runtime.getSnapshot()).toMatchObject({
      errorMessage: 'read failed',
      state: 'error',
    });
  });

  it('stops bounded reads and closes the reader when an attempt is cancelled', async () => {
    let runtime!: RhymeEngineRuntime;
    const reader: RhymeArtifactReader = {
      size: 3,
      close: jest.fn(),
      read: jest.fn(() => {
        runtime.cancel();
        return Uint8Array.of(1);
      }),
    };
    const decode = jest.fn(async () => decodedData('ready', engineWithLabel('hat')));
    runtime = createRhymeEngineRuntime({
      decode,
      initialVersion: 'pending',
      readChunkBytes: 1,
      scheduleAfterFirstFrame: () => () => undefined,
      source: { open: async () => reader },
      yieldToHost: async () => undefined,
    });

    await runtime.retry();

    expect(reader.read).toHaveBeenCalledTimes(1);
    expect(reader.close).toHaveBeenCalledTimes(1);
    expect(decode).not.toHaveBeenCalled();
  });

  it('does not schedule a duplicate initial load after an explicit retry', async () => {
    const schedule = jest.fn(() => () => undefined);
    const runtime = createRhymeEngineRuntime({
      decode: async () => decodedData('ready', engineWithLabel('hat')),
      initialVersion: 'pending',
      scheduleAfterFirstFrame: schedule,
      source: { open: async () => createReader(Uint8Array.of(1)) },
    });

    await runtime.retry();
    runtime.start();

    expect(schedule).not.toHaveBeenCalled();
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
