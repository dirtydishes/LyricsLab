import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const compiler = path.join(root, 'node_modules/typescript/bin/tsc');
const compiled = path.join(root, '.benchmark-build/benchmarks/runNodeBenchmark.js');
const compile = spawnSync(process.execPath, [compiler, '-p', 'benchmarks/tsconfig.json'], {
  cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
});
if (compile.status !== 0) {
  process.stderr.write(compile.stderr || compile.stdout);
  process.exit(compile.status ?? 1);
}
for (const relative of [
  'src/rhyme/normalizeCore.cjs',
  'src/rhymeSources/suggestionEligibilityCore.cjs',
]) {
  const target = path.join(root, '.benchmark-build', relative);
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(path.join(root, relative), target);
}
const run = spawnSync(process.execPath, [compiled, ...process.argv.slice(2)], {
  cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
});
process.stdout.write(run.stdout);
process.stderr.write(run.stderr);
process.exit(run.status ?? 1);
