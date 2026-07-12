import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  CATEGORIES,
  REGIONS,
  loadAndValidateRhymeSources,
  toPhase3WordFlags,
} from './rhyme-sources/contract.mjs';
import { WORD_FLAG } from './rhyme-data/format.mjs';

const sourceRoot = path.resolve('data/rhyme-sources');
const sourceManifest = JSON.parse(await readFile(path.join(sourceRoot, 'manifest.json'), 'utf8'));
const sourceValues = Object.fromEntries(await Promise.all(
  sourceManifest.sources.map(async (source) => [
    source.role,
    JSON.parse(await readFile(path.join(sourceRoot, source.path), 'utf8')),
  ]),
));

const loaded = await loadAndValidateRhymeSources(path.join(sourceRoot, 'manifest.json'));
assert.equal(loaded.summary.total, 547);
assert.equal(loaded.summary.reviewed, loaded.summary.total);
assert.equal(loaded.summary.aliases + loaded.summary.direct, loaded.summary.total);
for (const category of CATEGORIES) assert.ok(loaded.summary.categories[category] > 0, `missing ${category}`);
for (const region of REGIONS) assert.ok(loaded.summary.regions[region] > 0, `missing ${region}`);

const directEntry = loaded.entries.find((entry) => entry.pronunciation.kind === 'direct');
const aliasEntry = loaded.entries.find((entry) => entry.pronunciation.kind === 'alias');
assert.ok(directEntry?.pronunciation.phones.length > 0);
assert.ok(aliasEntry?.pronunciation.target);
assert.ok(aliasEntry?.pronunciation.verifiedPhones.length > 0);

const safetyEntry = loaded.entries.find((entry) => entry.flags.includes('safety-blocked'));
const properEntry = loaded.entries.find((entry) => entry.flags.includes('proper-noun'));
assert.equal(toPhase3WordFlags(safetyEntry), WORD_FLAG.RAP | WORD_FLAG.SAFETY_BLOCKED);
assert.equal(toPhase3WordFlags(properEntry), WORD_FLAG.RAP | WORD_FLAG.PROPER_NOUN);
assert.ok(loaded.entries.some((entry) => entry.normalized === 'shit' && !entry.flags.includes('safety-blocked')));

for (const runtimePath of ['app', 'src/editor', 'src/platform', 'src/settings']) {
  await assertNoRuntimeActivation(path.resolve(runtimePath));
}

await rejectsMutation('duplicate surface', ({ lexicon }) => {
  lexicon[1].surface = lexicon[0].surface;
  lexicon[1].normalized = lexicon[0].normalized;
}, /noncanonical or duplicate surface/u);

await rejectsMutation('malformed ARPAbet', ({ lexicon }) => {
  const entry = lexicon.find((candidate) => candidate.pronunciation.kind === 'direct');
  entry.pronunciation.phones = ['NOT_A_PHONE1'];
}, /invalid standard ARPAbet/u);

await rejectsMutation('unstressed direct transcription', ({ lexicon }) => {
  const entry = lexicon.find((candidate) => candidate.pronunciation.kind === 'direct');
  entry.pronunciation.phones = ['M'];
}, /no stressed vowel/u);

await rejectsMutation('ambiguous multi-token alias', ({ lexicon }) => {
  const entry = lexicon.find((candidate) => candidate.pronunciation.kind === 'alias');
  entry.pronunciation.target = 'two words';
}, /canonical single token/u);

await rejectsMutation('self alias', ({ lexicon }) => {
  const entry = lexicon.find((candidate) => candidate.pronunciation.kind === 'alias');
  entry.pronunciation.target = entry.normalized;
}, /must differ/u);

await rejectsMutation('missing provenance', ({ lexicon }) => {
  lexicon[0].evidenceIds = ['editorial.missing'];
}, /evidenceIds contains invalid/u);

await rejectsMutation('unreviewed record', ({ lexicon }) => {
  lexicon[0].reviewState = 'draft';
}, /invalid review state/u);

await rejectsMutation('invalid category', ({ lexicon }) => {
  lexicon[0].category = 'marketing-copy';
}, /invalid category/u);

await rejectsMutation('invalid region', ({ lexicon }) => {
  lexicon[0].regions = ['internet'];
}, /regions contains invalid/u);

await rejectsMutation('safety policy omission', ({ lexicon, safetyPolicy }) => {
  const blocked = lexicon.find((entry) => entry.flags.includes('safety-blocked'));
  safetyPolicy.maintainedEntryIds = safetyPolicy.maintainedEntryIds.filter((id) => id !== blocked.id);
}, /do not exactly cover/u);

await rejectsMutation('proper policy omission', ({ lexicon, properNounPolicy }) => {
  properNounPolicy.maintainedEntryIds = properNounPolicy.maintainedEntryIds.slice(1);
}, /do not exactly cover/u);

await rejectsMutation('acceptance-set leakage', () => {}, /sealed evaluation boundary/u, (manifest) => {
  manifest.sources[0].id = 'project.oov.gold';
});

await rejectsMutation('hash mismatch', () => {}, /Source hash mismatch/u, (manifest) => {
  manifest.sources[0].sha256 = '0'.repeat(64);
}, false);

await rejectsMutation('category count floor', () => {}, /category ad-lib count .* below floor/u, (manifest) => {
  manifest.corpus.categoryMinimums['ad-lib'] = 100;
});

process.stdout.write('rhyme source adversarial controls passed\n');

async function rejectsMutation(label, mutateValues, expected, mutateManifest = () => {}, refreshHashes = true) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'lyricslab-rhyme-sources-'));
  try {
    const values = structuredClone({
      evidence: sourceValues.evidence,
      lexicon: sourceValues.lexicon,
      properNounPolicy: sourceValues['proper-noun-policy'],
      safetyPolicy: sourceValues['safety-policy'],
    });
    mutateValues(values);

    const byRole = {
      evidence: values.evidence,
      lexicon: values.lexicon,
      'proper-noun-policy': values.properNounPolicy,
      'safety-policy': values.safetyPolicy,
    };
    const manifest = structuredClone(sourceManifest);
    for (const source of manifest.sources) {
      const bytes = Buffer.from(`${JSON.stringify(byRole[source.role], null, 2)}\n`);
      await writeFile(path.join(directory, source.path), bytes);
      if (refreshHashes) source.sha256 = createHash('sha256').update(bytes).digest('hex');
    }
    mutateManifest(manifest);
    await writeFile(path.join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    await assert.rejects(
      loadAndValidateRhymeSources(path.join(directory, 'manifest.json')),
      expected,
      label,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function assertNoRuntimeActivation(root) {
  const { readdir } = await import('node:fs/promises');
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await assertNoRuntimeActivation(entryPath);
    } else if (/\.(?:ts|tsx)$/u.test(entry.name)) {
      const source = await readFile(entryPath, 'utf8');
      assert.doesNotMatch(
        source,
        /(?:from|require\()\s*['"][^'"]*rhymeSources/u,
        `Phase 04 source activated by ${entryPath}`,
      );
    }
  }
}
