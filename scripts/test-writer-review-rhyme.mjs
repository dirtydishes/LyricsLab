import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const validate = run('scripts/writer-review-rhyme.mjs', '--validate'); assert.equal(validate.status, 0, validate.stderr);
const packetBefore = await readFile('evaluation/rhyme-writer-review/packet-v1.json');
const generatedOnce = run('scripts/writer-review-rhyme.mjs', '--generate'); assert.equal(generatedOnce.status, 0, generatedOnce.stderr);
const generatedTwice = run('scripts/writer-review-rhyme.mjs', '--generate'); assert.equal(generatedTwice.status, 0, generatedTwice.stderr);
assert.deepEqual(await readFile('evaluation/rhyme-writer-review/packet-v1.json'), packetBefore);
const regressions = run('scripts/writer-regression-rhyme.mjs'); assert.equal(regressions.status, 0, regressions.stderr); assert.match(regressions.stdout, /writer regression fixtures passed/u);
const packet = JSON.parse(await readFile('evaluation/rhyme-writer-review/packet-v1.json', 'utf8')); assert.equal(packet.cases.length, 60);
const unsigned = run('scripts/writer-review-rhyme.mjs', '--convert', 'evaluation/rhyme-writer-review/decisions-v1.jsonl', '--output', '/tmp/should-not-exist.json'); assert.notEqual(unsigned.status, 0); assert.match(unsigned.stderr, /unsigned/u);
const unsignedValidation = run('scripts/writer-review-rhyme.mjs', '--validate-decisions', 'evaluation/rhyme-writer-review/decisions-v1.jsonl'); assert.notEqual(unsignedValidation.status, 0); assert.match(unsignedValidation.stderr, /unsigned/u);
const directory = await mkdtemp(path.join(process.cwd(), 'evaluation/rhyme-writer-review/.test-'));
try {
  const decisions = path.join(directory, 'decisions.jsonl'); const output = path.join(directory, 'fixtures.json');
  const records = [
    { kind: 'log-header', schemaVersion: 'lyricslab.rhyme-writer-decisions/v1', appendOnly: true, packetVersion: packet.version, packetSha256: packet.seal.packetContentSha256 },
    ...packet.cases.map((entry, index) => ({ kind: 'decision', sequence: index + 1, caseId: entry.id, decision: index === 0 ? 'rejected' : 'accepted', reason: index === 0 ? 'wrong-ranking' : null, correction: index === 0 ? { assertion: 'top-three-contains-sha256', expectedSuggestionSha256: 'a'.repeat(64) } : null, topThreeAcceptable: index !== 0, rationale: 'Synthetic review test rationale.', reviewedBy: 'automated-test-fixture', reviewedAt: `2000-01-01T00:${String(index).padStart(2, '0')}:00.000Z` })),
    { kind: 'signoff', sequence: 61, accepted: true, signedBy: 'automated-test-fixture', signedAt: '2000-01-01T01:00:00.000Z', packetSha256: packet.seal.packetContentSha256 },
  ];
  await writeFile(decisions, `${records.map(JSON.stringify).join('\n')}\n`);
  const converted = run('scripts/writer-review-rhyme.mjs', '--convert', decisions, '--output', output); assert.equal(converted.status, 0, converted.stderr);
  const fixtures = JSON.parse(await readFile(output, 'utf8')); assert.equal(fixtures.fixtures.length, 1); assert.equal(fixtures.fixtures[0].reason, 'wrong-ranking');
  const escaped = run('scripts/writer-review-rhyme.mjs', '--convert', decisions, '--output', path.join('/tmp', `lyricslab-escape-${process.pid}.json`)); assert.notEqual(escaped.status, 0); assert.match(escaped.stderr, /must be a new file under/u);
  const overwrite = run('scripts/writer-review-rhyme.mjs', '--convert', decisions, '--output', output); assert.notEqual(overwrite.status, 0); assert.match(overwrite.stderr, /already exists/u);
  const duplicateRecords = [...records.slice(0, -1), records[1], records.at(-1)];
  await writeFile(decisions, `${duplicateRecords.map(JSON.stringify).join('\n')}\n`);
  const duplicate = run('scripts/writer-review-rhyme.mjs', '--convert', decisions, '--output', path.join(directory, 'duplicate.json'));
  assert.notEqual(duplicate.status, 0); assert.match(duplicate.stderr, /duplicate writer decision/u);
} finally { await rm(directory, { recursive: true, force: true }); }
const bytes = await readFile('evaluation/rhyme-writer-review/packet-v1.json');
const seal = JSON.parse(await readFile('evaluation/rhyme-writer-review/packet-v1.seal.json', 'utf8'));
assert.equal(createHash('sha256').update(bytes).digest('hex'), seal.packetFileSha256);
process.stdout.write('writer packet seal, validation, unsigned rejection, and rejection-fixture tests passed\n');
function run(...args) { return spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8' }); }
