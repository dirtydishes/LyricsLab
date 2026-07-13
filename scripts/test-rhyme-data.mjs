import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildRhymeData } from './build-rhyme-data.mjs';
import {
  createRhymeKeys,
  createSlantBucketKey,
  isValidArpabetPhone,
} from './rhyme-data/phonology.mjs';

const root = path.resolve(import.meta.dirname, '..');
const fixtureDirectory = path.join(root, 'data/rhyme-fixture');
const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), 'lyricslab-rhyme-data-test-'),
);

try {
  await verifyDeterministicBuilds();
  await verifyManifestFailures();
  verifyCompilerPhonology();
  process.stdout.write('rhyme data compiler controls passed\n');
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}

async function verifyDeterministicBuilds() {
  const first = path.join(temporaryDirectory, 'first.rhymebin');
  const second = path.join(temporaryDirectory, 'second.rhymebin');
  const arguments_ = ['--manifest', path.join(fixtureDirectory, 'manifest.json')];
  await buildRhymeData([...arguments_, '--output', first]);
  await buildRhymeData([...arguments_, '--output', second]);
  assert.deepEqual(await readFile(first), await readFile(second));
}

async function verifyManifestFailures() {
  const copiedFixture = path.join(temporaryDirectory, 'fixture');
  await cp(fixtureDirectory, copiedFixture, { recursive: true });
  const manifestPath = path.join(copiedFixture, 'manifest.json');
  const originalManifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  await writeManifest({
    ...originalManifest,
    sources: [{ ...originalManifest.sources[0], sha256: '0'.repeat(64) }],
  });
  await assertBuildRejects(manifestPath, /Source hash mismatch/u);

  await writeManifest({ ...originalManifest, unexpected: true });
  await assertBuildRejects(manifestPath, /fields do not match/u);

  const originalLexemes = JSON.parse(
    await readFile(path.join(copiedFixture, 'lexemes.json'), 'utf8'),
  );
  const lexemes = structuredClone(originalLexemes);
  lexemes[0].pronunciations = [['B1', 'AE1', 'T']];
  await writeFile(path.join(copiedFixture, 'lexemes.json'), JSON.stringify(lexemes));
  const lexemeHash = createHash('sha256')
    .update(await readFile(path.join(copiedFixture, 'lexemes.json')))
    .digest('hex');
  await writeManifest({
    ...originalManifest,
    sources: [{ ...originalManifest.sources[0], sha256: lexemeHash }],
  });
  await assertBuildRejects(manifestPath, /invalid pronunciation/u);

  const duplicatePronunciations = structuredClone(originalLexemes);
  duplicatePronunciations[0].pronunciations.push(
    [...duplicatePronunciations[0].pronunciations[0]],
  );
  await writeFile(
    path.join(copiedFixture, 'lexemes.json'),
    JSON.stringify(duplicatePronunciations),
  );
  const duplicateHash = createHash('sha256')
    .update(await readFile(path.join(copiedFixture, 'lexemes.json')))
    .digest('hex');
  await writeManifest({
    ...originalManifest,
    sources: [{ ...originalManifest.sources[0], sha256: duplicateHash }],
  });
  await assertBuildRejects(manifestPath, /duplicate pronunciation/u);

  const duplicateRanks = structuredClone(originalLexemes);
  duplicateRanks[1].rank = duplicateRanks[0].rank;
  await writeFile(
    path.join(copiedFixture, 'lexemes.json'),
    JSON.stringify(duplicateRanks),
  );
  const duplicateRankHash = createHash('sha256')
    .update(await readFile(path.join(copiedFixture, 'lexemes.json')))
    .digest('hex');
  await writeManifest({
    ...originalManifest,
    sources: [{ ...originalManifest.sources[0], sha256: duplicateRankHash }],
  });
  await assertBuildRejects(manifestPath, /ranks must be a contiguous permutation/u);

  originalLexemes[0].normalizedWord = ' CAT ';
  await writeFile(
    path.join(copiedFixture, 'lexemes.json'),
    JSON.stringify(originalLexemes),
  );
  const nonCanonicalHash = createHash('sha256')
    .update(await readFile(path.join(copiedFixture, 'lexemes.json')))
    .digest('hex');
  await writeManifest({
    ...originalManifest,
    sources: [{ ...originalManifest.sources[0], sha256: nonCanonicalHash }],
  });
  await assertBuildRejects(manifestPath, /normalizedWord must be canonical/u);

  const outsideSource = path.join(temporaryDirectory, 'outside.json');
  await writeFile(
    outsideSource,
    await readFile(path.join(fixtureDirectory, 'lexemes.json')),
  );
  const outsideHash = createHash('sha256')
    .update(await readFile(outsideSource))
    .digest('hex');
  await writeManifest({
    ...originalManifest,
    sources: [
      {
        ...originalManifest.sources[0],
        path: '../outside.json',
        sha256: outsideHash,
      },
    ],
  });
  await assertBuildRejects(manifestPath, /escapes its directory/u);

  async function writeManifest(manifest) {
    await writeFile(manifestPath, JSON.stringify(manifest));
  }
}

function verifyCompilerPhonology() {
  assert.deepEqual(
    createRhymeKeys(['F', 'AE1', 'S', 'T', 'IY2', 'T']),
    {
      exactKey: 'AE1 S T IY2 T',
      familyKey: 'v:AE|c:fricative|c:stop|v:IY|c:stop',
    },
  );
  assert.equal(isValidArpabetPhone('B1'), false);
  assert.equal(isValidArpabetPhone('B'), true);
  assert.equal(isValidArpabetPhone('AE1'), true);
  assert.equal(isValidArpabetPhone('AE'), false);
  assert.equal(isValidArpabetPhone('AE3'), false);
  assert.equal(isValidArpabetPhone('ae1'), false);
  assert.equal(isValidArpabetPhone('ZZ'), false);
  assert.equal(
    createSlantBucketKey('v:AE|c:fricative|c:stop|c:liquid'),
    createSlantBucketKey('v:AE|c:stop|c:liquid'),
  );
  assert.equal(
    createSlantBucketKey('v:AE|c:stop|v:AE|c:stop|v:AE|c:stop|v:AE|c:stop'),
    'vc:4',
  );
}

async function assertBuildRejects(manifestPath, pattern) {
  await assert.rejects(
    buildRhymeData([
      '--manifest',
      manifestPath,
      '--output',
      path.join(temporaryDirectory, 'bad.rhymebin'),
    ]),
    pattern,
  );
}
