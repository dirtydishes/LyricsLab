import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadAndValidateRhymeSources } from './rhyme-sources/contract.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(repositoryRoot, 'data/rhyme-sources/manifest.json');

const { summary } = await loadAndValidateRhymeSources(manifestPath);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
