/// <reference types="jest" />
/// <reference types="node" />

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { decodeRhymeData } from '../decodeRhymeData';
import {
  RHYME_DATA_DIRECTORY_ENTRY_BYTES,
  RHYME_DATA_HEADER_BYTES,
  RhymeDataSection,
} from '../binaryFormat';
import {
  PRODUCTION_RHYME_ARTIFACT_VERSION,
  PRODUCTION_RHYME_MANIFEST_SHA256,
} from '../productionArtifact';

jest.setTimeout(120_000);

const MAX_RETAINED_HEAP_BYTES = 256 * 1024 * 1024;
const MAX_RETAINED_RSS_BYTES = 384 * 1024 * 1024;
const MAX_STARTUP_MS = 6_000;
const MAX_WARM_P50_MS = 50;
const MAX_WARM_P95_MS = 100;
const MAX_COLD_P95_MS = 200;
const MAX_COLD_QUERY_MS = 250;
const MAX_QUERY_CACHE_HEAP_BYTES = 64 * 1024 * 1024;
const MAX_QUERY_CACHE_RSS_BYTES = 128 * 1024 * 1024;

describe('production rhyme runtime', () => {
  it('retains a compact indexed engine with mobile-compatible host guardrails', async () => {
    if (typeof global.gc !== 'function') {
      throw new Error('production runtime probe requires node --expose-gc');
    }
    global.gc();
    const memoryBefore = process.memoryUsage();
    const artifact = readFileSync(
      path.join(process.cwd(), 'assets/rhyme/production.rhymebin'),
    );
    let yields = 0;
    const startedAt = performance.now();
    const decoded = await decodeRhymeData(artifact, {
      expectedManifestSha256: PRODUCTION_RHYME_MANIFEST_SHA256,
      recordsPerChunk: 1024,
      sha256: async (bytes) => createHash('sha256').update(bytes).digest(),
      yieldToHost: async () => {
        yields += 1;
        await new Promise<void>((resolve) => setImmediate(resolve));
      },
    });
    const startupMs = performance.now() - startedAt;
    global.gc();
    const memoryAfter = process.memoryUsage();

    expect(decoded).toMatchObject({
      artifactId: 'lyricslab-production-rhyme-data',
      sourceManifestSha256: PRODUCTION_RHYME_MANIFEST_SHA256,
      version: PRODUCTION_RHYME_ARTIFACT_VERSION,
    });
    expect(decoded.engine.suggest({ anchor: 'cat', maxResults: 8 })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'exact', normalizedWord: 'hat' }),
      ]),
    );
    expect(decoded.engine.suggest({ anchor: 'bet' })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'slant', normalizedWord: 'cat' }),
      ]),
    );
    expect(decoded.policy?.get('chink')).toEqual({
      properNoun: false,
      rap: true,
      safetyBlocked: true,
    });
    expect(decoded.policy?.get('atl')).toEqual({
      properNoun: true,
      rap: true,
      safetyBlocked: false,
    });
    expect(decoded.engine.suggest({ anchor: 'chink', maxResults: 8 }).length).toBeGreaterThan(0);
    expect(decoded.engine.suggest({ anchor: 'think', maxResults: 100 }))
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ normalizedWord: 'chink' })]));
    expect(decoded.engine.suggest({ anchor: 'bell', maxResults: 100 }))
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ normalizedWord: 'atl' })]));

    const warmDurations: number[] = [];
    for (let index = 0; index < 40; index += 1) {
      const queryStartedAt = performance.now();
      decoded.engine.suggest({ anchor: index % 2 === 0 ? 'cat' : 'light', maxResults: 8 });
      warmDurations.push(performance.now() - queryStartedAt);
    }
    warmDurations.sort((left, right) => left - right);
    const p50 = percentile(warmDurations, 0.5);
    const p95 = percentile(warmDurations, 0.95);

    global.gc();
    const cacheBefore = process.memoryUsage();
    const coldMeasurements = sampleAnchors(artifact, 64).map((anchor) => {
      const queryStartedAt = performance.now();
      decoded.engine.suggest({ anchor, maxResults: 8 });
      return { anchor, durationMs: performance.now() - queryStartedAt };
    }).sort((left, right) => left.durationMs - right.durationMs);
    const coldDurations = coldMeasurements.map(({ durationMs }) => durationMs);
    global.gc();
    const cacheAfter = process.memoryUsage();
    const coldP50 = percentile(coldDurations, 0.5);
    const coldP95 = percentile(coldDurations, 0.95);
    const coldMax = coldDurations.at(-1) ?? 0;

    console.log(JSON.stringify({
      retainedHeapBytes: memoryAfter.heapUsed - memoryBefore.heapUsed,
      retainedRssBytes: memoryAfter.rss - memoryBefore.rss,
      startupMs,
      warmP50Ms: p50,
      warmP95Ms: p95,
      coldP50Ms: coldP50,
      coldP95Ms: coldP95,
      coldMaxMs: coldMax,
      queryCacheHeapBytes: cacheAfter.heapUsed - cacheBefore.heapUsed,
      queryCacheRssBytes: cacheAfter.rss - cacheBefore.rss,
      slowestColdQueries: coldMeasurements.slice(-5),
    }));

    expect(memoryAfter.heapUsed - memoryBefore.heapUsed).toBeLessThan(MAX_RETAINED_HEAP_BYTES);
    expect(memoryAfter.rss - memoryBefore.rss).toBeLessThan(MAX_RETAINED_RSS_BYTES);
    expect(startupMs).toBeLessThan(MAX_STARTUP_MS);
    expect(p50).toBeLessThan(MAX_WARM_P50_MS);
    expect(p95).toBeLessThan(MAX_WARM_P95_MS);
    expect(coldP95).toBeLessThan(MAX_COLD_P95_MS);
    expect(coldMax).toBeLessThan(MAX_COLD_QUERY_MS);
    expect(cacheAfter.heapUsed - cacheBefore.heapUsed).toBeLessThan(
      MAX_QUERY_CACHE_HEAP_BYTES,
    );
    expect(cacheAfter.rss - cacheBefore.rss).toBeLessThan(
      MAX_QUERY_CACHE_RSS_BYTES,
    );
    expect(yields).toBeGreaterThan(1000);
    expect(Object.keys(decoded.engine)).toEqual(['suggest']);
  });

  it('cancels a production decode at its first cooperative boundary', async () => {
    const artifact = readFileSync(
      path.join(process.cwd(), 'assets/rhyme/production.rhymebin'),
    );
    let cancelled = false;
    let yields = 0;

    await expect(decodeRhymeData(artifact, {
      recordsPerChunk: 1024,
      sha256: async (bytes) => createHash('sha256').update(bytes).digest(),
      shouldCancel: () => cancelled,
      yieldToHost: async () => {
        yields += 1;
        cancelled = true;
      },
    })).rejects.toThrow('cancelled');
    expect(yields).toBe(1);
  });
});

function percentile(values: readonly number[], percentileValue: number) {
  return values[Math.min(values.length - 1, Math.ceil(values.length * percentileValue) - 1)] ?? 0;
}

function sampleAnchors(bytes: Uint8Array, count: number) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const strings = readStrings(bytes, view);
  const words = getSection(view, RhymeDataSection.words);
  const anchors: string[] = [];
  for (let sample = 0; sample < count; sample += 1) {
    const wordId = Math.floor(sample * words.count / count);
    const offset = words.offset + wordId * words.width;
    anchors.push(strings[view.getUint32(offset + 4, true)] ?? '');
  }
  return anchors.filter(Boolean);
}

function readStrings(bytes: Uint8Array, view: DataView) {
  const blob = getSection(view, RhymeDataSection.stringBytes);
  const index = getSection(view, RhymeDataSection.stringIndex);
  const decoder = new TextDecoder();
  return Array.from({ length: index.count }, (_value, record) => {
    const offset = index.offset + record * index.width;
    const start = view.getUint32(offset, true);
    const length = view.getUint32(offset + 4, true);
    return decoder.decode(bytes.subarray(blob.offset + start, blob.offset + start + length));
  });
}

function getSection(view: DataView, sectionId: number) {
  const count = view.getUint16(20, true);
  for (let index = 0; index < count; index += 1) {
    const offset = RHYME_DATA_HEADER_BYTES +
      index * RHYME_DATA_DIRECTORY_ENTRY_BYTES;
    if (view.getUint16(offset, true) === sectionId) {
      return {
        count: view.getUint32(offset + 12, true),
        offset: view.getUint32(offset + 4, true),
        width: view.getUint16(offset + 2, true),
      };
    }
  }
  throw new Error(`Missing production test section ${sectionId}`);
}
