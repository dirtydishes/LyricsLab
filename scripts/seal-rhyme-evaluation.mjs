import { checkGoldSeal, setupGoldSeal } from './rhyme-evaluation-seal.mjs';

const options = {
  goldPath: 'evaluation/rhyme-sources/oov-gold-v1.json',
  manifestPath: 'evaluation/rhyme-sources/oov-evaluation-manifest-v1.json',
};
const setup = process.argv.includes('--setup');
const check = process.argv.includes('--check');
if (setup === check) throw new Error('Choose exactly one of --setup or --check');
const result = setup ? await setupGoldSeal(options) : await checkGoldSeal(options);
console.log(`sealed gold ${result.sha256} mode ${result.mode}`);
