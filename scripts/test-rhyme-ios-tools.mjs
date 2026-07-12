import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createIosEvidenceTemplate, validateDeviceBenchmarkReport, validateIosEvidence } from './lib/rhyme-ios-contract.mjs';

const help = run('scripts/benchmark-rhyme-ios.mjs', '--help');
assert.equal(help.status, 0); assert.match(help.stdout, /physical iPhone/u);
const noDevice = run('scripts/benchmark-rhyme-ios.mjs');
assert.notEqual(noDevice.status, 0); assert.match(noDevice.stderr, /Missing required --device/u);
const host = run('scripts/benchmark-rhyme-ios.mjs', '--device', 'Test iPhone', '--app', 'x.app', '--report', 'x.json', '--evidence', 'x.json', '--artifacts', 'x');
assert.notEqual(host.status, 0); assert.match(host.stderr, /valid physical-device UDID/u);
const injected = run('scripts/benchmark-rhyme-ios.mjs', '--device', 'abc; touch /tmp/injected', '--app', 'x.app', '--report', 'x.json', '--evidence', 'x.json', '--artifacts', 'x');
assert.notEqual(injected.status, 0); assert.match(injected.stderr, /valid physical-device UDID/u);
const template = run('scripts/rhyme-ios-evidence.mjs', '--template', '--device', 'Pending iPhone');
assert.equal(template.status, 0); const parsed = JSON.parse(template.stdout); assert.equal(parsed.cases.length, 25);
const directory = await mkdtemp(path.join(os.tmpdir(), 'lyricslab-ios-evidence-'));
try {
  const file = path.join(directory, 'evidence.json'); await writeFile(file, template.stdout);
  const rejected = run('scripts/rhyme-ios-evidence.mjs', '--validate', file);
  assert.notEqual(rejected.status, 0);
  for (const message of ['missing physical device identity', 'absent airplane-mode evidence', 'benchmark thresholds failed', 'writer review is unsigned', 'missing passing case']) assert.match(rejected.stderr, new RegExp(message, 'u'));
  const malformed = JSON.parse(template.stdout);
  malformed.cases = Array.from({ length: 25 }, () => ({ id: 'latency', status: 'pass', attestedBy: 'x', timestamp: 'not-a-time', evidenceSha256: ['0'.repeat(64)] }));
  malformed.device.physical = true;
  await writeFile(file, JSON.stringify(malformed));
  const duplicate = run('scripts/rhyme-ios-evidence.mjs', '--validate', file);
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stderr, /duplicate case id|invalid timestamp/u);
} finally { await rm(directory, { recursive: true, force: true }); }

const valid = createIosEvidenceTemplate('00008110-0012345678901234');
Object.assign(valid.device, { name: 'Test iPhone', model: 'iPhone', osVersion: '26.0' });
Object.assign(valid.build, { appVersion: '1.0.0', bundleIdentifier: 'com.dirtydishes.lyricslab-mobile.diagnostics', gitCommit: 'a'.repeat(40), artifactSha256: '1'.repeat(64), manifestSha256: '2'.repeat(64), buildFingerprintSha256: '3'.repeat(64), builtAt: '2026-07-12T12:00:00.000Z' });
Object.assign(valid.airplaneMode, { enabled: true, attestedBy: 'device-reviewer', timestamp: '2026-07-12T12:01:00.000Z', evidenceSha256: '4'.repeat(64) });
Object.assign(valid.benchmark, { reportSha256: '5'.repeat(64), interval: 'selection-context-received-to-first-react-committed-suggestion-frame', samples: 60, warmupsDiscarded: 20, coldLoadMs: 1000, p50Ms: 20, p95Ms: 40, maxMs: 60, pass: true });
Object.assign(valid.writerReview, { packetSha256: '6'.repeat(64), decisionLogSha256: '7'.repeat(64), accepted: true, signedBy: 'device-reviewer', signedAt: '2026-07-12T12:02:00.000Z' });
valid.cases = valid.cases.map((entry, index) => ({ ...entry, status: 'pass', attestedBy: 'device-reviewer', timestamp: `2026-07-12T12:${String(index + 3).padStart(2, '0')}:00.000Z`, evidenceSha256: ['8'.repeat(64)] }));
valid.cases.find(({ id }) => id === 'local-release-build').evidenceSha256.push(valid.build.buildFingerprintSha256);
valid.cases.find(({ id }) => id === 'airplane-mode').evidenceSha256.push(valid.airplaneMode.evidenceSha256);
valid.cases.find(({ id }) => id === 'latency').evidenceSha256.push(valid.benchmark.reportSha256);
valid.cases.find(({ id }) => id === 'writer-signoff').evidenceSha256.push(valid.writerReview.decisionLogSha256);
Object.assign(valid.attestation, { signedBy: 'device-reviewer', signedAt: '2026-07-12T12:59:00.000Z', statement: 'I completed every listed physical iPhone release check.' });
assert.deepEqual(validateIosEvidence(valid), []);
assert.match(validateIosEvidence(valid, { 'device.udid': 'wrong-device' }).join('\n'), /does not match independently derived evidence/u);

const corpus = { cases: Array.from({ length: 20 }, (_, index) => ({ id: `case-${index + 1}` })) };
const sampleRecords = corpus.cases.flatMap(({ id }, index) => [10 + index / 10, 11 + index / 10, 12 + index / 10].map((durationMs) => ({ caseId: id, durationMs })));
const orderedDurations = sampleRecords.map(({ durationMs }) => durationMs).sort((a, b) => a - b);
const deviceReport = {
  schemaVersion: 'lyricslab.rhyme-ios-benchmark/v1',
  measurement: { interval: 'selection-context-received-to-first-react-committed-suggestion-frame', qualifiesAsPhysicalDeviceEvidence: true },
  build: { profile: 'release-diagnostics', release: true, diagnosticsEnabled: true, bundleIdentifier: 'com.dirtydishes.lyricslab-mobile.diagnostics', gitCommit: 'a'.repeat(40) },
  device: { platform: 'ios' }, artifact: { artifactSha256: '1'.repeat(64), manifestSha256: '2'.repeat(64) }, corpus: { sha256: '3'.repeat(64) },
  samples: 60, sampleRecords, warmupsDiscarded: 20, coldLoad: { durationMs: 1000, includedInLatency: false },
  caseLatency: corpus.cases.map(({ id }, index) => ({ caseId: id, samples: 3, p50Ms: 11 + index / 10, p95Ms: 12 + index / 10, maxMs: 12 + index / 10 })),
  latency: { p50Ms: orderedDurations[29], p95Ms: orderedDurations[56], maxMs: orderedDurations.at(-1) }, pass: true,
};
const reportExpected = { artifactSha256: '1'.repeat(64), manifestSha256: '2'.repeat(64), corpusSha256: '3'.repeat(64), gitCommit: 'a'.repeat(40), corpus };
assert.deepEqual(validateDeviceBenchmarkReport(deviceReport, reportExpected), []);
deviceReport.sampleRecords[0] = { caseId: 'case-1', durationMs: -1 };
assert.match(validateDeviceBenchmarkReport(deviceReport, reportExpected).join('\n'), /malformed samples|aggregate/u);
process.stdout.write('iOS benchmark CLI, schema template, preflight, and fail-closed tests passed\n');

function run(...args) { return spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8' }); }
