import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createIosEvidenceTemplate, validateIosEvidence } from './lib/rhyme-ios-contract.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.length === 0) {
  process.stdout.write('Usage: npm run evidence:rhyme:ios -- --template [--device NAME]\n       npm run evidence:rhyme:ios -- --validate FILE\nTemplates are intentionally incomplete and never count as evidence.\n');
  process.exit(0);
}
if (args[0] === '--template' && (args.length === 1 || (args.length === 3 && args[1] === '--device'))) {
  const index = args.indexOf('--device');
  process.stdout.write(`${JSON.stringify(createIosEvidenceTemplate(index >= 0 ? args[index + 1] ?? '' : ''), null, 2)}\n`);
  process.exit(0);
}
if (args.length !== 2 || args[0] !== '--validate') throw new Error('Expected --validate FILE or --template');
const evidencePath = path.resolve(args[1]);
const file = await lstat(evidencePath);
if (!file.isFile() || file.isSymbolicLink() || file.size > 1024 * 1024) throw new Error('Evidence must be a regular non-symlink JSON file smaller than 1 MiB');
const value = JSON.parse(await readFile(evidencePath, 'utf8'));
const errors = validateIosEvidence(value);
if (errors.length) {
  process.stderr.write(`iOS evidence rejected:\n- ${errors.join('\n- ')}\n`);
  process.exit(1);
}
process.stdout.write('physical iPhone evidence is complete and valid\n');
