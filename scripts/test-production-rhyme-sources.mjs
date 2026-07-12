import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import {
  assembleProductionLexemes,
  verifySubtlexPackage,
} from './rhyme-data/productionSources.mjs';

const traversalTarball = gzipSync(createTar('../escape', Buffer.from('nope')));
await assert.rejects(
  async () => verifySubtlexPackage(traversalTarball, pinForTar(traversalTarball)),
  /archive path/u,
);

const linkTarball = gzipSync(createTar('package/index.json', Buffer.from('{}'), '2'));
await assert.rejects(
  async () => verifySubtlexPackage(linkTarball, pinForTar(linkTarball)),
  /regular file/u,
);

const corruptedHeader = createTar('package/index.json', Buffer.from('{}'));
corruptedHeader[100] ^= 1;
await assert.rejects(
  async () => {
    const tarball = gzipSync(corruptedHeader);
    return verifySubtlexPackage(tarball, pinForTar(tarball));
  },
  /checksum/u,
);

const provenance = JSON.parse(
  await readFile(path.resolve('data/rhyme-production/provenance.json'), 'utf8'),
);
assert.equal(
  provenance.cmudict.revision,
  '74790861f652b15e4ac49015a90074ad62a27690',
);
assert.equal(
  provenance.subtlex.integrity,
  'sha512-N/8uDDV4zD+PZNOCKvhBfOfSQo2CAKb/icKRsWQpRBNw9nh0Pt+Pt/fQIRaEpaawVIPSlyTekf9zHX/zQi0+Yg==',
);
assert.match(provenance.subtlex.citation, /10\.3758\/BRM\.41\.4\.977/u);
assert.match(provenance.subtlex.upstreamCaveat, /does not state an ISC license/u);
const verifiedPackage = verifySubtlexPackage(
  await readFile(path.join(
    path.resolve('data/rhyme-production'),
    'subtlex-word-frequencies-2.0.0.tgz',
  )),
  provenance.subtlex,
);
assert.equal(verifiedPackage.frequencies.length, 74286);
assert.deepEqual(verifiedPackage.frequencies[0], { word: 'you', count: 2134713 });
assert.equal(verifiedPackage.packageMetadata.name, 'subtlex-word-frequencies');
assert.equal(verifiedPackage.packageMetadata.version, '2.0.0');
assert.match(verifiedPackage.license, /Copyright \(c\) 2015 Zeke Sikelianos/u);

const duplicateMemberTarball = gzipSync(createTarEntries([
  { name: 'package/index.json', contents: Buffer.from('[]') },
  { name: 'package/index.json', contents: Buffer.from('[]') },
]));
await assert.rejects(
  async () => verifySubtlexPackage(
    duplicateMemberTarball,
    pinForTar(duplicateMemberTarball),
  ),
  /Duplicate SUBTLEX archive entry/u,
);

for (const [label, records, pattern] of [
  [
    'duplicate word',
    [{ word: 'same', count: 2 }, { word: 'same', count: 1 }],
    /Duplicate SUBTLEX frequency word/u,
  ],
  [
    'invalid count',
    [{ word: 'zero', count: 0 }],
    /Invalid SUBTLEX frequency record/u,
  ],
]) {
  const fixture = createSubtlexFixture(records);
  await assert.rejects(
    async () => verifySubtlexPackage(fixture.tarball, fixture.pin),
    pattern,
    label,
  );
}

await assert.rejects(
  async () => assembleProductionLexemes({
    cmudictBytes: await readFile('data/rhyme-production/cmudict.dict'),
    projectEntries: [{
      flags: ['rap'],
      id: 'test.bad-alias',
      normalized: 'badalias',
      pronunciation: {
        kind: 'alias',
        target: 'cat',
        verifiedPhones: ['K', 'AE1', 'P'],
      },
      surface: 'badalias',
    }],
    provenance,
    subtlexTarballBytes: await readFile(
      'data/rhyme-production/subtlex-word-frequencies-2.0.0.tgz',
    ),
  }),
  /does not match pinned CMUdict/u,
);

process.stdout.write('production rhyme source controls passed\n');

function createTar(name, contents, type = '0') {
  return createTarEntries([{ name, contents, type }]);
}

function createTarEntries(entries) {
  const blocks = [];
  for (const { name, contents, type = '0' } of entries) {
    const header = Buffer.alloc(512);
    header.write(name, 0, 100, 'utf8');
    writeOctal(header, 100, 8, 0o644);
    writeOctal(header, 108, 8, 0);
    writeOctal(header, 116, 8, 0);
    writeOctal(header, 124, 12, contents.length);
    writeOctal(header, 136, 12, 0);
    header.fill(0x20, 148, 156);
    header[156] = type.charCodeAt(0);
    header.write('ustar\0', 257, 6, 'ascii');
    header.write('00', 263, 2, 'ascii');
    writeOctal(header, 148, 8, header.reduce((sum, byte) => sum + byte, 0));
    const padding = Buffer.alloc((512 - (contents.length % 512)) % 512);
    blocks.push(header, contents, padding);
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

function writeOctal(buffer, offset, width, value) {
  const encoded = value.toString(8).padStart(width - 1, '0');
  buffer.write(encoded, offset, width - 1, 'ascii');
  buffer[offset + width - 1] = 0;
}

function pinForTar(bytes) {
  const sha512 = createHash('sha512').update(bytes).digest();
  return {
    bytes: bytes.length,
    integrity: `sha512-${sha512.toString('base64')}`,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sha512: sha512.toString('hex'),
    shasum: createHash('sha1').update(bytes).digest('hex'),
  };
}

function createSubtlexFixture(records) {
  const copyright = 'Copyright (c) 2015 Zeke Sikelianos <zeke@sikelianos.com>';
  const files = new Map([
    ['package/index.json', Buffer.from(JSON.stringify(records))],
    ['package/license', Buffer.from(`ISC License\n\n${copyright}\n`)],
    ['package/package.json', Buffer.from(JSON.stringify({
      author: 'Zeke Sikelianos <zeke@sikelianos.com> (http://zeke.sikelianos.com)',
      dependencies: {},
      files: ['index.json'],
      license: 'ISC',
      main: 'index.json',
      name: 'subtlex-word-frequencies',
      repository: 'words/subtlex-word-frequencies',
      version: '2.0.0',
    }))],
    ['package/readme.md', Buffer.from(
      'List of 74,286 words from SUBTLEXus. [ISC][license] © [Zeke Sikelianos][author]',
    )],
  ]);
  const tarball = gzipSync(createTarEntries(
    [...files].map(([name, contents]) => ({ contents, name })),
  ));
  return {
    pin: {
      ...pinForTar(tarball),
      copyright,
      entries: records.length,
      internalFiles: [...files].map(([filePath, bytes]) => ({
        bytes: bytes.length,
        path: filePath,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      })),
      license: 'ISC',
      name: 'subtlex-word-frequencies',
      version: '2.0.0',
    },
    tarball,
  };
}
