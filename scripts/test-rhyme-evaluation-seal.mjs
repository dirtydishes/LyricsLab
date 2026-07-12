import assert from 'node:assert/strict';
import { chmod, copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { checkGoldSeal, setupGoldSeal } from './rhyme-evaluation-seal.mjs';

const root = await mkdtemp(path.join(os.tmpdir(), 'lyricslab-gold-seal-'));
try {
  const goldPath = path.join(root, 'gold.json');
  const manifestPath = path.join(root, 'manifest.json');
  await copyFile('evaluation/rhyme-sources/oov-gold-v1.json', goldPath);
  await copyFile('evaluation/rhyme-sources/oov-evaluation-manifest-v1.json', manifestPath);
  await chmod(goldPath, 0o664);

  await assert.rejects(checkGoldSeal({ goldPath, manifestPath }), /mode 0664/u);
  const setup = await setupGoldSeal({ goldPath, manifestPath });
  assert.equal(setup.sha256, '40aac8d4704a9ca44bf1d2d19f5843714b83c08c59818b81b123baa7e010d4d7');
  assert.equal(setup.mode, '0444');
  await checkGoldSeal({ goldPath, manifestPath });

  await chmod(goldPath, 0o664);
  await writeFile(goldPath, Buffer.concat([await readFile(goldPath), Buffer.from(' ')]));
  await assert.rejects(setupGoldSeal({ goldPath, manifestPath }), /hash mismatch/u);
  console.log('rhyme evaluation seal clean-checkout and tamper controls passed');
} finally {
  await rm(root, { force: true, recursive: true });
}
