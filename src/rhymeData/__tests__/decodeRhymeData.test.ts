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

  it('yields while decoding every potentially large record table', async () => {
    const yields = jest.fn(async () => undefined);
    await decodeRhymeData(artifact, {
      recordsPerChunk: 1,
      sha256,
      yieldToHost: yields,
    });

    const chunkedSections = [
      RhymeDataSection.stringIndex,
      RhymeDataSection.phones,
      RhymeDataSection.words,
      RhymeDataSection.pronunciations,
      RhymeDataSection.phoneIds,
      RhymeDataSection.exactIndex,
      RhymeDataSection.slantIndex,
      RhymeDataSection.ranks,
      RhymeDataSection.flags,
      RhymeDataSection.sources,
    ];
    const minimumYields = chunkedSections.reduce(
      (sum, sectionId) => sum + getSection(artifact, sectionId).count,
      0,
    );

    expect(yields.mock.calls.length).toBeGreaterThanOrEqual(minimumYields);
  });

  it.each([
    ['truncation', (bytes: Uint8Array) => bytes.subarray(0, bytes.length - 1), 'total size'],
    ['format version', (bytes: Uint8Array) => mutate(bytes, (view) => view.setUint16(8, 99, true)), 'format version'],
    ['reserved header bytes', (bytes: Uint8Array) => mutate(bytes, (_view, copy) => { copy[88] = 1; }), 'reserved header'],
    ['payload corruption', (bytes: Uint8Array) => mutate(bytes, (_view, copy) => { copy[copy.length - 1] ^= 1; }), 'payload hash'],
    ['duplicate section', (bytes: Uint8Array) => mutateAndRehash(bytes, (view) => view.setUint16(96, view.getUint16(120, true), true)), 'Duplicate'],
    ['unknown section', (bytes: Uint8Array) => mutateAndRehash(bytes, (view) => view.setUint16(96, 99, true)), 'Unknown'],
    ['record width mismatch', (bytes: Uint8Array) => mutateAndRehash(bytes, (view) => view.setUint16(98, 99, true)), 'record width'],
    ['record count mismatch', (bytes: Uint8Array) => mutateAndRehash(bytes, (view) => view.setUint32(108, 2, true)), 'length/count'],
    ['misaligned section', (bytes: Uint8Array) => mutateAndRehash(bytes, (view) => view.setUint32(100, view.getUint32(100, true) + 1, true)), 'misaligned'],
    ['overlapping sections', (bytes: Uint8Array) => mutateAndRehash(bytes, (view) => view.setUint32(124, view.getUint32(100, true), true)), 'overlap'],
    ['out-of-bounds section', (bytes: Uint8Array) => mutateAndRehash(bytes, (view) => view.setUint32(124, bytes.length + 4, true)), 'out of bounds|padding'],
  ])('rejects %s', async (_label, change, message) => {
    await expect(decodeRhymeData(change(artifact), { sha256 })).rejects.toThrow(
      new RegExp(message, 'u'),
    );
  });

  it('rejects a manifest hash mismatch independently of payload integrity', async () => {
    await expect(
      decodeRhymeData(artifact, {
        expectedManifestSha256: '0'.repeat(64),
        sha256,
      }),
    ).rejects.toThrow('manifest hash mismatch');
  });

  it('rejects non-zero descriptor and section padding bytes', async () => {
    const descriptorReserved = mutateAndRehash(artifact, (view) => {
      view.setUint32(RHYME_DATA_HEADER_BYTES + 16, 1, true);
    });
    await expect(decodeRhymeData(descriptorReserved, { sha256 })).rejects.toThrow(
      'reserved section descriptor',
    );

    const paddingOffset = findPaddingOffset(artifact);
    expect(paddingOffset).not.toBeNull();
    const nonZeroPadding = mutateAndRehash(artifact, (_view, copy) => {
      copy[paddingOffset!] = 1;
    });
    await expect(decodeRhymeData(nonZeroPadding, { sha256 })).rejects.toThrow(
      'padding',
    );
  });

  it('rejects overlapping pronunciation phone ownership', async () => {
    const malformed = mutateAndRehash(artifact, (view) => {
      const pronunciations = getSection(artifact, RhymeDataSection.pronunciations);
      const firstPhoneStart = view.getUint32(pronunciations.offset + 4, true);
      view.setUint32(pronunciations.offset + pronunciations.width + 4, firstPhoneStart, true);
    });

    await expect(decodeRhymeData(malformed, { sha256 })).rejects.toThrow(
      'Pronunciation phone ranges',
    );
  });

  it('rejects pronunciation keys that disagree with their phone sequence', async () => {
    const malformed = mutateAndRehash(artifact, (view) => {
      const pronunciations = getSection(artifact, RhymeDataSection.pronunciations);
      const phoneIds = getSection(artifact, RhymeDataSection.phoneIds);
      const phoneStart = view.getUint32(pronunciations.offset + 4, true);
      const phoneCount = view.getUint32(pronunciations.offset + 8, true);
      const tailPhoneOffset = phoneIds.offset + (phoneStart + phoneCount - 1) * phoneIds.width;
      const currentPhoneId = view.getUint32(tailPhoneOffset, true);
      view.setUint32(tailPhoneOffset, currentPhoneId === 0 ? 1 : 0, true);
    });

    await expect(decodeRhymeData(malformed, { sha256 })).rejects.toThrow(
      'pronunciation key',
    );
  });

  it('rejects oversized and invalid UTF-8 string records', async () => {
    const stringIndex = getSection(artifact, RhymeDataSection.stringIndex);
    const oversized = mutateAndRehash(artifact, (view) => {
      view.setUint32(stringIndex.offset + 4, 4097, true);
    });
    await expect(decodeRhymeData(oversized, { sha256 })).rejects.toThrow(
      'bounded format limit',
    );

    const stringBytes = getSection(artifact, RhymeDataSection.stringBytes);
    const invalidUtf8 = mutateAndRehash(artifact, (_view, copy) => {
      copy[stringBytes.offset] = 0xff;
    });
    await expect(decodeRhymeData(invalidUtf8, { sha256 })).rejects.toThrow(
      'invalid UTF-8',
    );
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

function findPaddingOffset(bytes: Uint8Array) {
  const sections = Object.values(RhymeDataSection)
    .map((sectionId) => getSection(bytes, sectionId))
    .sort((left, right) => left.offset - right.offset);
  let cursor = RHYME_DATA_HEADER_BYTES +
    sections.length * RHYME_DATA_DIRECTORY_ENTRY_BYTES;
  for (const section of sections) {
    if (section.offset > cursor) return cursor;
    cursor = section.offset + section.length;
  }
  return cursor < bytes.length ? cursor : null;
}
