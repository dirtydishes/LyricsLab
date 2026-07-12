import { runCompiledRhymeTool } from './lib/run-compiled-rhyme-tool.mjs';

const result = runCompiledRhymeTool('runWriterRegressions.js', []);
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr || (result.status === 0 ? '' : result.stdout ?? ''));
process.exit(result.status ?? 1);
