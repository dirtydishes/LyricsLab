import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildRhymeData } from './build-rhyme-data.mjs';

const root = path.resolve(import.meta.dirname, '..');
const fixtureDirectory = path.join(root, 'data/rhyme-fixture');
const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), 'lyricslab-rhyme-data-test-'),
);
const first = path.join(temporaryDirectory, 'first.rhymebin');
const second = path.join(temporaryDirectory, 'second.rhymebin');

await buildRhymeData([
  '--manifest',
  path.join(fixtureDirectory, 'manifest.json'),
  '--output',
  first,
]);
await buildRhymeData([
  '--manifest',
  path.join(fixtureDirectory, 'manifest.json'),
  '--output',
  second,
]);
assert.deepEqual(await readFile(first), await readFile(second));

const copiedFixture = path.join(temporaryDirectory, 'fixture');
await cp(fixtureDirectory, copiedFixture, { recursive: true });
const manifestPath = path.join(copiedFixture, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.sources[0].sha256 = '0'.repeat(64);
await writeFile(manifestPath, JSON.stringify(manifest));
await assert.rejects(
  buildRhymeData(['--manifest', manifestPath, '--output', path.join(temporaryDirectory, 'bad')]),
  /Source hash mismatch/u,
);

manifest.sources[0].sha256 = createHash('sha256')
  .update(await readFile(path.join(copiedFixture, 'lexemes.json')))
  .digest('hex');
manifest.unexpected = true;
await writeFile(manifestPath, JSON.stringify(manifest));
await assert.rejects(
  buildRhymeData(['--manifest', manifestPath, '--output', path.join(temporaryDirectory, 'bad')]),
  /fields do not match/u,
);

process.stdout.write('rhyme data compiler controls passed\n');
