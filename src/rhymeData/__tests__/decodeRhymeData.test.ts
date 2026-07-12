/// <reference types="jest" />

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { RHYME_DATA_HEADER_BYTES } from '../binaryFormat';
import { decodeRhymeData } from '../decodeRhymeData';

const artifact = readFileSync(
  path.join(process.cwd(), 'assets/rhyme/fixture.rhymebin'),
);
const manifestHash = createHash('sha256')
  .update(readFileSync(path.join(process.cwd(), 'data/rhyme-fixture/manifest.json')))
  .digest('hex');

describe('rhyme data decoder', () => {
  it('validates the fixture and creates the Phase 02 engine behind its public seam', async () => {
    const yields = jest.fn(async () => undefined);
    const decoded = await decodeRhymeData(artifact, {
      expectedManifestSha256: manifestHash,
      recordsPerChunk: 2,
      sha256,
      yieldToHost: yields,
    });

    expect(decoded).toMatchObject({
      artifactId: 'lyricslab-project-fixture',
      sourceManifestSha256: manifestHash,
      version: 'fixture-1',
    });
    expect(decoded.engine.suggest({ anchor: 'cat' })).toEqual([
      expect.objectContaining({ normalizedWord: 'hat', kind: 'exact' }),
    ]);
    expect(yields).toHaveBeenCalled();
    expect(Object.keys(decoded.engine)).toEqual(['suggest']);
  });

  it.each([
    ['truncation', (bytes: Uint8Array) => bytes.subarray(0, bytes.length - 1), 'total size'],
    ['format version', (bytes: Uint8Array) => mutate(bytes, (view) => view.setUint16(8, 99, true)), 'format version'],
    ['payload corruption', (bytes: Uint8Array) => mutate(bytes, (_view, copy) => { copy[copy.length - 1] ^= 1; }), 'payload hash'],
    ['duplicate section', (bytes: Uint8Array) => mutateAndRehash(bytes, (view) => view.setUint16(96, view.getUint16(120, true), true)), 'Duplicate'],
    ['overlapping sections', (bytes: Uint8Array) => mutateAndRehash(bytes, (view) => view.setUint32(124, view.getUint32(100, true), true)), 'overlap'],
    ['out-of-bounds section', (bytes: Uint8Array) => mutateAndRehash(bytes, (view) => view.setUint32(124, bytes.length + 4, true)), 'out of bounds'],
  ])('rejects %s', async (_label, change, message) => {
    await expect(decodeRhymeData(change(artifact), { sha256 })).rejects.toThrow(message);
  });

  it('rejects a manifest hash mismatch independently of payload integrity', async () => {
    await expect(
      decodeRhymeData(artifact, {
        expectedManifestSha256: '0'.repeat(64),
        sha256,
      }),
    ).rejects.toThrow('manifest hash mismatch');
  });
});

function mutate(bytes: Uint8Array, edit: (view: DataView, copy: Uint8Array) => void) {
  const copy = Uint8Array.from(bytes);
  edit(new DataView(copy.buffer), copy);
  return copy;
}

function mutateAndRehash(bytes: Uint8Array, edit: (view: DataView, copy: Uint8Array) => void) {
  const copy = mutate(bytes, edit);
  copy.set(createHash('sha256').update(copy.subarray(RHYME_DATA_HEADER_BYTES)).digest(), 56);
  return copy;
}

async function sha256(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest();
}
