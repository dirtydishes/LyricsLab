import { createHash } from 'node:crypto';
import { readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';

import {
  isValidArpabetPhone,
  normalizeRhymeWord,
} from '../rhyme-data/phonology.mjs';
import {
  MAX_PHONES_PER_PRONUNCIATION,
  WORD_FLAG,
} from '../rhyme-data/format.mjs';

const SHA256 = /^[a-f0-9]{64}$/u;
const ID = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/u;
const RESERVED_EVALUATION_NAME = /(?:^|[-_.])(acceptance|evaluation|gold|oov)(?:$|[-_.])/iu;

export const CATEGORIES = Object.freeze([
  'ad-lib',
  'apostrophe-variant',
  'colloquialism',
  'common-inflection',
  'dropped-sound',
  'fused-phrase',
  'proper-name',
  'stylized-spelling',
]);

export const REGIONS = Object.freeze([
  'midwest',
  'national',
  'northeast',
  'south',
  'west-coast',
]);

const FLAGS = Object.freeze(['proper-noun', 'rap', 'safety-blocked']);
const REVIEW_STATES = Object.freeze(['reviewed']);
const FINAL_N_CATEGORIES = new Set([
  'apostrophe-variant',
  'common-inflection',
  'dropped-sound',
]);
const SOURCE_ROLES = Object.freeze([
  'evidence',
  'lexicon',
  'proper-noun-policy',
  'safety-policy',
]);

export async function loadAndValidateRhymeSources(manifestPath) {
  const absoluteManifestPath = path.resolve(manifestPath);
  const rawManifest = await readFile(absoluteManifestPath);
  const manifest = parseJson(rawManifest, 'source manifest');
  validateManifest(manifest);

  const root = await realpath(path.dirname(absoluteManifestPath));
  await assertNoUndeclaredJsonSources(root, manifest);
  const loaded = new Map();

  for (const source of manifest.sources) {
    const absolutePath = await resolveContainedPath(root, source.path);
    const bytes = await readFile(absolutePath);
    const actualHash = sha256(bytes);
    if (source.sha256 !== actualHash) {
      throw new Error(`Source hash mismatch for ${source.id}`);
    }
    loaded.set(source.role, parseJson(bytes, source.id));
  }

  const evidence = validateEvidence(loaded.get('evidence'));
  const entries = validateEntries(loaded.get('lexicon'), evidence);
  const safetyPolicy = validateSafetyPolicy(
    loaded.get('safety-policy'),
    entries,
  );
  const properNounPolicy = validateProperNounPolicy(
    loaded.get('proper-noun-policy'),
    entries,
  );

  if (entries.length < manifest.corpus.minimumEntries) {
    throw new Error(
      `Reviewed source count ${entries.length} is below floor ${manifest.corpus.minimumEntries}`,
    );
  }
  const summary = summarize(entries);
  enforceCountFloors(summary.categories, manifest.corpus.categoryMinimums, 'category');
  enforceCountFloors(summary.regions, manifest.corpus.regionMinimums, 'region');

  return {
    entries,
    evidence,
    manifest,
    properNounPolicy,
    safetyPolicy,
    summary,
  };
}

function validateManifest(value) {
  object(value, 'Manifest');
  exactKeys(value, ['corpus', 'ownership', 'schema', 'schemaVersion', 'sources'], 'Manifest');
  if (value.schema !== 'lyricslab.rhyme-sources' || value.schemaVersion !== 1) {
    throw new Error('Unsupported rhyme source manifest schema');
  }
  object(value.ownership, 'Manifest ownership');
  exactKeys(value.ownership, ['license', 'owner', 'purpose'], 'Manifest ownership');
  nonEmpty(value.ownership.owner, 'Manifest ownership owner');
  nonEmpty(value.ownership.license, 'Manifest ownership license');
  nonEmpty(value.ownership.purpose, 'Manifest ownership purpose');

  object(value.corpus, 'Manifest corpus');
  exactKeys(value.corpus, ['categoryMinimums', 'minimumEntries', 'regionMinimums'], 'Manifest corpus');
  if (!Number.isInteger(value.corpus.minimumEntries) || value.corpus.minimumEntries < 500) {
    throw new Error('Manifest corpus floor must be at least 500');
  }
  validateCountFloors(value.corpus.categoryMinimums, CATEGORIES, 'category');
  validateCountFloors(value.corpus.regionMinimums, REGIONS, 'region');

  if (!Array.isArray(value.sources) || value.sources.length !== SOURCE_ROLES.length) {
    throw new Error('Manifest must declare exactly four source roles');
  }
  const ids = new Set();
  const roles = new Set();
  for (const source of value.sources) {
    object(source, 'Manifest source');
    exactKeys(source, ['id', 'ownership', 'path', 'role', 'sha256', 'version'], 'Manifest source');
    if (!ID.test(source.id) || ids.has(source.id)) throw new Error(`Invalid or duplicate source id: ${source.id}`);
    if (!SOURCE_ROLES.includes(source.role) || roles.has(source.role)) throw new Error(`Invalid or duplicate source role: ${source.role}`);
    if (source.ownership !== 'project-authored') throw new Error(`Source ${source.id} is not project-authored`);
    if (!SHA256.test(source.sha256)) throw new Error(`Source ${source.id} has invalid SHA-256`);
    nonEmpty(source.version, `Source ${source.id} version`);
    nonEmpty(source.path, `Source ${source.id} path`);
    if (RESERVED_EVALUATION_NAME.test(source.id) || RESERVED_EVALUATION_NAME.test(source.path)) {
      throw new Error(`Source ${source.id} crosses the sealed evaluation boundary`);
    }
    ids.add(source.id);
    roles.add(source.role);
  }
  for (const role of SOURCE_ROLES) {
    if (!roles.has(role)) throw new Error(`Manifest is missing ${role}`);
  }
}

function validateEvidence(value) {
  if (!Array.isArray(value) || value.length === 0) throw new Error('Evidence must be a non-empty array');
  const records = new Map();
  for (const record of value) {
    object(record, 'Evidence record');
    exactKeys(record, ['basis', 'id', 'kind', 'reviewedAt'], 'Evidence record');
    if (!ID.test(record.id) || records.has(record.id)) throw new Error(`Invalid or duplicate evidence id: ${record.id}`);
    if (record.kind !== 'project-editorial') throw new Error(`Evidence ${record.id} must be project editorial`);
    nonEmpty(record.basis, `Evidence ${record.id} basis`);
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(record.reviewedAt)) throw new Error(`Evidence ${record.id} reviewedAt must be YYYY-MM-DD`);
    records.set(record.id, record);
  }
  return records;
}

function validateEntries(value, evidence) {
  if (!Array.isArray(value) || value.length === 0) throw new Error('Lexicon must be a non-empty array');
  const ids = new Set();
  const words = new Set();
  const entries = [];
  for (const [index, entry] of value.entries()) {
    const label = `Entry ${index}`;
    object(entry, label);
    exactKeys(entry, ['category', 'evidenceIds', 'flags', 'id', 'normalized', 'pronunciation', 'regions', 'reviewState', 'surface'], label);
    if (!ID.test(entry.id) || ids.has(entry.id)) throw new Error(`${label} has an invalid or duplicate id`);
    nonEmpty(entry.surface, `${label} surface`);
    const normalized = normalizeRhymeWord(entry.surface);
    if (!normalized || entry.normalized !== normalized || words.has(normalized)) throw new Error(`${label} has a noncanonical or duplicate surface`);
    if (!CATEGORIES.includes(entry.category)) throw new Error(`${label} has an invalid category`);
    enumArray(entry.regions, REGIONS, `${label} regions`);
    enumArray(entry.flags, FLAGS, `${label} flags`, true);
    if (!REVIEW_STATES.includes(entry.reviewState)) throw new Error(`${label} has an invalid review state`);
    enumArray(entry.evidenceIds, [...evidence.keys()], `${label} evidenceIds`);
    validatePronunciation(entry.pronunciation, normalized, label);
    validateDroppedFinalN(entry, label);
    if (!entry.flags.includes('rap')) throw new Error(`${label} must carry the rap flag`);
    if (entry.category === 'proper-name' !== entry.flags.includes('proper-noun')) throw new Error(`${label} proper-name flag is inconsistent`);
    if (entry.flags.includes('proper-noun') && entry.flags.includes('safety-blocked')) throw new Error(`${label} cannot combine proper-noun and safety-blocked flags`);
    ids.add(entry.id);
    words.add(normalized);
    entries.push(entry);
  }
  return entries;
}

function validateDroppedFinalN(entry, label) {
  if (!FINAL_N_CATEGORIES.has(entry.category) || !entry.normalized.endsWith('in')) {
    return;
  }
  const phones = entry.pronunciation.kind === 'direct'
    ? entry.pronunciation.phones
    : entry.pronunciation.verifiedPhones;
  if (phones.at(-2) !== 'IH0' || phones.at(-1) !== 'N') {
    throw new Error(`${label} dropped -in pronunciation must end in IH0 N`);
  }
}

function validatePronunciation(value, normalizedWord, label) {
  object(value, `${label} pronunciation`);
  if (value.kind === 'alias') {
    exactKeys(value, ['kind', 'target', 'verifiedPhones'], `${label} pronunciation`);
    nonEmpty(value.target, `${label} alias target`);
    if (value.target !== normalizeRhymeWord(value.target) || value.target.includes(' ')) {
      throw new Error(`${label} alias target must be a canonical single token`);
    }
    if (value.target === normalizedWord) {
      throw new Error(`${label} alias target must differ from its source word`);
    }
    validatePhoneArray(value.verifiedPhones, `${label} verified alias`);
    return;
  }
  if (value.kind === 'direct') {
    exactKeys(value, ['kind', 'phones'], `${label} pronunciation`);
    validatePhoneArray(value.phones, label);
    return;
  }
  throw new Error(`${label} pronunciation kind is invalid`);
}

function validatePhoneArray(phones, label) {
  if (!Array.isArray(phones) || phones.length === 0 || phones.length > MAX_PHONES_PER_PRONUNCIATION || phones.some((phone) => !isValidArpabetPhone(phone))) {
    throw new Error(`${label} contains invalid standard ARPAbet`);
  }
  if (!phones.some((phone) => /[0-2]$/u.test(phone))) {
    throw new Error(`${label} pronunciation has no stressed vowel phone`);
  }
}

function validateSafetyPolicy(value, entries) {
  object(value, 'Safety policy');
  exactKeys(value, ['anchorBehavior', 'maintainedEntryIds', 'ordinaryProfanity', 'schema', 'schemaVersion', 'unsolicitedBehavior'], 'Safety policy');
  if (value.schema !== 'lyricslab.rhyme-safety-policy' || value.schemaVersion !== 1) throw new Error('Unsupported safety policy schema');
  if (value.anchorBehavior !== 'analyze' || value.ordinaryProfanity !== 'eligible' || value.unsolicitedBehavior !== 'suppress-safety-blocked') throw new Error('Safety policy does not implement the accepted behavior');
  const blocked = entries.filter((entry) => entry.flags.includes('safety-blocked'));
  if (blocked.length === 0) throw new Error('Safety policy has no maintained high-risk entries');
  exactIdCoverage(value.maintainedEntryIds, blocked, 'Safety policy');
  return value;
}

function validateProperNounPolicy(value, entries) {
  object(value, 'Proper noun policy');
  exactKeys(value, ['anchorBehavior', 'maintainedEntryIds', 'prefixBehavior', 'schema', 'schemaVersion'], 'Proper noun policy');
  if (value.schema !== 'lyricslab.rhyme-proper-noun-policy' || value.schemaVersion !== 1) throw new Error('Unsupported proper noun policy schema');
  if (value.anchorBehavior !== 'analyze' || value.prefixBehavior !== 'require-explicit-normalized-prefix') throw new Error('Proper noun policy does not implement the accepted behavior');
  const properNouns = entries.filter((entry) => entry.flags.includes('proper-noun'));
  if (properNouns.length === 0) throw new Error('Proper noun policy has no maintained entries');
  exactIdCoverage(value.maintainedEntryIds, properNouns, 'Proper noun policy');
  return value;
}

/** Maps reviewed source flags into the existing Phase 03 binary bit contract. */
export function toPhase3WordFlags(entry) {
  return entry.flags.reduce((bits, flag) => bits | (
    flag === 'rap' ? WORD_FLAG.RAP
      : flag === 'safety-blocked' ? WORD_FLAG.SAFETY_BLOCKED
        : flag === 'proper-noun' ? WORD_FLAG.PROPER_NOUN : 0
  ), 0);
}

function summarize(entries) {
  const count = (key, values) => Object.fromEntries(values.map((value) => [value, entries.filter((entry) => key(entry).includes(value)).length]));
  return {
    total: entries.length,
    aliases: entries.filter((entry) => entry.pronunciation.kind === 'alias').length,
    direct: entries.filter((entry) => entry.pronunciation.kind === 'direct').length,
    reviewed: entries.filter((entry) => entry.reviewState === 'reviewed').length,
    categories: count((entry) => [entry.category], CATEGORIES),
    regions: count((entry) => entry.regions, REGIONS),
    flags: count((entry) => entry.flags, FLAGS),
  };
}

async function resolveContainedPath(root, relativePath) {
  if (path.isAbsolute(relativePath)) throw new Error('Source paths must be relative');
  const absolutePath = await realpath(path.resolve(root, relativePath));
  const relative = path.relative(root, absolutePath);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`Source path escapes manifest directory: ${relativePath}`);
  return absolutePath;
}

async function assertNoUndeclaredJsonSources(root, manifest) {
  const declared = new Set([
    'manifest.json',
    ...manifest.sources.map((source) => source.path.split(path.sep).join('/')),
  ]);
  const discovered = await collectJsonPaths(root, root);
  for (const relativePath of discovered) {
    if (!declared.has(relativePath)) {
      throw new Error(`Undeclared JSON source crosses the sealed evaluation boundary: ${relativePath}`);
    }
  }
}

async function collectJsonPaths(root, directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      paths.push(...await collectJsonPaths(root, absolutePath));
    } else if (entry.name.endsWith('.json')) {
      paths.push(path.relative(root, absolutePath).split(path.sep).join('/'));
    }
  }
  return paths;
}

function parseJson(bytes, label) {
  try { return JSON.parse(bytes.toString('utf8')); } catch { throw new Error(`Invalid JSON in ${label}`); }
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function exactKeys(value, expected, label) {
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) throw new Error(`${label} fields do not match the v1 schema`);
}

function nonEmpty(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0 || Buffer.byteLength(value, 'utf8') > 4096) throw new Error(`${label} must be a bounded non-empty string`);
}

function enumArray(value, allowed, label, allowEmpty = false) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.some((item) => !allowed.includes(item)) || new Set(value).size !== value.length) throw new Error(`${label} contains invalid or duplicate values`);
}

function validateCountFloors(value, expectedKeys, label) {
  object(value, `Manifest ${label} minimums`);
  exactKeys(value, expectedKeys, `Manifest ${label} minimums`);
  for (const [key, minimum] of Object.entries(value)) {
    if (!Number.isInteger(minimum) || minimum <= 0) {
      throw new Error(`Manifest ${label} minimum for ${key} must be a positive integer`);
    }
  }
}

function enforceCountFloors(actual, minimums, label) {
  for (const [key, minimum] of Object.entries(minimums)) {
    if (actual[key] < minimum) {
      throw new Error(`${label} ${key} count ${actual[key]} is below floor ${minimum}`);
    }
  }
}

function exactIdCoverage(value, entries, label) {
  if (!Array.isArray(value) || new Set(value).size !== value.length || value.some((id) => typeof id !== 'string')) {
    throw new Error(`${label} maintainedEntryIds must be unique strings`);
  }
  const actual = [...value].sort();
  const expected = entries.map((entry) => entry.id).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} maintainedEntryIds do not exactly cover flagged entries`);
  }
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
