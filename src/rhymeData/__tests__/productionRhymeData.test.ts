/// <reference types="jest" />

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  RHYME_DATA_DIRECTORY_ENTRY_BYTES,
  RHYME_DATA_HEADER_BYTES,
  RhymeDataSection,
} from '../binaryFormat';
import { decodeRhymeData } from '../decodeRhymeData';

const productionArtifactPath = path.join(
  process.cwd(),
  'assets/rhyme/production.rhymebin',
);
const productionManifestPath = path.join(
  process.cwd(),
  'data/rhyme-production/manifest.json',
);
const productionArtifact = readFileSync(productionArtifactPath);
const productionArtifactSha256 =
  '204a1471633da57ef447006b8d45128358b993deb085b4243c7067b7b61ab12d';
const productionManifestSha256 = createHash('sha256')
  .update(readFileSync(productionManifestPath))
  .digest('hex');

jest.setTimeout(30000);

describe('Phase 04A production rhyme data artifact', () => {
  it('is a production-scale deterministic artifact below the bounded loader cap', () => {
    expect(productionArtifact.length).toBeGreaterThan(10 * 1024 * 1024);
    expect(productionArtifact.length).toBeLessThan(64 * 1024 * 1024);
    expect(createHash('sha256').update(productionArtifact).digest('hex')).toBe(
      productionArtifactSha256,
    );
    expect(productionManifestSha256).toBe(
      '9df2e79105888978c3c89b0304cd2f6e8815a353b8c311a9c564b47c3379280a',
    );
    expect(getSection(productionArtifact, RhymeDataSection.words).count)
      .toBeGreaterThan(100000);
    expect(getSection(productionArtifact, RhymeDataSection.pronunciations).count)
      .toBeGreaterThan(125000);
    expect(getSection(productionArtifact, RhymeDataSection.sources).count)
      .toBe(9);
  });

  it('decodes through the production runtime contract with bounded yields and policy flags', async () => {
    const yields = jest.fn(async () => undefined);
    const decoded = await decodeRhymeData(productionArtifact, {
      expectedManifestSha256: productionManifestSha256,
      recordsPerChunk: 4096,
      sha256,
      yieldToHost: yields,
    });

    expect(decoded).toMatchObject({
      artifactId: 'lyricslab-production-rhyme',
      sourceManifestSha256: productionManifestSha256,
      version: '2026.07.12-phase04a',
    });
    expect(yields).toHaveBeenCalled();
    expect(decoded.engine.suggest({ anchor: 'cat', maxResults: 8 }))
      .toHaveLength(8);

    // Ordinary profanity remains eligible.
    expect(
      decoded.engine.suggest({ anchor: 'fit', maxResults: 100 })
        .map(({ normalizedWord }) => normalizedWord),
    ).toContain('shit');

    // Safety-blocked and proper-noun entries remain analyzable as anchors but
    // are not returned as unsolicited candidates by the dormant engine.
    expect(decoded.engine.suggest({ anchor: 'chink', maxResults: 8 }).length)
      .toBeGreaterThan(0);
    expect(
      decoded.engine.suggest({ anchor: 'think', maxResults: 100 })
        .map(({ normalizedWord }) => normalizedWord),
    ).not.toContain('chink');
    expect(decoded.engine.suggest({ anchor: 'austin', maxResults: 8 }).length)
      .toBeGreaterThan(0);
    expect(
      decoded.engine.suggest({ anchor: 'boston', maxResults: 100 })
        .map(({ normalizedWord }) => normalizedWord),
    ).not.toContain('austin');
  });
});

async function sha256(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest();
}

function getSection(bytes: Uint8Array, sectionId: number) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sectionCount = view.getUint16(20, true);
  for (let index = 0; index < sectionCount; index += 1) {
    const descriptor = RHYME_DATA_HEADER_BYTES + index * RHYME_DATA_DIRECTORY_ENTRY_BYTES;
    if (view.getUint16(descriptor, true) === sectionId) {
      return {
        count: view.getUint32(descriptor + 12, true),
        length: view.getUint32(descriptor + 8, true),
        offset: view.getUint32(descriptor + 4, true),
        width: view.getUint16(descriptor + 2, true),
      };
    }
  }
  throw new Error(`Missing test section ${sectionId}`);
}
