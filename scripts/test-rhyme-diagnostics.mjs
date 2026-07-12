import assert from 'node:assert/strict';
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
assert.doesNotMatch(diagnosticsSource, /console\.|bodyText|user content/iu);

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
