import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildRhymeData } from './build-rhyme-data.mjs';
import { HEADER_BYTES, SECTION } from './rhyme-data/format.mjs';

const root = path.resolve(import.meta.dirname, '..');
const manifest = path.join(root, 'data/rhyme-production-manifest.json');
const committed = path.join(root, 'assets/rhyme/production.rhymebin');
const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), 'lyricslab-production-rhyme-data-test-'),
);

try {
  const first = path.join(temporaryDirectory, 'first.rhymebin');
  const second = path.join(temporaryDirectory, 'second.rhymebin');
  await buildRhymeData(['--manifest', manifest, '--output', first]);
  await buildRhymeData(['--manifest', manifest, '--output', second]);
  const [firstBytes, secondBytes, committedBytes, manifestBytes] = await Promise.all([
    readFile(first),
    readFile(second),
    readFile(committed),
    readFile(manifest),
  ]);
  assert.deepEqual(firstBytes, secondBytes, 'clean production builds differ');
  assert.deepEqual(firstBytes, committedBytes, 'committed production artifact is stale');
  assert.equal(
    committedBytes.subarray(24, 56).toString('hex'),
    sha256(manifestBytes),
    'artifact manifest hash does not match production manifest',
  );
  const productionConstants = await readFile(
    path.join(root, 'src/rhymeData/productionArtifact.ts'),
    'utf8',
  );
  assert.match(productionConstants, new RegExp(sha256(manifestBytes), 'u'));
  assert.match(
    productionConstants,
    /cmudict-74790861-subtlex-2\.0\.0-phase04-2026\.07\.12/u,
  );
  assert.ok(committedBytes.length < 64 * 1024 * 1024);
  const sections = readSections(committedBytes);
  assert.ok(sections.get(SECTION.WORDS).count >= 120000);
  assert.ok(sections.get(SECTION.PRONUNCIATIONS).count >= sections.get(SECTION.WORDS).count);
  assert.equal(sections.get(SECTION.SOURCES).count, 12);
  const beforeCheck = await stat(committed, { bigint: true });
  await buildRhymeData([
    '--check',
    '--manifest',
    manifest,
    '--output',
    committed,
  ]);
  const afterCheck = await stat(committed, { bigint: true });
  assert.equal(afterCheck.mtimeNs, beforeCheck.mtimeNs);
  assert.equal(afterCheck.size, beforeCheck.size);
  process.stdout.write(
    `production rhyme data controls passed: ${committedBytes.length} bytes ${sha256(committedBytes)}\n`,
  );
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}

function readSections(bytes) {
  const sections = new Map();
  const count = bytes.readUInt16LE(20);
  for (let index = 0; index < count; index += 1) {
    const offset = HEADER_BYTES + index * 24;
    sections.set(bytes.readUInt16LE(offset), {
      count: bytes.readUInt32LE(offset + 12),
      length: bytes.readUInt32LE(offset + 8),
      offset: bytes.readUInt32LE(offset + 4),
      width: bytes.readUInt16LE(offset + 2),
    });
  }
  return sections;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
