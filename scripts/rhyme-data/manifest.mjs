import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

import {
  isValidArpabetPhone,
  normalizeRhymeWord,
} from './phonology.mjs';
import {
  MAX_PHONES_PER_PRONUNCIATION,
  MAX_PRONUNCIATIONS_PER_WORD,
  MAX_STRING_BYTES,
} from './format.mjs';

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const ALLOWED_FLAGS = new Set(['proper-noun', 'rap', 'safety-blocked']);

export async function loadRhymeDataManifest(manifestPath) {
  const absoluteManifestPath = path.resolve(manifestPath);
  const rawManifest = await readFile(absoluteManifestPath);
  const manifest = parseJson(rawManifest, 'manifest');
  validateManifest(manifest);

  const manifestDirectory = await realpath(path.dirname(absoluteManifestPath));
  const sources = [];

  for (const source of manifest.sources) {
    const sourcePath = await resolveContainedPath(manifestDirectory, source.path);
    const bytes = await readFile(sourcePath);
    const actualHash = sha256(bytes);

    if (actualHash !== source.sha256) {
      throw new Error(
        `Source hash mismatch for ${source.id}: expected ${source.sha256}, received ${actualHash}`,
      );
    }

    sources.push({ ...source, absolutePath: sourcePath, bytes });
  }

  const lexiconSources = sources.filter(
    (source) => source.kind === 'fixture-lexicon',
  );

  if (lexiconSources.length !== 1) {
    throw new Error('Manifest must declare exactly one fixture-lexicon source');
  }

  const lexemes = parseJson(lexiconSources[0].bytes, 'fixture lexicon');
  validateLexemes(lexemes);

  return {
    manifest,
    manifestHash: sha256(rawManifest),
    lexemes,
    sources,
  };
}

function validateManifest(value) {
  assertObject(value, 'Manifest');
  assertExactKeys(
    value,
    ['artifact', 'provenance', 'schema', 'schemaVersion', 'sources'],
    'Manifest',
  );

  if (
    value.schema !== 'lyricslab.rhyme-data-manifest' ||
    value.schemaVersion !== 1
  ) {
    throw new Error('Unsupported rhyme data manifest schema');
  }

  assertObject(value.artifact, 'Manifest artifact');
  assertExactKeys(value.artifact, ['id', 'version'], 'Manifest artifact');
  assertNonEmptyString(value.artifact.id, 'Manifest artifact id');
  assertNonEmptyString(value.artifact.version, 'Manifest artifact version');

  assertObject(value.provenance, 'Manifest provenance');
  assertExactKeys(
    value.provenance,
    ['owner', 'production', 'purpose'],
    'Manifest provenance',
  );
  assertNonEmptyString(value.provenance.owner, 'Manifest provenance owner');
  assertNonEmptyString(value.provenance.purpose, 'Manifest provenance purpose');

  if (value.provenance.production !== false) {
    throw new Error('Phase 03 accepts only a non-production project fixture');
  }

  if (!Array.isArray(value.sources) || value.sources.length === 0) {
    throw new Error('Manifest sources must be a non-empty array');
  }

  const sourceIds = new Set();

  for (const source of value.sources) {
    assertObject(source, 'Manifest source');
    assertExactKeys(
      source,
      ['id', 'kind', 'license', 'ownership', 'path', 'sha256', 'version'],
      'Manifest source',
    );

    for (const field of ['id', 'kind', 'license', 'ownership', 'path', 'version']) {
      assertNonEmptyString(source[field], `Manifest source ${field}`);
    }

    if (!SHA256_PATTERN.test(source.sha256)) {
      throw new Error(`Manifest source ${source.id} has an invalid SHA-256`);
    }

    if (source.ownership !== 'project-authored') {
      throw new Error(`Phase 03 source ${source.id} is not project-authored`);
    }

    if (sourceIds.has(source.id)) {
      throw new Error(`Duplicate manifest source id: ${source.id}`);
    }

    sourceIds.add(source.id);
  }
}

function validateLexemes(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Fixture lexicon must be a non-empty array');
  }

  const words = new Set();

  for (const [index, lexeme] of value.entries()) {
    assertObject(lexeme, `Lexeme ${index}`);
    const allowedKeys = [
      'commonness',
      'flags',
      'lemma',
      'normalizedWord',
      'pronunciations',
      'rank',
      'word',
    ];
    assertAllowedKeys(lexeme, allowedKeys, `Lexeme ${index}`);

    assertNonEmptyString(lexeme.word, `Lexeme ${index} word`);
    assertNonEmptyString(lexeme.lemma, `Lexeme ${index} lemma`);

    const normalizedWord = normalizeRhymeWord(
      lexeme.normalizedWord ?? lexeme.word,
    );
    if (!normalizedWord) {
      throw new Error(`Lexeme ${index} normalizedWord must be non-empty`);
    }
    if (Buffer.byteLength(normalizedWord, 'utf8') > MAX_STRING_BYTES) {
      throw new Error(`Lexeme ${index} normalizedWord exceeds ${MAX_STRING_BYTES} UTF-8 bytes`);
    }
    if (
      lexeme.normalizedWord !== undefined &&
      lexeme.normalizedWord !== normalizedWord
    ) {
      throw new Error(`Lexeme ${index} normalizedWord must be canonical`);
    }
    if (lexeme.lemma !== normalizeRhymeWord(lexeme.lemma)) {
      throw new Error(`Lexeme ${index} lemma must be canonical`);
    }

    if (
      !Number.isInteger(lexeme.rank) ||
      lexeme.rank <= 0 ||
      lexeme.rank > 0xffff_ffff
    ) {
      throw new Error(`Lexeme ${index} rank must be a positive integer`);
    }

    if (words.has(normalizedWord)) {
      throw new Error(`Duplicate fixture word: ${normalizedWord}`);
    }

    words.add(normalizedWord);

    if (
      typeof lexeme.commonness !== 'number' ||
      !Number.isFinite(lexeme.commonness) ||
      lexeme.commonness < 0 ||
      lexeme.commonness > 1
    ) {
      throw new Error(`Lexeme ${index} commonness must be between zero and one`);
    }

    if (
      !Array.isArray(lexeme.pronunciations) ||
      lexeme.pronunciations.length === 0 ||
      lexeme.pronunciations.length > MAX_PRONUNCIATIONS_PER_WORD
    ) {
      throw new Error(
        `Lexeme ${index} pronunciations must contain 1-${MAX_PRONUNCIATIONS_PER_WORD} entries`,
      );
    }

    const pronunciationKeys = new Set();
    for (const pronunciation of lexeme.pronunciations) {
      if (
        !Array.isArray(pronunciation) ||
        pronunciation.length === 0 ||
        pronunciation.length > MAX_PHONES_PER_PRONUNCIATION ||
        pronunciation.some(
          (phone) => !isValidArpabetPhone(phone),
        )
      ) {
        throw new Error(`Lexeme ${index} contains an invalid pronunciation`);
      }
      const pronunciationKey = pronunciation.join(' ');
      if (pronunciationKeys.has(pronunciationKey)) {
        throw new Error(`Lexeme ${index} contains a duplicate pronunciation`);
      }
      pronunciationKeys.add(pronunciationKey);
    }

    if (lexeme.flags !== undefined) {
      if (
        !Array.isArray(lexeme.flags) ||
        lexeme.flags.some((flag) => !ALLOWED_FLAGS.has(flag)) ||
        new Set(lexeme.flags).size !== lexeme.flags.length
      ) {
        throw new Error(`Lexeme ${index} contains invalid or duplicate flags`);
      }
    }
  }
}

async function resolveContainedPath(root, relativePath) {
  if (path.isAbsolute(relativePath)) {
    throw new Error('Manifest source paths must be relative');
  }

  const resolved = await realpath(path.resolve(root, relativePath));
  const relative = path.relative(root, resolved);

  if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Manifest source path escapes its directory: ${relativePath}`);
  }

  return resolved;
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  if (Buffer.byteLength(value, 'utf8') > MAX_STRING_BYTES) {
    throw new Error(`${label} exceeds ${MAX_STRING_BYTES} UTF-8 bytes`);
  }
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();

  if (JSON.stringify(actual) !== JSON.stringify(sortedExpected)) {
    throw new Error(`${label} fields do not match the v1 schema`);
  }
}

function assertAllowedKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new Error(`${label} contains unsupported field: ${key}`);
    }
  }
}
