import { execFile } from 'node:child_process';
import { copyFile, mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { loadAndValidateRhymeSources } from './rhyme-sources/contract.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const execFileAsync = promisify(execFile);
const manifestPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(repositoryRoot, 'data/rhyme-sources/manifest.json');

if (!process.argv[2]) {
  await assertAuthoredSourcesAreFresh();
}
const { summary } = await loadAndValidateRhymeSources(manifestPath);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

async function assertAuthoredSourcesAreFresh() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'lyricslab-rhyme-source-check-'));
  try {
    await mkdir(path.join(temporaryRoot, 'data'), { recursive: true });
    await copyFile(
      path.join(repositoryRoot, 'data/cmudict.txt'),
      path.join(temporaryRoot, 'data/cmudict.txt'),
    );
    await execFileAsync(
      process.execPath,
      [path.join(repositoryRoot, 'scripts/rhyme-sources/author-phase04.mjs')],
      { cwd: temporaryRoot },
    );

    for (const filename of [
      'evidence.json',
      'lexicon.json',
      'manifest.json',
      'proper-noun-policy.json',
      'safety-policy.json',
    ]) {
      const [committed, generated] = await Promise.all([
        readFile(path.join(repositoryRoot, 'data/rhyme-sources', filename)),
        readFile(path.join(temporaryRoot, 'data/rhyme-sources', filename)),
      ]);
      if (!committed.equals(generated)) {
        throw new Error(`Authored rhyme source is stale: ${filename}`);
      }
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}
