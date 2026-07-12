import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os'; import path from 'node:path';

const validate = run('scripts/writer-review-rhyme.mjs', '--validate'); assert.equal(validate.status, 0, validate.stderr);
const packet = JSON.parse(await readFile('evaluation/rhyme-writer-review/packet-v1.json', 'utf8')); assert.equal(packet.cases.length, 60);
const unsigned = run('scripts/writer-review-rhyme.mjs', '--convert', 'evaluation/rhyme-writer-review/decisions-v1.jsonl', '--output', '/tmp/should-not-exist.json'); assert.notEqual(unsigned.status, 0); assert.match(unsigned.stderr, /unsigned/u);
const directory = await mkdtemp(path.join(os.tmpdir(), 'lyricslab-writer-review-'));
try {
  const decisions = path.join(directory, 'decisions.jsonl'); const output = path.join(directory, 'fixtures.json');
  const records = [
    { kind: 'decision', caseId: 'writer-01', decision: 'rejected', reason: 'wrong-ranking', expected: { topThreeIncludes: ['synthetic-correction'] }, rationale: 'Temporary conversion test fixture.' },
    { kind: 'signoff', accepted: true, signedBy: 'automated-test-fixture', signedAt: '2000-01-01T00:00:00.000Z', packetSha256: packet.seal.packetContentSha256 },
  ];
  await writeFile(decisions, `${records.map(JSON.stringify).join('\n')}\n`);
  const converted = run('scripts/writer-review-rhyme.mjs', '--convert', decisions, '--output', output); assert.equal(converted.status, 0, converted.stderr);
  const fixtures = JSON.parse(await readFile(output, 'utf8')); assert.equal(fixtures.fixtures.length, 1); assert.equal(fixtures.fixtures[0].reason, 'wrong-ranking');
} finally { await rm(directory, { recursive: true, force: true }); }
const bytes = await readFile('evaluation/rhyme-writer-review/packet-v1.json'); assert.match(createHash('sha256').update(bytes).digest('hex'), /^[a-f0-9]{64}$/u);
process.stdout.write('writer packet seal, validation, unsigned rejection, and rejection-fixture tests passed\n');
function run(...args) { return spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8' }); }
