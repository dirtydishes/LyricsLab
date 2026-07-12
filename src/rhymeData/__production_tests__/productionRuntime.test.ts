/// <reference types="jest" />
/// <reference types="node" />

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { decodeRhymeData } from '../decodeRhymeData';
import {
  PRODUCTION_RHYME_ARTIFACT_VERSION,
  PRODUCTION_RHYME_MANIFEST_SHA256,
} from '../productionArtifact';

jest.setTimeout(120_000);

const MAX_RETAINED_HEAP_BYTES = 256 * 1024 * 1024;
const MAX_RETAINED_RSS_BYTES = 384 * 1024 * 1024;
const MAX_STARTUP_MS = 5_000;
const MAX_WARM_P50_MS = 50;
const MAX_WARM_P95_MS = 100;

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

    expect(memoryAfter.heapUsed - memoryBefore.heapUsed).toBeLessThan(MAX_RETAINED_HEAP_BYTES);
    expect(memoryAfter.rss - memoryBefore.rss).toBeLessThan(MAX_RETAINED_RSS_BYTES);
    expect(startupMs).toBeLessThan(MAX_STARTUP_MS);
    expect(p50).toBeLessThan(MAX_WARM_P50_MS);
    expect(p95).toBeLessThan(MAX_WARM_P95_MS);
    expect(yields).toBeGreaterThan(1000);
    expect(Object.keys(decoded.engine)).toEqual(['suggest']);

    console.log(JSON.stringify({
      retainedHeapBytes: memoryAfter.heapUsed - memoryBefore.heapUsed,
      retainedRssBytes: memoryAfter.rss - memoryBefore.rss,
      startupMs,
      warmP50Ms: p50,
      warmP95Ms: p95,
    }));
  });
});

function percentile(values: readonly number[], percentileValue: number) {
  return values[Math.min(values.length - 1, Math.ceil(values.length * percentileValue) - 1)] ?? 0;
}
