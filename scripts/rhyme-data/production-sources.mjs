import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

import {
  loadAndValidateRhymeSources,
  toPhase3WordFlags,
} from '../rhyme-sources/contract.mjs';
import {
  MAX_PHONES_PER_PRONUNCIATION,
  MAX_PRONUNCIATIONS_PER_WORD,
  MAX_STRING_BYTES,
} from './format.mjs';
import {
  isValidArpabetPhone,
  normalizeRhymeWord,
} from './phonology.mjs';

const CMUDICT_COMMIT = '74790861f652b15e4ac49015a90074ad62a27690';
const CMUDICT_COMMIT_DATE = '2025-10-24T13:40:26-04:00';
const CMUDICT_REPOSITORY = 'https://github.com/cmusphinx/cmudict';
const CMUDICT_SHA256 = '81917843c7f44ce2b094ac63873c2c7a4cf802040792c455ba3ca406891c3d22';
const CMUDICT_LICENSE_SHA256 = 'bd4ce8e44170a5f9f481310ca85c51de3c4f851a65e679b40e603b143bd3542a';
const CMUDICT_README_SHA256 = '00c34e7564f1f6a68de02e12c123d801471da92bc3091f7d89b605f238bf8554';
const SUBTLEX_IDENTITY = 'subtlex-word-frequencies@2.0.0';
const SUBTLEX_DIST_URL = 'https://registry.npmjs.org/subtlex-word-frequencies/-/subtlex-word-frequencies-2.0.0.tgz';
const SUBTLEX_INTEGRITY = 'sha512-N/8uDDV4zD+PZNOCKvhBfOfSQo2CAKb/icKRsWQpRBNw9nh0Pt+Pt/fQIRaEpaawVIPSlyTekf9zHX/zQi0+Yg==';
const SUBTLEX_SHASUM = '4db4b01acf768d27162edbc3fe0930da19a5ca9a';
const SUBTLEX_SHA256 = '442a0e90c3f783c008c4721f035be7a003531185233584ea27c80af6c3d0654e';
const SUBTLEX_SHA512_HEX = '37ff2e0c3578cc3f8f64d3822af8417ce7d2428d8200a6ff89c291b16429441370f678743edf8fb7f7d0211684a5a6b05483d29724de91ff731d7ff3422d3e62';
const SUBTLEX_CITATION = 'Brysbaert, M., & New, B. (2009). Moving beyond Kucera and Francis: A critical evaluation of current word frequency norms and the introduction of a new and improved word frequency measure for American English. Behavior Research Methods, 41(4), 977-990.';
const SUBTLEX_GHENT_CAVEAT = 'The packaged npm distribution declares ISC under Zeke Sikelianos, while the Ghent SUBTLEXus download page itself does not state ISC; preserve that upstream relicensing/provenance caveat.';
const SUBTLEX_PACKAGE_FILES = Object.freeze([
  'package/index.json',
  'package/license',
  'package/package.json',
  'package/readme.md',
]);
const SUBTLEX_FILE_HASHES = Object.freeze({
  'package/index.json': '271c5a5fbf332f60762cfa34b11394427c220099d96c589751b6bc77e5b32c1a',
  'package/license': '91e895a27ad580d04ab7b2e14774756c684bf341f4e3bd8b488e9fd612b709e6',
  'package/package.json': '3f72dea8a87a647c538c8b4babe0244f6bc7927531b3d617d8231d1401823d4c',
  'package/readme.md': 'cc4e190964273b286bd47c7cb6e24c340547a1aa10586a4f9635be5a51913301',
});
const SUBTLEX_ENTRY_COUNT = 74286;
const EXPECTED_SOURCE_IDS = Object.freeze({
  cmuDictionary: 'cmudict.dict',
  cmuLicense: 'cmudict.license',
  cmuReadme: 'cmudict.readme',
  projectManifest: 'phase04.rhyme-sources',
  subtlexPackage: 'subtlex.package',
});
const EXPECTED_PRODUCTION_SOURCES = Object.freeze([
  {
    id: EXPECTED_SOURCE_IDS.cmuDictionary,
    kind: 'cmudict-dictionary',
    license: 'CMUdict license; see data/rhyme-production/cmudict-LICENSE.txt',
    ownership: 'third-party',
    path: 'data/cmudict.txt',
    sha256: CMUDICT_SHA256,
    version: `cmusphinx/cmudict@${CMUDICT_COMMIT}`,
  },
  {
    id: EXPECTED_SOURCE_IDS.cmuLicense,
    kind: 'cmudict-license',
    license: 'CMUdict license',
    ownership: 'third-party',
    path: 'data/rhyme-production/cmudict-LICENSE.txt',
    sha256: CMUDICT_LICENSE_SHA256,
    version: `cmusphinx/cmudict@${CMUDICT_COMMIT}`,
  },
  {
    id: EXPECTED_SOURCE_IDS.cmuReadme,
    kind: 'cmudict-acknowledgement',
    license: 'CMUdict acknowledgement text',
    ownership: 'third-party',
    path: 'data/rhyme-production/cmudict-README.txt',
    sha256: CMUDICT_README_SHA256,
    version: `cmusphinx/cmudict@${CMUDICT_COMMIT}`,
  },
  {
    id: EXPECTED_SOURCE_IDS.projectManifest,
    kind: 'phase04-source-manifest',
    license: 'LyricsLab project-owned source data; all rights reserved pending release-policy decision',
    ownership: 'project-authored',
    path: 'data/rhyme-sources/manifest.json',
    sha256: 'd8e2acb3b352a2589da8f71dd9ab082bc50c495698ab4359ad21d6c095fc9b29',
    version: '2026.07.12',
  },
  {
    id: EXPECTED_SOURCE_IDS.subtlexPackage,
    kind: 'subtlex-word-frequency-package',
    license: 'ISC package notice from subtlex-word-frequencies@2.0.0; see data/rhyme-production/NOTICE.md for Ghent provenance caveat',
    ownership: 'third-party',
    path: 'data/rhyme-production/subtlex-word-frequencies-2.0.0.tgz',
    sha256: SUBTLEX_SHA256,
    version: SUBTLEX_IDENTITY,
  },
]);

export async function loadProductionRhymeData({
  manifest,
  manifestHash,
  projectRoot,
  sources,
}) {
  validateProductionPins(manifest);
  validateProductionSourceRecords(sources);

  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const cmuSource = requireSource(sourceById, EXPECTED_SOURCE_IDS.cmuDictionary);
  const subtlexSource = requireSource(sourceById, EXPECTED_SOURCE_IDS.subtlexPackage);
  const projectManifestSource = requireSource(sourceById, EXPECTED_SOURCE_IDS.projectManifest);
  assertEqual(
    manifest.externalPins.phase04Sources.manifestSha256,
    projectManifestSource.sha256,
    'Phase 04 source manifest hash pin',
  );

  assertSourceHash(
    requireSource(sourceById, EXPECTED_SOURCE_IDS.cmuLicense),
    CMUDICT_LICENSE_SHA256,
    'CMUdict license',
  );
  assertSourceHash(
    requireSource(sourceById, EXPECTED_SOURCE_IDS.cmuReadme),
    CMUDICT_README_SHA256,
    'CMUdict README',
  );
  assertSourceHash(cmuSource, CMUDICT_SHA256, 'CMUdict dictionary');
  assertSourceHash(subtlexSource, SUBTLEX_SHA256, 'SUBTLEX package');

  const subtlex = parseSubtlexPackage(subtlexSource.bytes);
  const lexemeRecords = parseCmudict(cmuSource.bytes, subtlex);
  const projectSources = await loadProjectSources({
    projectManifestSource,
    projectRoot,
  });
  applyProjectSources(lexemeRecords, projectSources.entries, subtlex);

  const lexemes = finalizeLexemes(lexemeRecords, subtlex);

  return {
    manifest,
    manifestHash,
    lexemes,
    sources: [
      ...sources,
      ...projectSources.sourceRecords,
    ],
  };
}

function validateProductionPins(manifest) {
  const pins = manifest.externalPins;
  if (!pins || typeof pins !== 'object' || Array.isArray(pins)) {
    throw new Error('Production manifest must declare externalPins');
  }
  exactKeys(pins, ['cmudict', 'phase04Sources', 'subtlex'], 'Production externalPins');

  exactKeys(
    pins.cmudict,
    [
      'commit',
      'commitDate',
      'dictionarySha256',
      'licenseSha256',
      'readmeSha256',
      'repository',
    ],
    'CMUdict pin',
  );
  assertEqual(pins.cmudict.commit, CMUDICT_COMMIT, 'CMUdict commit');
  assertEqual(pins.cmudict.commitDate, CMUDICT_COMMIT_DATE, 'CMUdict commit date');
  assertEqual(pins.cmudict.dictionarySha256, CMUDICT_SHA256, 'CMUdict dictionary hash');
  assertEqual(pins.cmudict.licenseSha256, CMUDICT_LICENSE_SHA256, 'CMUdict license hash');
  assertEqual(pins.cmudict.readmeSha256, CMUDICT_README_SHA256, 'CMUdict README hash');
  assertEqual(pins.cmudict.repository, CMUDICT_REPOSITORY, 'CMUdict repository');

  exactKeys(
    pins.subtlex,
    [
      'distIntegrity',
      'distShasum',
      'distUrl',
      'ghentLicenseCaveat',
      'identity',
      'indexJsonSha256',
      'licenseSha256',
      'packageFiles',
      'packageJsonSha256',
      'readmeSha256',
      'subtlexCitation',
      'tarballSha256',
      'tarballSha512Hex',
    ],
    'SUBTLEX pin',
  );
  assertEqual(pins.subtlex.identity, SUBTLEX_IDENTITY, 'SUBTLEX identity');
  assertEqual(pins.subtlex.distUrl, SUBTLEX_DIST_URL, 'SUBTLEX dist URL');
  assertEqual(pins.subtlex.distIntegrity, SUBTLEX_INTEGRITY, 'SUBTLEX SRI integrity');
  assertEqual(pins.subtlex.distShasum, SUBTLEX_SHASUM, 'SUBTLEX shasum');
  assertEqual(pins.subtlex.tarballSha256, SUBTLEX_SHA256, 'SUBTLEX tarball SHA-256');
  assertEqual(pins.subtlex.tarballSha512Hex, SUBTLEX_SHA512_HEX, 'SUBTLEX tarball SHA-512');
  assertEqual(pins.subtlex.indexJsonSha256, SUBTLEX_FILE_HASHES['package/index.json'], 'SUBTLEX index hash');
  assertEqual(pins.subtlex.licenseSha256, SUBTLEX_FILE_HASHES['package/license'], 'SUBTLEX license hash');
  assertEqual(pins.subtlex.packageJsonSha256, SUBTLEX_FILE_HASHES['package/package.json'], 'SUBTLEX package.json hash');
  assertEqual(pins.subtlex.readmeSha256, SUBTLEX_FILE_HASHES['package/readme.md'], 'SUBTLEX README hash');
  assertEqual(JSON.stringify(pins.subtlex.packageFiles), JSON.stringify(SUBTLEX_PACKAGE_FILES), 'SUBTLEX package file list');
  assertEqual(pins.subtlex.subtlexCitation, SUBTLEX_CITATION, 'SUBTLEX citation');
  assertEqual(pins.subtlex.ghentLicenseCaveat, SUBTLEX_GHENT_CAVEAT, 'SUBTLEX Ghent caveat');

  exactKeys(
    pins.phase04Sources,
    ['manifestPath', 'manifestSha256', 'reviewedEntryCount'],
    'Phase 04 source pin',
  );
  assertEqual(pins.phase04Sources.manifestPath, 'data/rhyme-sources/manifest.json', 'Phase 04 manifest path');
  assertEqual(pins.phase04Sources.reviewedEntryCount, 618, 'Phase 04 reviewed source count');
}

function validateProductionSourceRecords(sources) {
  const expectedIds = EXPECTED_PRODUCTION_SOURCES.map((source) => source.id).sort();
  const actualIds = sources.map((source) => source.id).sort();
  assertEqual(JSON.stringify(actualIds), JSON.stringify(expectedIds), 'Production manifest sources');

  const expectedById = new Map(
    EXPECTED_PRODUCTION_SOURCES.map((source) => [source.id, source]),
  );

  for (const source of sources) {
    const expected = expectedById.get(source.id);
    if (!expected) {
      throw new Error(`Production manifest includes unexpected source ${source.id}`);
    }

    for (const field of ['kind', 'license', 'ownership', 'path', 'sha256', 'version']) {
      assertEqual(
        source[field],
        expected[field],
        `Production manifest source ${source.id} ${field}`,
      );
    }
  }
}

function parseSubtlexPackage(bytes) {
  assertEqual(sha512Hex(bytes), SUBTLEX_SHA512_HEX, 'SUBTLEX SHA-512');
  assertEqual(
    `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
    SUBTLEX_INTEGRITY,
    'SUBTLEX SRI integrity',
  );
  assertEqual(sha1(bytes), SUBTLEX_SHASUM, 'SUBTLEX SHA-1 shasum');

  const entries = parseTarGz(bytes);
  const names = [...entries.keys()].sort();
  assertEqual(JSON.stringify(names), JSON.stringify(SUBTLEX_PACKAGE_FILES), 'SUBTLEX package files');

  for (const [name, expectedHash] of Object.entries(SUBTLEX_FILE_HASHES)) {
    const entry = entries.get(name);
    if (!entry) {
      throw new Error(`SUBTLEX package is missing ${name}`);
    }
    assertEqual(sha256(entry), expectedHash, `SUBTLEX ${name} hash`);
  }

  const packageJson = parseJson(entries.get('package/package.json'), 'SUBTLEX package.json');
  exactKeys(
    packageJson,
    [
      'author',
      'bugs',
      'contributors',
      'dependencies',
      'description',
      'devDependencies',
      'files',
      'keywords',
      'license',
      'main',
      'name',
      'prettier',
      'remarkConfig',
      'repository',
      'scripts',
      'version',
      'xo',
    ],
    'SUBTLEX package.json',
  );
  assertEqual(packageJson.name, 'subtlex-word-frequencies', 'SUBTLEX package name');
  assertEqual(packageJson.version, '2.0.0', 'SUBTLEX package version');
  assertEqual(packageJson.license, 'ISC', 'SUBTLEX package license');
  assertEqual(packageJson.main, 'index.json', 'SUBTLEX main');

  const index = parseJson(entries.get('package/index.json'), 'SUBTLEX index.json');
  if (!Array.isArray(index) || index.length !== SUBTLEX_ENTRY_COUNT) {
    throw new Error(`SUBTLEX index must contain exactly ${SUBTLEX_ENTRY_COUNT} entries`);
  }

  const exactWords = new Set();
  let maxCount = 0;
  for (const [indexNumber, entry] of index.entries()) {
    exactKeys(entry, ['count', 'word'], `SUBTLEX entry ${indexNumber}`);
    if (typeof entry.word !== 'string' || entry.word.trim().length === 0) {
      throw new Error(`SUBTLEX entry ${indexNumber} has an invalid word`);
    }
    if (!Number.isInteger(entry.count) || entry.count <= 0) {
      throw new Error(`SUBTLEX entry ${indexNumber} has an invalid count`);
    }
    if (exactWords.has(entry.word)) {
      throw new Error(`SUBTLEX duplicate exact word: ${entry.word}`);
    }
    exactWords.add(entry.word);
    maxCount = Math.max(maxCount, entry.count);
  }

  const byNormalized = new Map();
  for (const [indexNumber, entry] of index.entries()) {
    const normalized = normalizeRhymeWord(entry.word);
    if (!normalized) {
      continue;
    }
    const existing = byNormalized.get(normalized);
    if (!existing || entry.count > existing.count) {
      byNormalized.set(normalized, {
        count: entry.count,
        rank: indexNumber + 1,
      });
    }
  }

  return {
    byNormalized,
    entryCount: index.length,
    maxCount,
  };
}

function parseCmudict(bytes, subtlex) {
  const records = new Map();
  const text = bytes.toString('utf8');
  for (const [lineNumber, rawLine] of text.split(/\r?\n/u).entries()) {
    const line = rawLine.replace(/\s+#.*$/u, '').trim();
    if (!line || line.startsWith(';;;')) {
      continue;
    }

    const fields = line.split(/\s+/u);
    if (fields.length < 2) {
      throw new Error(`CMUdict line ${lineNumber + 1} has no pronunciation`);
    }

    const rawWord = fields[0].replace(/\(\d+\)$/u, '');
    const normalizedWord = normalizeRhymeWord(rawWord);
    if (!normalizedWord) {
      continue;
    }

    const phones = fields.slice(1);
    assertPhoneSequence(phones, `CMUdict ${fields[0]}`, { requireVowel: false });
    if (!hasRhymeVowel(phones)) {
      continue;
    }
    addPronunciation(
      upsertRecord(records, normalizedWord, normalizedWord, subtlex),
      phones,
      `CMUdict ${fields[0]}`,
    );
  }

  if (records.size < 100000) {
    throw new Error(`CMUdict production corpus is unexpectedly small: ${records.size}`);
  }

  return records;
}

async function loadProjectSources({ projectManifestSource, projectRoot }) {
  const manifestPath = path.join(projectRoot, 'data/rhyme-sources/manifest.json');
  if (path.resolve(manifestPath) !== projectManifestSource.absolutePath) {
    throw new Error('Phase 04 source manifest path does not match production manifest source');
  }

  const validated = await loadAndValidateRhymeSources(manifestPath);
  if (validated.summary.total !== 618) {
    throw new Error(`Phase 04 source count drifted: ${validated.summary.total}`);
  }

  const sourceRecords = validated.manifest.sources.map((source) => ({
    id: `phase04.${source.id}`,
    kind: `phase04-${source.role}`,
    license: validated.manifest.ownership.license,
    ownership: source.ownership,
    path: path.posix.join('data/rhyme-sources', source.path),
    sha256: source.sha256,
    version: source.version,
  }));

  return {
    entries: validated.entries,
    sourceRecords,
    summary: validated.summary,
  };
}

function applyProjectSources(records, entries, subtlex) {
  for (const entry of entries) {
    const normalizedWord = entry.normalized;
    const record = upsertRecord(records, normalizedWord, entry.surface, subtlex);
    record.word = entry.surface;
    record.lemma = normalizedWord;
    record.flags = [...new Set([
      ...record.flags,
      ...entry.flags,
    ])].sort();
    record.flagBits |= toPhase3WordFlags(entry);

    const phones = entry.pronunciation.kind === 'direct'
      ? entry.pronunciation.phones
      : entry.pronunciation.verifiedPhones;
    addPronunciation(record, phones, `Phase 04 ${entry.id}`);
  }
}

function finalizeLexemes(records, subtlex) {
  const sorted = [...records.values()]
    .sort((left, right) => left.normalizedWord.localeCompare(right.normalizedWord));

  return sorted.map((record, index) => {
    const frequency = subtlex.byNormalized.get(record.normalizedWord);
    const rank = frequency?.rank ?? subtlex.entryCount + index + 1;
    const commonness = frequency
      ? Math.log10(frequency.count + 1) / Math.log10(subtlex.maxCount + 1)
      : 0;
    if (
      record.pronunciations.length === 0 ||
      record.pronunciations.length > MAX_PRONUNCIATIONS_PER_WORD
    ) {
      throw new Error(
        `${record.normalizedWord} has ${record.pronunciations.length} pronunciations; expected 1-${MAX_PRONUNCIATIONS_PER_WORD}`,
      );
    }

    return {
      commonness,
      flags: record.flags,
      lemma: record.lemma,
      normalizedWord: record.normalizedWord,
      pronunciations: record.pronunciations,
      rank,
      word: record.word,
    };
  });
}

function upsertRecord(records, normalizedWord, word, subtlex) {
  const existing = records.get(normalizedWord);
  if (existing) {
    return existing;
  }

  if (Buffer.byteLength(normalizedWord, 'utf8') > MAX_STRING_BYTES) {
    throw new Error(`Word ${normalizedWord} exceeds ${MAX_STRING_BYTES} UTF-8 bytes`);
  }

  const frequency = subtlex.byNormalized.get(normalizedWord);
  const record = {
    flagBits: 0,
    flags: [],
    lemma: normalizedWord,
    normalizedWord,
    pronunciations: [],
    pronunciationKeys: new Set(),
    rank: frequency?.rank,
    word,
  };
  records.set(normalizedWord, record);
  return record;
}

function addPronunciation(record, phones, label) {
  assertPhoneSequence(phones, label);
  const key = phones.join(' ');
  if (record.pronunciationKeys.has(key)) {
    return;
  }
  record.pronunciationKeys.add(key);
  record.pronunciations.push([...phones]);
}

function assertPhoneSequence(phones, label, options = {}) {
  const requireVowel = options.requireVowel ?? true;
  if (
    !Array.isArray(phones) ||
    phones.length === 0 ||
    phones.length > MAX_PHONES_PER_PRONUNCIATION ||
    phones.some((phone) => !isValidArpabetPhone(phone)) ||
    (requireVowel && !hasRhymeVowel(phones))
  ) {
    throw new Error(`${label} contains invalid standard ARPAbet`);
  }
}

function hasRhymeVowel(phones) {
  return phones.some((phone) => /[0-2]$/u.test(phone));
}

function parseTarGz(bytes) {
  const tarBytes = gunzipSync(bytes);
  const entries = new Map();
  let offset = 0;

  while (offset + 512 <= tarBytes.length) {
    const header = tarBytes.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) {
      break;
    }

    const name = readTarString(header, 0, 100);
    const prefix = readTarString(header, 345, 155);
    const fullName = prefix ? `${prefix}/${name}` : name;
    const sizeText = readTarString(header, 124, 12).trim();
    const size = Number.parseInt(sizeText, 8);
    const typeflag = String.fromCharCode(header[156] || 48);

    if (!fullName || fullName.includes('..') || path.isAbsolute(fullName)) {
      throw new Error(`Unsafe tar entry path: ${fullName}`);
    }
    if (!Number.isInteger(size) || size < 0) {
      throw new Error(`Invalid tar entry size for ${fullName}`);
    }

    offset += 512;
    const content = tarBytes.subarray(offset, offset + size);
    if (content.length !== size) {
      throw new Error(`Truncated tar entry: ${fullName}`);
    }
    if (typeflag !== '0' && typeflag !== '\0') {
      throw new Error(`Unsupported tar entry type for ${fullName}`);
    }
    if (entries.has(fullName)) {
      throw new Error(`Duplicate tar entry: ${fullName}`);
    }
    entries.set(fullName, Buffer.from(content));
    offset += Math.ceil(size / 512) * 512;
  }

  return entries;
}

function readTarString(buffer, offset, length) {
  const slice = buffer.subarray(offset, offset + length);
  const end = slice.indexOf(0);
  return slice.subarray(0, end === -1 ? slice.length : end).toString('utf8');
}

function requireSource(sourceById, id) {
  const source = sourceById.get(id);
  if (!source) {
    throw new Error(`Production manifest is missing source ${id}`);
  }
  return source;
}

function assertSourceHash(source, expected, label) {
  assertEqual(source.sha256, expected, `${label} declared SHA-256`);
  assertEqual(sha256(source.bytes), expected, `${label} byte SHA-256`);
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected}, received ${actual}`);
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function exactKeys(value, expected, label) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())
  ) {
    throw new Error(`${label} fields do not match the v1 schema`);
  }
}

function sha1(bytes) {
  return createHash('sha1').update(bytes).digest('hex');
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sha512Hex(bytes) {
  return createHash('sha512').update(bytes).digest('hex');
}
