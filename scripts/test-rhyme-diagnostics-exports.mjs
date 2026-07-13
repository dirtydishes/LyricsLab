import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const temporary = await mkdtemp(path.join(os.tmpdir(), 'lyricslab-diagnostics-export-'));
try {
  const production = await exportBundle('0', path.join(temporary, 'production'));
  const diagnostics = await exportBundle('1', path.join(temporary, 'diagnostics'));
  assert.doesNotMatch(production, /Rhyme diagnostics|Run 60-sample device benchmark|writer-packet-2026\.07\.12/u);
  assert.match(production, /LyricsLab needs local network access|SongRepositoryProvider/u);
  assert.match(diagnostics, /Rhyme diagnostics/u);
  assert.match(diagnostics, /Run 60-sample device benchmark/u);
  assert.doesNotMatch(diagnostics, /SongRepositoryProvider/u);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
process.stdout.write('production exclusion and diagnostics enabled-export tests passed\n');

async function exportBundle(flag, output) {
  const result = spawnSync('npx', ['expo', 'export', '--platform', 'ios', '--no-bytecode', '--no-minify', '--max-workers', '1', '--output-dir', output], { cwd: root, encoding: 'utf8', env: { ...process.env, LYRICSLAB_DIAGNOSTICS_BUILD: flag }, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const files = await filesUnder(output);
  const bundles = files.filter((file) => file.endsWith('.js'));
  assert.equal(bundles.length, 1, `Expected one iOS JavaScript bundle, found ${bundles.length}`);
  return readFile(bundles[0], 'utf8');
}

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(target));
    else if (entry.isFile()) files.push(target);
  }
  return files;
}
