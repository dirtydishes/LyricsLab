import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');

export function runCompiledRhymeTool(entry, args) {
  const compiler = path.join(root, 'node_modules/typescript/bin/tsc');
  const compile = spawnSync(process.execPath, [compiler, '-p', 'benchmarks/tsconfig.json'], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (compile.status !== 0) return compile;
  for (const relative of ['src/rhyme/normalizeCore.cjs', 'src/rhymeSources/suggestionEligibilityCore.cjs']) {
    const target = path.join(root, '.benchmark-build', relative);
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(path.join(root, relative), target);
  }
  return spawnSync(process.execPath, [path.join(root, '.benchmark-build/benchmarks', entry), ...args], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}
