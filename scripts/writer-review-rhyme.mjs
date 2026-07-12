import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const packetPath = path.join(root, 'evaluation/rhyme-writer-review/packet-v1.json');
const args = process.argv.slice(2);
if (args.includes('--help') || args.length === 0) {
  process.stdout.write('Usage: npm run writer-review:rhyme -- --generate | --validate | --convert DECISIONS.jsonl --output FIXTURES.json\n');
  process.exit(0);
}
if (args.includes('--generate')) {
  const packet = await buildPacket();
  await writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`, { mode: 0o444 });
  process.stdout.write(`${packet.seal.packetContentSha256}\n`);
} else if (args.includes('--validate')) {
  validatePacket(JSON.parse(await readFile(packetPath, 'utf8')));
  process.stdout.write('sealed 60-case writer review packet is valid\n');
} else if (args.includes('--convert')) {
  const input = args[args.indexOf('--convert') + 1];
  const output = args[args.indexOf('--output') + 1];
  if (!input || !output) throw new Error('Conversion requires --convert DECISIONS.jsonl --output FIXTURES.json');
  const packet = JSON.parse(await readFile(packetPath, 'utf8')); validatePacket(packet);
  const records = (await readFile(input, 'utf8')).split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const signoff = records.at(-1);
  if (signoff?.kind !== 'signoff' || signoff.accepted !== true || !signoff.signedBy || !signoff.signedAt || signoff.packetSha256 !== packet.seal.packetContentSha256) throw new Error('Writer decision log is unsigned, unaccepted, or for a different packet');
  const fixtures = records.filter((entry) => entry.kind === 'decision' && entry.decision === 'rejected').map((entry) => {
    if (!packet.cases.some((item) => item.id === entry.caseId) || !['wrong-ranking', 'mislabeled', 'unsafe'].includes(entry.reason) || !entry.expected || !entry.rationale) throw new Error(`Rejected decision ${entry.caseId ?? 'unknown'} lacks an explicit regression correction`);
    return { caseId: entry.caseId, reason: entry.reason, expected: entry.expected, rationale: entry.rationale, sourcePacketSha256: packet.seal.packetContentSha256 };
  });
  await writeFile(output, `${JSON.stringify({ schemaVersion: 'lyricslab.rhyme-writer-regressions/v1', fixtures }, null, 2)}\n`);
  process.stdout.write(`converted ${fixtures.length} signed rejected rankings\n`);
} else throw new Error('Unknown writer-review command');

async function buildPacket() {
  const corpus = JSON.parse(await readFile(path.join(root, 'benchmarks/rhyme-benchmark-corpus-v1.json'), 'utf8'));
  const categories = ['exact', 'near', 'slant', 'rap-oov', 'safety', 'proper-prefix', 'repetition', 'casing', 'prefix', 'selection', 'loading-error-retry', 'theme-accessibility', 'recognized', 'unrecognized'];
  const cases = Array.from({ length: 60 }, (_, index) => {
    const source = corpus.cases[index % corpus.cases.length];
    const category = categories[index % categories.length];
    return {
      id: `writer-${String(index + 1).padStart(2, '0')}`,
      category,
      prompt: { synthetic: true, seedOffset: index, anchor: source.anchor, prefix: source.prefix, selectionEmpty: category === 'selection' ? false : source.selectionEmpty, state: category === 'loading-error-retry' ? ['loading', 'error', 'retry'][index % 3] : 'ready', theme: category === 'theme-accessibility' ? ['system', 'light', 'dark'][index % 3] : 'system' },
      resultReview: { rankedCandidates: [], technicalClassification: null, rationale: null },
      writerDecision: { decision: null, rationale: null, correction: null, reviewedBy: null, reviewedAt: null },
    };
  });
  const core = { schemaVersion: 'lyricslab.rhyme-writer-packet/v1', version: 'writer-packet-2026.07.12', seed: 600613, immutable: true, instructions: 'Use the diagnostics build to copy production-ranked synthetic results into resultReview, then append decisions to the separate log. Do not edit this packet.', cases };
  return { ...core, seal: { algorithm: 'sha256', packetContentSha256: sha256(canonicalJson(core)), corpusSha256: sha256(await readFile(path.join(root, 'benchmarks/rhyme-benchmark-corpus-v1.json'))) } };
}
function validatePacket(packet) {
  assert.equal(packet.schemaVersion, 'lyricslab.rhyme-writer-packet/v1'); assert.equal(packet.immutable, true); assert.equal(packet.cases.length, 60);
  assert.equal(new Set(packet.cases.map((entry) => entry.id)).size, 60);
  for (const required of ['exact', 'near', 'slant', 'rap-oov', 'safety', 'proper-prefix', 'repetition', 'casing', 'prefix', 'selection', 'loading-error-retry', 'theme-accessibility', 'recognized', 'unrecognized']) assert.ok(packet.cases.some((entry) => entry.category === required), `missing ${required}`);
  const { seal, ...core } = packet; assert.equal(seal.packetContentSha256, sha256(canonicalJson(core)));
  for (const entry of packet.cases) { assert.equal(entry.prompt.synthetic, true); assert.equal(entry.writerDecision.decision, null); assert.deepEqual(entry.resultReview.rankedCandidates, []); }
  assert.doesNotMatch(JSON.stringify(packet), /bodyText|real song|user lyric|signedBy/iu);
}
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function canonicalJson(value) { if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`; if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`; return JSON.stringify(value); }
