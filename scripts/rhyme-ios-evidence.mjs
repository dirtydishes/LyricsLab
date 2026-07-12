import { readFile } from 'node:fs/promises';
import { createIosEvidenceTemplate, validateIosEvidence } from './lib/rhyme-ios-contract.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.length === 0) {
  process.stdout.write('Usage: npm run evidence:rhyme:ios -- --template [--device NAME]\n       npm run evidence:rhyme:ios -- --validate FILE\nTemplates are intentionally incomplete and never count as evidence.\n');
  process.exit(0);
}
if (args.includes('--template')) {
  const index = args.indexOf('--device');
  process.stdout.write(`${JSON.stringify(createIosEvidenceTemplate(index >= 0 ? args[index + 1] ?? '' : ''), null, 2)}\n`);
  process.exit(0);
}
const validateIndex = args.indexOf('--validate');
if (validateIndex < 0 || !args[validateIndex + 1]) throw new Error('Expected --validate FILE or --template');
const value = JSON.parse(await readFile(args[validateIndex + 1], 'utf8'));
const errors = validateIosEvidence(value);
if (errors.length) {
  process.stderr.write(`iOS evidence rejected:\n- ${errors.join('\n- ')}\n`);
  process.exit(1);
}
process.stdout.write('physical iPhone evidence is complete and valid\n');
