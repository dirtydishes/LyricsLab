import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const reviewRoot = path.join(root, 'evaluation/rhyme-writer-review');
const packetPath = path.join(reviewRoot, 'packet-v1.json');
const sealPath = path.join(reviewRoot, 'packet-v1.seal.json');
const args = process.argv.slice(2);
const PROMPTS = {
  exact: prompts(['cat', 'light', 'dream', 'beat', 'city']),
  near: prompts(['bet', 'flow', 'gold', 'voice', 'alive']),
  slant: prompts(['move', 'truth', 'room', 'fire', 'mind']),
  'rap-oov': prompts(['drip', 'finna', 'cap', 'lit', 'vibe']),
  safety: prompts(['think', 'clean', 'calm', 'bright']),
  'proper-prefix': [{ anchor: 'bell', prefix: 'at' }, { anchor: 'york', prefix: 'new' }, { anchor: 'francisco', prefix: 'san' }, { anchor: 'angeles', prefix: 'los' }],
  repetition: prompts(['night', 'time', 'mind', 'flow']),
  casing: [{ anchor: 'time', prefix: 'FL' }, { anchor: 'night', prefix: 'BR' }, { anchor: 'dream', prefix: 'SE' }, { anchor: 'city', prefix: 'PR' }],
  prefix: [{ anchor: 'mind', prefix: 'k' }, { anchor: 'light', prefix: 'br' }, { anchor: 'cat', prefix: 'h' }, { anchor: 'time', prefix: 'fl' }],
  selection: prompts(['fire', 'truth', 'room', 'dream']).map((prompt) => ({ ...prompt, selectionEmpty: false })),
  'loading-error-retry': [{ anchor: 'dream', prefix: '', state: 'loading' }, { anchor: 'beat', prefix: '', state: 'error' }, { anchor: 'light', prefix: '', state: 'retry' }, { anchor: 'flow', prefix: '', state: 'error' }],
  'theme-accessibility': [{ anchor: 'beat', prefix: '', theme: 'system' }, { anchor: 'bell', prefix: 'at', theme: 'light' }, { anchor: 'voice', prefix: '', theme: 'dark' }, { anchor: 'think', prefix: '', theme: 'system' }],
  recognized: prompts(['cat', 'drip', 'alive', 'bell']),
  unrecognized: prompts(['zzqv', 'qzxk', 'vvqj', 'xqzz']),
};

if (args.includes('--help') || args.length === 0) {
  process.stdout.write('Usage: npm run writer-review:rhyme -- --generate | --validate | --validate-decisions DECISIONS.jsonl | --convert DECISIONS.jsonl --output NEW-FIXTURES.json\nConversion requires exactly 60 uniquely attributed decisions plus final signoff and never overwrites an existing file.\n');
  process.exit(0);
}
if (args.length === 1 && args[0] === '--generate') {
  const packet = await buildPacket();
  const packetBytes = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`);
  const seal = { schemaVersion: 'lyricslab.rhyme-writer-packet-seal/v1', packetVersion: packet.version, packetContentSha256: packet.seal.packetContentSha256, packetFileSha256: sha256(packetBytes), corpusSha256: packet.seal.corpusSha256 };
  await atomicWrite(packetPath, packetBytes);
  await atomicWrite(sealPath, `${JSON.stringify(seal, null, 2)}\n`);
  process.stdout.write(`${seal.packetContentSha256}\n`);
} else if (args.length === 1 && args[0] === '--validate') {
  await loadValidatedPacket();
  process.stdout.write('sealed 60-case writer review packet is valid\n');
} else if (args.length === 2 && args[0] === '--validate-decisions') {
  const packet = await loadValidatedPacket();
  parseDecisionLog(await readDecisionLog(path.resolve(args[1])), packet);
  process.stdout.write('signed 60-case writer decision log is valid\n');
} else if (args[0] === '--convert' && args[2] === '--output' && args.length === 4) {
  const input = path.resolve(args[1]);
  const output = path.resolve(args[3]);
  const packet = await loadValidatedPacket();
  const records = parseDecisionLog(await readDecisionLog(input), packet);
  const relativeOutput = path.relative(reviewRoot, output);
  if (!relativeOutput || relativeOutput.startsWith(`..${path.sep}`) || path.isAbsolute(relativeOutput)) throw new Error('Regression output must be a new file under evaluation/rhyme-writer-review');
  const fixtures = records.decisions.filter(({ decision }) => decision === 'rejected').map((entry) => ({
    caseId: entry.caseId,
    reason: entry.reason,
    assertion: entry.correction.assertion,
    expectedSuggestionSha256: entry.correction.expectedSuggestionSha256,
    ...(entry.correction.expectedRole ? { expectedRole: entry.correction.expectedRole } : {}),
    sourcePacketSha256: packet.seal.packetContentSha256,
  }));
  try {
    await writeFile(output, `${JSON.stringify({ schemaVersion: 'lyricslab.rhyme-writer-regressions/v1', fixtures }, null, 2)}\n`, { flag: 'wx', mode: 0o444 });
  } catch (error) {
    if (error?.code === 'EEXIST') throw new Error(`Regression output already exists: ${output}`);
    throw error;
  }
  process.stdout.write(`converted ${fixtures.length} signed rejected rankings\n`);
} else {
  throw new Error('Unknown or incomplete writer-review command');
}

async function buildPacket() {
  const corpusBytes = await readFile(path.join(root, 'benchmarks/rhyme-benchmark-corpus-v1.json'));
  const categories = Object.keys(PROMPTS);
  const plan = categories.flatMap((category) => PROMPTS[category].slice(0, 4).map((prompt) => ({ category, prompt })))
    .concat(['exact', 'near', 'slant', 'rap-oov'].map((category) => ({ category, prompt: PROMPTS[category][4] })));
  const cases = plan.map(({ category, prompt }, index) => {
    return {
      id: `writer-${String(index + 1).padStart(2, '0')}`,
      category,
      prompt: { synthetic: true, seedOffset: index, selectionEmpty: true, state: 'ready', theme: 'system', ...prompt },
    };
  });
  const core = { schemaVersion: 'lyricslab.rhyme-writer-packet/v1', version: 'writer-packet-2026.07.12', seed: 600613, immutable: true, instructions: 'Review only the production-rendered results for each synthetic prompt in the diagnostics build. Append uniquely attributed decisions to the separate log. Never copy returned words or edit this packet.', cases };
  return { ...core, seal: { algorithm: 'sha256', packetContentSha256: sha256(canonicalJson(core)), corpusSha256: sha256(corpusBytes) } };
}

async function loadValidatedPacket() {
  const packetBytes = await readFile(packetPath);
  const packet = JSON.parse(packetBytes.toString('utf8'));
  const externalSeal = JSON.parse(await readFile(sealPath, 'utf8'));
  validatePacket(packet);
  exactKeys(externalSeal, ['corpusSha256', 'packetContentSha256', 'packetFileSha256', 'packetVersion', 'schemaVersion'], 'external packet seal');
  assert.equal(externalSeal.schemaVersion, 'lyricslab.rhyme-writer-packet-seal/v1');
  assert.equal(externalSeal.packetVersion, packet.version);
  assert.equal(externalSeal.packetContentSha256, packet.seal.packetContentSha256);
  assert.equal(externalSeal.corpusSha256, packet.seal.corpusSha256);
  assert.equal(externalSeal.packetFileSha256, sha256(packetBytes), 'writer packet file hash differs from independent seal');
  return packet;
}

async function readDecisionLog(input) {
  const inputStat = await lstat(input);
  if (!inputStat.isFile() || inputStat.isSymbolicLink() || inputStat.size > 1024 * 1024) throw new Error('Decision log must be a regular non-symlink file smaller than 1 MiB');
  return readFile(input, 'utf8');
}

function validatePacket(packet) {
  exactKeys(packet, ['cases', 'immutable', 'instructions', 'schemaVersion', 'seal', 'seed', 'version'], 'packet');
  assert.equal(packet.schemaVersion, 'lyricslab.rhyme-writer-packet/v1');
  assert.equal(packet.immutable, true);
  assert.equal(packet.seed, 600613);
  assert.equal(packet.cases.length, 60);
  assert.equal(new Set(packet.cases.map((entry) => entry.id)).size, 60);
  for (const required of ['exact', 'near', 'slant', 'rap-oov', 'safety', 'proper-prefix', 'repetition', 'casing', 'prefix', 'selection', 'loading-error-retry', 'theme-accessibility', 'recognized', 'unrecognized']) assert.ok(packet.cases.filter((entry) => entry.category === required).length >= 4, `insufficient ${required} coverage`);
  const { seal, ...core } = packet;
  exactKeys(seal, ['algorithm', 'corpusSha256', 'packetContentSha256'], 'packet seal');
  assert.equal(seal.algorithm, 'sha256');
  assert.equal(seal.packetContentSha256, sha256(canonicalJson(core)));
  for (const entry of packet.cases) {
    exactKeys(entry, ['category', 'id', 'prompt'], `packet case ${entry.id ?? 'unknown'}`);
    assert.equal(entry.prompt.synthetic, true);
    exactKeys(entry.prompt, ['anchor', 'prefix', 'seedOffset', 'selectionEmpty', 'state', 'synthetic', 'theme'], `packet prompt ${entry.id}`);
  }
  assert.ok(packet.cases.filter((entry) => entry.category === 'selection').every((entry) => entry.prompt.selectionEmpty === false));
  assert.ok(packet.cases.filter((entry) => entry.category === 'loading-error-retry').every((entry) => entry.prompt.state !== 'ready'));
  assert.deepEqual(new Set(packet.cases.filter((entry) => entry.category === 'theme-accessibility').map((entry) => entry.prompt.theme)), new Set(['system', 'light', 'dark']));
  assert.doesNotMatch(JSON.stringify(packet), /bodyText|real song|user lyric|signedBy|returnedWords/iu);
}

function parseDecisionLog(source, packet) {
  const records = source.split('\n').filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`Decision log line ${index + 1} is not valid JSON`); }
  });
  const header = records[0];
  exactKeys(header, ['appendOnly', 'kind', 'packetSha256', 'packetVersion', 'schemaVersion'], 'decision log header');
  if (header.kind !== 'log-header' || header.schemaVersion !== 'lyricslab.rhyme-writer-decisions/v1' || header.appendOnly !== true || header.packetVersion !== packet.version || header.packetSha256 !== packet.seal.packetContentSha256) throw new Error('Writer decision log header does not match the sealed packet');
  const signoff = records.at(-1);
  if (signoff?.kind !== 'signoff' || signoff.accepted !== true) throw new Error('Writer decision log is unsigned or unaccepted');
  exactKeys(signoff, ['accepted', 'kind', 'packetSha256', 'sequence', 'signedAt', 'signedBy'], 'writer signoff');
  if (signoff.packetSha256 !== packet.seal.packetContentSha256 || signoff.sequence !== 61 || !text(signoff.signedBy) || !timestamp(signoff.signedAt)) throw new Error('Writer signoff is malformed or for a different packet');
  const decisions = records.slice(1, -1);
  const seen = new Set();
  decisions.forEach((entry, index) => {
    exactKeys(entry, ['caseId', 'correction', 'decision', 'kind', 'rationale', 'reason', 'reviewedAt', 'reviewedBy', 'sequence', 'topThreeAcceptable'], `writer decision ${index + 1}`);
    if (seen.has(entry.caseId)) throw new Error(`duplicate writer decision for ${entry.caseId}`);
    seen.add(entry.caseId);
    if (entry.kind !== 'decision' || entry.sequence !== index + 1 || !packet.cases.some((item) => item.id === entry.caseId)) throw new Error(`Writer decision ${index + 1} is out of sequence or references an unknown case`);
    if (!text(entry.rationale) || !text(entry.reviewedBy) || !timestamp(entry.reviewedAt) || entry.reviewedBy !== signoff.signedBy) throw new Error(`Writer decision ${entry.caseId} is not uniquely attributable`);
    if (entry.decision === 'accepted') {
      if (entry.reason !== null || entry.correction !== null || entry.topThreeAcceptable !== true) throw new Error(`Accepted decision ${entry.caseId} has contradictory correction fields`);
    } else if (entry.decision === 'rejected') {
      if (!['wrong-ranking', 'mislabeled', 'unsafe'].includes(entry.reason) || entry.topThreeAcceptable !== false) throw new Error(`Rejected decision ${entry.caseId} has an invalid reason`);
      const correctionKeys = entry.reason === 'mislabeled' ? ['assertion', 'expectedRole', 'expectedSuggestionSha256'] : ['assertion', 'expectedSuggestionSha256'];
      exactKeys(entry.correction, correctionKeys, `correction for ${entry.caseId}`);
      const validCorrection = hash(entry.correction.expectedSuggestionSha256) && (
        (entry.reason === 'wrong-ranking' && entry.correction.assertion === 'top-three-contains-sha256') ||
        (entry.reason === 'mislabeled' && entry.correction.assertion === 'top-three-role-sha256' && ['perfect', 'near'].includes(entry.correction.expectedRole)) ||
        (entry.reason === 'unsafe' && entry.correction.assertion === 'all-exclude-sha256')
      );
      if (!validCorrection) throw new Error(`Rejected decision ${entry.caseId} lacks a focused deterministic regression correction`);
    } else throw new Error(`Writer decision ${entry.caseId} has an invalid decision`);
  });
  if (decisions.length !== packet.cases.length) throw new Error('Writer decision log must contain exactly one decision for every packet case');
  if (Date.parse(signoff.signedAt) < Math.max(...decisions.map(({ reviewedAt }) => Date.parse(reviewedAt)))) throw new Error('Writer signoff predates its decisions');
  return { decisions, signoff };
}

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(codeUnitCompare), [...expected].sort(codeUnitCompare), `${label} fields do not match the v1 schema`);
}
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function canonicalJson(value) { if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`; if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => codeUnitCompare(a, b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`; return JSON.stringify(value); }
function codeUnitCompare(left, right) { return left < right ? -1 : left > right ? 1 : 0; }
function text(value) { return typeof value === 'string' && value.trim().length > 0; }
function timestamp(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) && Number.isFinite(Date.parse(value)); }
function hash(value) { return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value); }

async function atomicWrite(target, contents) {
  const temporary = `${target}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, contents, { flag: 'wx', mode: 0o444 });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}

function prompts(anchors) { return anchors.map((anchor) => ({ anchor, prefix: '' })); }
