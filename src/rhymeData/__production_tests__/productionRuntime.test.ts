/// <reference types="jest" />

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { decodeRhymeData } from '../decodeRhymeData';
import {
  PRODUCTION_RHYME_ARTIFACT_VERSION,
  PRODUCTION_RHYME_MANIFEST_SHA256,
} from '../productionArtifact';

jest.setTimeout(120_000);

describe('production rhyme runtime', () => {
  it('loads the production-scale artifact through the stable RhymeEngine seam', async () => {
    const artifact = readFileSync(
      path.join(process.cwd(), 'assets/rhyme/production.rhymebin'),
    );
    let yields = 0;
    const decoded = await decodeRhymeData(artifact, {
      expectedManifestSha256: PRODUCTION_RHYME_MANIFEST_SHA256,
      recordsPerChunk: 1024,
      sha256: async (bytes) => createHash('sha256').update(bytes).digest(),
      yieldToHost: async () => {
        yields += 1;
        await new Promise<void>((resolve) => setImmediate(resolve));
      },
    });

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
    expect(yields).toBeGreaterThan(1000);
    expect(Object.keys(decoded.engine)).toEqual(['suggest']);
  });
});
