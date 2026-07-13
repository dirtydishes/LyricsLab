import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { compileRhymeData } from './rhyme-data/compile.mjs';
import { loadRhymeDataManifest } from './rhyme-data/manifest.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const defaults = {
  manifest: path.join(projectRoot, 'data/rhyme-fixture/manifest.json'),
  output: path.join(projectRoot, 'assets/rhyme/fixture.rhymebin'),
};

export async function buildRhymeData(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const loaded = await loadRhymeDataManifest(options.manifest);
  const bytes = compileRhymeData(loaded);

  if (options.check) {
    const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'lyricslab-rhyme-'));
    try {
      const temporaryOutput = path.join(temporaryDirectory, 'artifact.rhymebin');
      await writeFile(temporaryOutput, bytes);
      const committed = await readFile(options.output);
      const regenerated = await readFile(temporaryOutput);

      if (!committed.equals(regenerated)) {
        throw new Error(
          `Rhyme data artifact is stale: run npm run build:rhyme-data -- --manifest ${options.manifest} --output ${options.output}`,
        );
      }
    } finally {
      await rm(temporaryDirectory, { force: true, recursive: true });
    }
  } else {
    await mkdir(path.dirname(options.output), { recursive: true });
    await writeFile(options.output, bytes);
  }

  return {
    bytes: bytes.length,
    hash: createHash('sha256').update(bytes).digest('hex'),
    manifest: options.manifest,
    output: options.output,
  };
}

function parseArguments(argv) {
  const options = { ...defaults, check: false };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') {
      options.check = true;
    } else if (argument === '--manifest') {
      options.manifest = requireValue(argv, ++index, argument);
    } else if (argument === '--output' || argument === '--out') {
      options.output = requireValue(argv, ++index, argument);
    } else {
      throw new Error(`Unknown build:rhyme-data argument: ${argument}`);
    }
  }

  options.manifest = path.resolve(options.manifest);
  options.output = path.resolve(options.output);
  return options;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(import.meta.filename)) {
  buildRhymeData()
    .then((result) => {
      process.stdout.write(
        `rhyme data ${result.bytes} bytes sha256 ${result.hash} -> ${result.output}\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
