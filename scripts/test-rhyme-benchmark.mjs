import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const first = runBenchmark();
const second = runBenchmark();

for (const report of [first, second]) {
  assert.equal(report.schemaVersion, 'lyricslab.rhyme-benchmark/v1');
  assert.equal(report.tool.name, 'benchmark:rhyme');
  assert.equal(report.seed, 600613);
  assert.equal(report.cases.length, 20);
  assert.equal(report.samples.length, 60);
  assert.equal(report.warmupRoundsDiscarded, 1);
  assert.equal(report.warmupsDiscarded, 20);
  assert.equal(report.measurement.kind, 'host-approximation');
  assert.equal(report.measurement.qualifiesAsPhysicalDeviceEvidence, false);
  assert.equal(report.caseLatency.length, 20);
  assert.ok(report.caseLatency.every((entry) => entry.samples === 3 && entry.p50Ms <= entry.p95Ms && entry.p95Ms <= entry.maxMs));
  assert.equal(typeof report.coldLoad.durationMs, 'number');
  assert.ok(report.latency.p50Ms <= report.latency.p95Ms);
  assert.ok(report.latency.p95Ms <= report.latency.maxMs);
  assert.deepEqual(report.thresholds, { p50MsExclusive: 50, p95MsExclusive: 100 });
  assert.equal(report.pass, report.latency.p50Ms < 50 && report.latency.p95Ms < 100);
  assert.match(report.hashes.artifactSha256, /^[a-f0-9]{64}$/u);
  assert.match(report.hashes.corpusSha256, /^[a-f0-9]{64}$/u);
  assert.match(report.hashes.stableReportSha256, /^[a-f0-9]{64}$/u);
  assert.match(report.hashes.sourceSha256, /^[a-f0-9]{64}$/u);
  const serialized = JSON.stringify(report).toLowerCase();
  for (const forbidden of ['bodytext', 'suggestions', 'returnedwords', 'lyrictext', '/home/']) {
    assert.doesNotMatch(serialized, new RegExp(forbidden, 'u'));
  }
  assert.ok(report.cases.every((entry) => Object.keys(entry).sort().join(',') === 'category,id'));
  assert.ok(report.samples.every((entry) => Object.keys(entry).sort().join(',') === 'caseId,durationMs'));
}

assert.equal(first.hashes.corpusSha256, second.hashes.corpusSha256);
assert.equal(first.hashes.stableReportSha256, second.hashes.stableReportSha256);
assert.deepEqual(first.cases, second.cases);
assert.deepEqual(first.measurement, second.measurement);

const bad = spawnSync(process.execPath, ['scripts/benchmark-rhyme.mjs', '--samples', '0'], {
  cwd: process.cwd(), encoding: 'utf8',
});
assert.notEqual(bad.status, 0);
assert.match(bad.stderr, /samples must be an integer/u);

const badWarmups = spawnSync(process.execPath, ['scripts/benchmark-rhyme.mjs', '--warmups', '0'], {
  cwd: process.cwd(), encoding: 'utf8',
});
assert.notEqual(badWarmups.status, 0);
assert.match(badWarmups.stderr, /warmups must be an integer/u);

process.stdout.write('rhyme benchmark repeated-run, schema, hash, privacy, and adversarial tests passed\n');

function runBenchmark() {
  const result = spawnSync(process.execPath, ['scripts/benchmark-rhyme.mjs', '--compact'], {
    cwd: process.cwd(), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}
