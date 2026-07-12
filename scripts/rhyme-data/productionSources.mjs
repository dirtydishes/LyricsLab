import { createHash } from 'node:crypto';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

import { isValidArpabetPhone, normalizeRhymeWord } from './phonology.mjs';

const TAR_BLOCK_BYTES = 512;
const MAX_UNPACKED_SUBTLEX_BYTES = 8 * 1024 * 1024;
const MAX_CMU_BYTES = 8 * 1024 * 1024;
const CMUDICT_PIN = Object.freeze({
  branch: 'master',
  committedAt: '2025-10-24T13:40:26-04:00',
  license: 'CMUdict license, Copyright (C) 1993-2015 Carnegie Mellon University',
  repository: 'https://github.com/cmusphinx/cmudict.git',
  revision: '74790861f652b15e4ac49015a90074ad62a27690',
});
const SUBTLEX_PIN = Object.freeze({
  copyright: 'Copyright (c) 2015 Zeke Sikelianos <zeke@sikelianos.com>',
  entries: 74286,
  license: 'ISC',
  name: 'subtlex-word-frequencies',
  publishedAt: '2020-02-13T08:21:39.120Z',
  registry: 'https://registry.npmjs.org/',
  tarball: 'https://registry.npmjs.org/subtlex-word-frequencies/-/subtlex-word-frequencies-2.0.0.tgz',
  upstream: 'https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus',
  version: '2.0.0',
});
const SUBTLEX_INTERNAL_PATHS = Object.freeze([
  'package/index.json',
  'package/license',
  'package/package.json',
  'package/readme.md',
]);

/**
 * Verifies the pinned npm archive and returns its validated frequency records.
 * Archive mechanics, package identity, notices, and numeric data stay behind
 * this build-time interface so the compiler never handles partially trusted
 * package state.
 */
export function verifySubtlexPackage(tarballBytes, pin) {
  const bytes = Buffer.from(tarballBytes);
  if (!pin || typeof pin !== 'object' || Array.isArray(pin)) {
    throw new Error('SUBTLEX package pin must be an object');
  }
  verifyTarballIdentity(bytes, pin);
  let archive;
  try {
    archive = gunzipSync(bytes, {
      maxOutputLength: MAX_UNPACKED_SUBTLEX_BYTES,
    });
  } catch {
    throw new Error('SUBTLEX package is not a bounded valid gzip archive');
  }
  const entries = readRegularTarEntries(archive);
  verifyInternalFiles(entries, pin.internalFiles);

  const packageMetadata = parseJson(
    requiredEntry(entries, 'package/package.json'),
    'SUBTLEX package metadata',
  );
  verifyPackageMetadata(packageMetadata, pin);
  const license = requiredEntry(entries, 'package/license').toString('utf8');
  if (
    !license.startsWith('ISC License\n') ||
    !license.includes(pin.copyright) ||
    pin.license !== 'ISC'
  ) {
    throw new Error('SUBTLEX package ISC notice does not match its pin');
  }
  const readme = requiredEntry(entries, 'package/readme.md').toString('utf8');
  if (
    !readme.includes('List of 74,286 words') ||
    !readme.includes('SUBTLEXus') ||
    !readme.includes('[ISC][license] © [Zeke Sikelianos][author]')
  ) {
    throw new Error('SUBTLEX package README provenance is incomplete');
  }
  const frequencies = parseFrequencyRecords(
    requiredEntry(entries, 'package/index.json'),
    pin.entries,
  );

  return { frequencies, license, packageMetadata, readme };
}

export function assembleProductionLexemes({
  cmudictBytes,
  projectEntries,
  provenance,
  subtlexTarballBytes,
}) {
  verifyProductionProvenance(provenance);
  const dictionaryPin = provenance.cmudict.files.find(
    (file) => file.path === 'cmudict.dict',
  );
  if (
    !dictionaryPin ||
    cmudictBytes.length !== dictionaryPin.bytes ||
    digest(cmudictBytes, 'sha256', 'hex') !== dictionaryPin.sha256
  ) {
    throw new Error('CMUdict production bytes do not match their provenance pin');
  }
  const cmuLexemes = parseCmuDictionary(cmudictBytes);
  const verifiedPackage = verifySubtlexPackage(
    subtlexTarballBytes,
    provenance.subtlex,
  );
  const frequencyCounts = normalizeFrequencyCounts(verifiedPackage.frequencies);
  const lexemes = new Map();
  const cmuByWord = new Map(
    cmuLexemes.map((lexeme) => [lexeme.normalizedWord, lexeme]),
  );

  for (const cmu of cmuLexemes) {
    lexemes.set(cmu.normalizedWord, {
      flags: new Set(),
      lemma: cmu.normalizedWord,
      normalizedWord: cmu.normalizedWord,
      pronunciations: new Map(
        cmu.pronunciations.map((phones) => [phones.join(' '), phones]),
      ),
      word: cmu.word,
    });
  }

  for (const entry of projectEntries) {
    const existing = lexemes.get(entry.normalized) ?? {
      flags: new Set(),
      lemma: entry.normalized,
      normalizedWord: entry.normalized,
      pronunciations: new Map(),
      word: entry.surface,
    };
    const phones = entry.pronunciation.kind === 'direct'
      ? entry.pronunciation.phones
      : verifyProjectAlias(entry, cmuByWord);
    existing.pronunciations.set(phones.join(' '), [...phones]);
    existing.word = entry.surface;
    for (const flag of entry.flags) existing.flags.add(flag);
    lexemes.set(entry.normalized, existing);
  }

  const ranked = [...lexemes.values()]
    .map((lexeme) => ({
      ...lexeme,
      count: frequencyCounts.get(lexeme.normalizedWord) ?? 0,
    }))
    .sort((left, right) =>
      right.count - left.count || compareCodeUnits(left.normalizedWord, right.normalizedWord),
    );
  const maximumCount = ranked[0]?.count ?? 0;
  if (maximumCount <= 0) throw new Error('Production commonness source has no matched counts');
  const denominator = Math.log1p(maximumCount);

  return ranked.map((lexeme, index) => ({
    commonness: Math.round(
      (lexeme.count === 0 ? 0 : Math.log1p(lexeme.count) / denominator) * 1_000_000,
    ) / 1_000_000,
    flags: [...lexeme.flags].sort(compareCodeUnits),
    lemma: lexeme.lemma,
    normalizedWord: lexeme.normalizedWord,
    pronunciations: [...lexeme.pronunciations.values()].sort(comparePhoneSequences),
    rank: index + 1,
    word: lexeme.word,
  }));
}

export function verifyProductionProvenance(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Production provenance must be an object');
  }
  assertExactKeys(value, ['cmudict', 'schema', 'schemaVersion', 'subtlex'], 'Production provenance');
  if (
    value.schema !== 'lyricslab.rhyme-production-provenance' ||
    value.schemaVersion !== 1
  ) {
    throw new Error('Unsupported production provenance schema');
  }
  if (
    !value.cmudict ||
    value.cmudict.repository !== CMUDICT_PIN.repository ||
    value.cmudict.branch !== CMUDICT_PIN.branch ||
    value.cmudict.revision !== CMUDICT_PIN.revision ||
    value.cmudict.committedAt !== CMUDICT_PIN.committedAt ||
    value.cmudict.license !== CMUDICT_PIN.license ||
    !Array.isArray(value.cmudict.files) ||
    value.cmudict.files.length !== 3 ||
    !value.cmudict.acknowledgement?.includes('Carnegie Mellon')
  ) {
    throw new Error('CMUdict provenance pin is malformed');
  }
  assertExactKeys(
    value.cmudict,
    ['acknowledgement', 'branch', 'committedAt', 'files', 'license', 'repository', 'revision'],
    'CMUdict provenance',
  );
  const cmuPaths = value.cmudict.files.map((file) => file.path).sort();
  if (JSON.stringify(cmuPaths) !== JSON.stringify(['LICENSE', 'README', 'cmudict.dict'])) {
    throw new Error('CMUdict provenance file set is incomplete');
  }
  for (const file of value.cmudict.files) {
    assertExactKeys(file, ['bytes', 'lines', 'path', 'sha256'], 'CMUdict file pin');
    if (
      !Number.isInteger(file.bytes) ||
      file.bytes <= 0 ||
      !Number.isInteger(file.lines) ||
      file.lines <= 0 ||
      !/^[a-f0-9]{64}$/u.test(file.sha256)
    ) {
      throw new Error(`CMUdict provenance file pin is malformed: ${file.path}`);
    }
  }
  if (
    !value.subtlex ||
    value.subtlex.name !== SUBTLEX_PIN.name ||
    value.subtlex.version !== SUBTLEX_PIN.version ||
    value.subtlex.license !== SUBTLEX_PIN.license ||
    value.subtlex.entries !== SUBTLEX_PIN.entries ||
    value.subtlex.registry !== SUBTLEX_PIN.registry ||
    value.subtlex.tarball !== SUBTLEX_PIN.tarball ||
    value.subtlex.publishedAt !== SUBTLEX_PIN.publishedAt ||
    value.subtlex.copyright !== SUBTLEX_PIN.copyright ||
    value.subtlex.upstream !== SUBTLEX_PIN.upstream ||
    !Number.isSafeInteger(value.subtlex.bytes) ||
    value.subtlex.bytes <= 0 ||
    !/^[a-f0-9]{40}$/u.test(value.subtlex.shasum) ||
    !/^[a-f0-9]{64}$/u.test(value.subtlex.sha256) ||
    !/^[a-f0-9]{128}$/u.test(value.subtlex.sha512) ||
    !/^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(value.subtlex.integrity) ||
    !value.subtlex.citation?.includes('https://doi.org/10.3758/BRM.41.4.977') ||
    !value.subtlex.upstreamCaveat?.includes('does not state an ISC license')
  ) {
    throw new Error('SUBTLEX production provenance pin is malformed');
  }
  assertExactKeys(
    value.subtlex,
    [
      'bytes', 'citation', 'copyright', 'entries', 'integrity', 'internalFiles',
      'license', 'name', 'publishedAt', 'registry', 'sha256', 'sha512', 'shasum',
      'tarball', 'upstream', 'upstreamCaveat', 'version',
    ],
    'SUBTLEX provenance',
  );
  if (
    !Array.isArray(value.subtlex.internalFiles) ||
    value.subtlex.internalFiles.length !== SUBTLEX_INTERNAL_PATHS.length
  ) {
    throw new Error('SUBTLEX provenance internal file pin is malformed');
  }
  const internalPaths = value.subtlex.internalFiles.map((file) => file.path).sort();
  if (JSON.stringify(internalPaths) !== JSON.stringify(SUBTLEX_INTERNAL_PATHS)) {
    throw new Error('SUBTLEX provenance internal file set is incomplete');
  }
  for (const file of value.subtlex.internalFiles) {
    assertExactKeys(file, ['bytes', 'path', 'sha256'], 'SUBTLEX internal file pin');
    if (
      !Number.isSafeInteger(file.bytes) ||
      file.bytes < 0 ||
      !/^[a-f0-9]{64}$/u.test(file.sha256)
    ) {
      throw new Error(`SUBTLEX provenance internal file pin is malformed: ${file.path}`);
    }
  }
}

function parseCmuDictionary(bytes) {
  if (bytes.length === 0 || bytes.length > MAX_CMU_BYTES) {
    throw new Error('CMUdict source size is invalid');
  }
  for (const byte of bytes) {
    if (byte > 0x7f) throw new Error('CMUdict source must be ASCII');
  }
  const byWord = new Map();
  const seenHeadwords = new Set();
  const source = bytes.toString('ascii');
  const lines = source.split('\n');
  if (lines.at(-1) === '') lines.pop();

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    const content = line.split('#', 1)[0].trim();
    if (!content) throw new Error(`CMUdict line ${index + 1} is empty`);
    const fields = content.split(/\s+/u);
    const headword = fields.shift();
    if (!headword || fields.length === 0 || seenHeadwords.has(headword)) {
      throw new Error(`CMUdict line ${index + 1} has a malformed or duplicate headword`);
    }
    seenHeadwords.add(headword);
    const match = headword.match(/^(.*?)(?:\(([1-9][0-9]*)\))?$/u);
    const word = match?.[1];
    const alternate = match?.[2];
    if (
      !word ||
      /[()]/u.test(word) ||
      (alternate !== undefined && Number(alternate) < 2) ||
      fields.length > 64 ||
      fields.some((phone) => !isValidArpabetPhone(phone))
    ) {
      throw new Error(`CMUdict line ${index + 1} is invalid`);
    }
    if (!fields.some((phone) => /[0-2]$/u.test(phone))) {
      continue;
    }
    const normalizedWord = normalizeRhymeWord(word);
    if (!normalizedWord) throw new Error(`CMUdict line ${index + 1} normalizes empty`);
    const existing = byWord.get(normalizedWord) ?? {
      normalizedWord,
      pronunciations: new Map(),
      word,
    };
    const phones = fields.join(' ');
    existing.pronunciations.set(phones, fields);
    if (compareCodeUnits(word, existing.word) < 0) existing.word = word;
    byWord.set(normalizedWord, existing);
  }

  return [...byWord.values()]
    .map((entry) => ({
      ...entry,
      pronunciations: [...entry.pronunciations.values()].sort(comparePhoneSequences),
    }))
    .sort((left, right) => compareCodeUnits(left.normalizedWord, right.normalizedWord));
}

function verifyProjectAlias(entry, cmuByWord) {
  const target = cmuByWord.get(entry.pronunciation.target);
  const expected = entry.pronunciation.verifiedPhones.join(' ');
  if (!target?.pronunciations.some((phones) => phones.join(' ') === expected)) {
    throw new Error(`Project alias ${entry.id} does not match pinned CMUdict`);
  }
  return entry.pronunciation.verifiedPhones;
}

function normalizeFrequencyCounts(records) {
  const counts = new Map();
  for (const record of records) {
    const word = normalizeRhymeWord(record.word);
    if (!word) continue;
    const count = (counts.get(word) ?? 0) + record.count;
    if (!Number.isSafeInteger(count)) {
      throw new Error(`Normalized SUBTLEX count overflows for ${word}`);
    }
    counts.set(word, count);
  }
  return counts;
}

function readRegularTarEntries(archive) {
  const entries = new Map();
  let offset = 0;

  while (offset + TAR_BLOCK_BYTES <= archive.length) {
    const header = archive.subarray(offset, offset + TAR_BLOCK_BYTES);
    if (header.every((byte) => byte === 0)) break;

    const storedChecksum = readTarOctal(header, 148, 8, 'checksum');
    let actualChecksum = 0;
    for (let index = 0; index < header.length; index += 1) {
      actualChecksum += index >= 148 && index < 156 ? 0x20 : header[index];
    }
    if (storedChecksum !== actualChecksum) {
      throw new Error('Invalid SUBTLEX archive header checksum');
    }

    const magic = readTarString(header, 257, 6);
    const version = readTarString(header, 263, 2);
    if (magic !== 'ustar' || version !== '00') {
      throw new Error('SUBTLEX archive header is not canonical ustar');
    }
    const prefix = readTarString(header, 345, 155);
    const leafName = readTarString(header, 0, 100);
    const name = prefix ? `${prefix}/${leafName}` : leafName;
    assertSafeArchivePath(name);
    const type = header[156];
    if (type !== 0 && type !== '0'.charCodeAt(0)) {
      throw new Error(`SUBTLEX archive entry must be a regular file: ${name}`);
    }
    if (readTarString(header, 157, 100)) {
      throw new Error(`SUBTLEX archive regular file has a link target: ${name}`);
    }
    const size = readTarOctal(header, 124, 12, 'size');
    const contentStart = offset + TAR_BLOCK_BYTES;
    const contentEnd = contentStart + size;
    if (!Number.isSafeInteger(contentEnd) || contentEnd > archive.length) {
      throw new Error(`SUBTLEX archive entry is truncated: ${name}`);
    }
    if (entries.has(name)) {
      throw new Error(`Duplicate SUBTLEX archive entry: ${name}`);
    }
    entries.set(name, archive.subarray(contentStart, contentEnd));
    offset = contentStart + Math.ceil(size / TAR_BLOCK_BYTES) * TAR_BLOCK_BYTES;
  }

  if (offset + TAR_BLOCK_BYTES * 2 > archive.length) {
    throw new Error('SUBTLEX archive is missing its end markers');
  }
  for (let index = offset; index < archive.length; index += 1) {
    if (archive[index] !== 0) {
      throw new Error('SUBTLEX archive has non-zero trailing data');
    }
  }
  return entries;
}

function verifyTarballIdentity(bytes, pin) {
  const sha1 = digest(bytes, 'sha1', 'hex');
  const sha256 = digest(bytes, 'sha256', 'hex');
  const sha512 = digest(bytes, 'sha512', 'hex');
  const integrity = `sha512-${digest(bytes, 'sha512', 'base64')}`;
  if (
    bytes.length !== pin.bytes ||
    sha1 !== pin.shasum ||
    sha256 !== pin.sha256 ||
    sha512 !== pin.sha512 ||
    integrity !== pin.integrity
  ) {
    throw new Error('SUBTLEX package tarball identity does not match its npm pin');
  }
}

function verifyInternalFiles(entries, expectedFiles) {
  if (!Array.isArray(expectedFiles) || expectedFiles.length !== 4) {
    throw new Error('SUBTLEX package pin must declare exactly four internal files');
  }
  const expectedPaths = expectedFiles.map((file) => file.path).sort();
  const actualPaths = [...entries.keys()].sort();
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error('SUBTLEX package internal file set does not match its pin');
  }
  for (const expected of expectedFiles) {
    const bytes = requiredEntry(entries, expected.path);
    if (
      !Number.isInteger(expected.bytes) ||
      expected.bytes < 0 ||
      bytes.length !== expected.bytes ||
      digest(bytes, 'sha256', 'hex') !== expected.sha256
    ) {
      throw new Error(`SUBTLEX package internal file mismatch: ${expected.path}`);
    }
  }
}

function verifyPackageMetadata(metadata, pin) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('SUBTLEX package metadata must be an object');
  }
  if (
    metadata.name !== pin.name ||
    metadata.version !== pin.version ||
    metadata.license !== 'ISC' ||
    metadata.repository !== 'words/subtlex-word-frequencies' ||
    metadata.author !== 'Zeke Sikelianos <zeke@sikelianos.com> (http://zeke.sikelianos.com)' ||
    metadata.main !== 'index.json' ||
    JSON.stringify(metadata.files) !== JSON.stringify(['index.json']) ||
    !metadata.dependencies ||
    Object.keys(metadata.dependencies).length !== 0
  ) {
    throw new Error('SUBTLEX package metadata does not match version 2.0.0');
  }
}

function parseFrequencyRecords(bytes, expectedCount) {
  const records = parseJson(bytes, 'SUBTLEX frequency index');
  if (!Array.isArray(records) || records.length !== expectedCount) {
    throw new Error('SUBTLEX frequency record count does not match its pin');
  }
  const words = new Set();
  let previousCount = Number.POSITIVE_INFINITY;
  for (const [index, record] of records.entries()) {
    if (
      !record ||
      typeof record !== 'object' ||
      Array.isArray(record) ||
      JSON.stringify(Object.keys(record).sort()) !== '["count","word"]' ||
      typeof record.word !== 'string' ||
      !record.word.trim() ||
      Buffer.byteLength(record.word, 'utf8') > 4096 ||
      !Number.isSafeInteger(record.count) ||
      record.count <= 0 ||
      record.count > previousCount
    ) {
      throw new Error(`Invalid SUBTLEX frequency record at index ${index}`);
    }
    if (words.has(record.word)) {
      throw new Error(`Duplicate SUBTLEX frequency word: ${record.word}`);
    }
    words.add(record.word);
    previousCount = record.count;
  }
  return records;
}

function requiredEntry(entries, name) {
  const value = entries.get(name);
  if (!value) throw new Error(`Missing SUBTLEX archive entry: ${name}`);
  return value;
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function digest(bytes, algorithm, encoding) {
  return createHash(algorithm).update(bytes).digest(encoding);
}

function assertExactKeys(value, expected, label) {
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) {
    throw new Error(`${label} fields do not match the v1 schema`);
  }
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function comparePhoneSequences(left, right) {
  return compareCodeUnits(left.join('\0'), right.join('\0'));
}

function assertSafeArchivePath(name) {
  const normalized = name.replaceAll('\\', '/');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    /^[A-Za-z]:/u.test(normalized) ||
    normalized.split('/').includes('..') ||
    path.posix.normalize(normalized) !== normalized
  ) {
    throw new Error(`Invalid SUBTLEX archive path: ${name}`);
  }
}

function readTarString(header, offset, length) {
  const bytes = header.subarray(offset, offset + length);
  const nul = bytes.indexOf(0);
  return bytes.subarray(0, nul === -1 ? bytes.length : nul).toString('utf8');
}

function readTarOctal(header, offset, length, label) {
  const value = readTarString(header, offset, length).trim();
  if (!/^[0-7]+$/u.test(value)) {
    throw new Error(`Invalid SUBTLEX archive ${label}`);
  }
  const parsed = Number.parseInt(value, 8);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid SUBTLEX archive ${label}`);
  }
  return parsed;
}
