import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const help = run('scripts/benchmark-rhyme-ios.mjs', '--help');
assert.equal(help.status, 0); assert.match(help.stdout, /physical iPhone/u);
const noDevice = run('scripts/benchmark-rhyme-ios.mjs');
assert.notEqual(noDevice.status, 0); assert.match(noDevice.stderr, /Missing required --device/u);
const host = run('scripts/benchmark-rhyme-ios.mjs', '--device', 'Test iPhone');
assert.notEqual(host.status, 0); assert.match(host.stderr, /requires macOS/u);
const template = run('scripts/rhyme-ios-evidence.mjs', '--template', '--device', 'Pending iPhone');
assert.equal(template.status, 0); const parsed = JSON.parse(template.stdout); assert.equal(parsed.cases.length, 22);
const directory = await mkdtemp(path.join(os.tmpdir(), 'lyricslab-ios-evidence-'));
try {
  const file = path.join(directory, 'evidence.json'); await writeFile(file, template.stdout);
  const rejected = run('scripts/rhyme-ios-evidence.mjs', '--validate', file);
  assert.notEqual(rejected.status, 0);
  for (const message of ['missing physical device identity', 'absent airplane-mode evidence', 'benchmark thresholds failed', 'writer review is unsigned', 'missing passing case']) assert.match(rejected.stderr, new RegExp(message, 'u'));
} finally { await rm(directory, { recursive: true, force: true }); }
process.stdout.write('iOS benchmark CLI, schema template, preflight, and fail-closed tests passed\n');

function run(...args) { return spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8' }); }
