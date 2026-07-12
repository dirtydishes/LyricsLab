import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const productionRoutes = await listFiles(path.join(root, 'app'));
const diagnosticsRoutes = await listFiles(path.join(root, 'diagnostics/app'));

assert.deepEqual(productionRoutes.sort(), [
  '_layout.tsx',
  'index.tsx',
  'settings.tsx',
  'song/[id].tsx',
]);
assert.deepEqual(diagnosticsRoutes.sort(), ['_layout.tsx', 'index.tsx']);

const diagnosticsSource = await readFile(
  path.join(root, 'src/diagnostics/RhymeDiagnosticsScreen.tsx'),
  'utf8',
);
assert.match(diagnosticsSource, /useProductionRhyme/u);
assert.match(diagnosticsSource, /getSuggestionView/u);
assert.match(diagnosticsSource, /<SuggestionBar/u);
assert.match(diagnosticsSource, /Run 60-sample device benchmark/u);
assert.match(diagnosticsSource, /Next sealed writer case/u);
assert.match(diagnosticsSource, /Share\.share/u);
assert.match(diagnosticsSource, /useLayoutEffect/u);
assert.match(diagnosticsSource, /setSyntheticState/u);
assert.match(diagnosticsSource, /setPreference/u);
assert.doesNotMatch(diagnosticsSource, /console\.|bodyText|user content/iu);

const suggestionBarSource = await readFile(path.join(root, 'src/editor/SuggestionBar.tsx'), 'utf8');
assert.doesNotMatch(suggestionBarSource, /measurementReceivedAt|onFirstCommittedFrame/u);
const diagnosticsRuntimeSource = await readFile(path.join(root, 'src/diagnostics/diagnosticsRuntime.ts'), 'utf8');
assert.match(diagnosticsRuntimeSource, /createProductionRhymeEngineRuntime/u);
assert.doesNotMatch(diagnosticsRuntimeSource, /createRhymeEngine|decodeRhymeData/u);

const production = config('0');
assert.equal(production.status, 0, production.stderr);
const productionConfig = JSON.parse(production.stdout);
assert.equal(productionConfig.extra.rhymeDiagnostics, false);
assert.equal(productionConfig.extra.router.root, 'app');
assert.equal(productionConfig.ios.bundleIdentifier, 'com.dirtydishes.lyricslab-mobile');
assert.equal(productionConfig.extra.buildGitCommit, undefined);

const enabled = config('1');
assert.equal(enabled.status, 0, enabled.stderr);
const enabledConfig = JSON.parse(enabled.stdout);
assert.equal(enabledConfig.extra.rhymeDiagnostics, true);
assert.equal(enabledConfig.extra.router.root, 'diagnostics/app');
assert.equal(enabledConfig.ios.bundleIdentifier, 'com.dirtydishes.lyricslab-mobile.diagnostics');
assert.match(enabledConfig.extra.buildGitCommit, /^[a-f0-9]{40}$/u);

const malformed = config('true');
assert.notEqual(malformed.status, 0);
assert.match(malformed.stderr, /must be exactly 0 or 1/u);

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
assert.equal(
  packageJson.scripts['diagnostics:expo-config'],
  'LYRICSLAB_DIAGNOSTICS_BUILD=1 expo config --type public',
);
assert.equal(
  packageJson.scripts['test:rhyme-diagnostics'],
  'node scripts/test-rhyme-diagnostics.mjs',
);

process.stdout.write('rhyme diagnostics build-boundary tests passed\n');

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(path.join(directory, entry.name), relative));
    } else {
      files.push(relative);
    }
  }
  return files;
}

function config(flag) {
  return spawnSync(process.execPath, ['-e', "process.stdout.write(JSON.stringify(require('./app.config.js')()))"], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, LYRICSLAB_DIAGNOSTICS_BUILD: flag },
  });
}
