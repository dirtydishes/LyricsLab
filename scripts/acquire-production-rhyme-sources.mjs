import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

import {
  verifyProductionProvenance,
  verifySubtlexPackage,
} from './rhyme-data/productionSources.mjs';

const execFile = promisify(execFileCallback);
const projectRoot = path.resolve(import.meta.dirname, '..');
const defaultCacheRoot = path.join(os.homedir(), '.cache/lyricslab-phase04a');
const DEFAULTS = Object.freeze({
  cmuRepo: path.join(defaultCacheRoot, 'cmudict/repo'),
  outputDirectory: path.join(projectRoot, 'data/rhyme-production'),
  provenance: path.join(projectRoot, 'data/rhyme-production/provenance.json'),
  subtlexTarball: path.join(
    defaultCacheRoot,
    'subtlex/subtlex-word-frequencies-2.0.0.tgz',
  ),
});

export async function acquireProductionRhymeSources(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const provenance = parseJson(await readFile(options.provenance), 'production provenance');
  verifyProductionProvenance(provenance);

  const cmuRepo = await realpath(options.cmuRepo);
  await verifyCmuRepository(cmuRepo, provenance.cmudict);
  const cmuFiles = new Map();
  for (const pin of provenance.cmudict.files) {
    const sourcePath = await resolveContainedFile(cmuRepo, pin.path);
    const bytes = await readFile(sourcePath);
    verifyFilePin(bytes, pin, `CMUdict ${pin.path}`);
    cmuFiles.set(pin.path, bytes);
  }

  const subtlexTarball = await readFile(await realpath(options.subtlexTarball));
  const verifiedSubtlex = verifySubtlexPackage(subtlexTarball, provenance.subtlex);
  const outputs = new Map([
    ['cmudict.dict', requiredMapValue(cmuFiles, 'cmudict.dict')],
    ['CMUDICT-LICENSE.txt', requiredMapValue(cmuFiles, 'LICENSE')],
    ['CMUDICT-README.txt', requiredMapValue(cmuFiles, 'README')],
    ['subtlex-word-frequencies-2.0.0.tgz', subtlexTarball],
  ]);

  if (options.check) {
    for (const [name, expected] of outputs) {
      const committed = await readFile(path.join(options.outputDirectory, name));
      if (!committed.equals(expected)) {
        throw new Error(`Committed production source is stale: ${name}`);
      }
    }
  } else {
    await mkdir(options.outputDirectory, { recursive: true });
    for (const [name, bytes] of outputs) {
      await writeFile(path.join(options.outputDirectory, name), bytes);
    }
  }

  return {
    cmudictRevision: provenance.cmudict.revision,
    mode: options.check ? 'checked' : 'materialized',
    subtlexEntries: verifiedSubtlex.frequencies.length,
    subtlexIntegrity: provenance.subtlex.integrity,
  };
}

async function verifyCmuRepository(repo, pin) {
  const git = async (...args) => (await execFile('git', ['-C', repo, ...args], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  })).stdout.trim();
  const root = await realpath(await git('rev-parse', '--show-toplevel'));
  if (root !== repo) throw new Error('CMUdict cache path is not its repository root');
  if (await git('rev-parse', 'HEAD') !== pin.revision) {
    throw new Error('CMUdict cache revision does not match the production pin');
  }
  if (await git('remote', 'get-url', 'origin') !== pin.repository) {
    throw new Error('CMUdict cache origin does not match the production pin');
  }
  if (await git('rev-parse', '--abbrev-ref', 'HEAD') !== pin.branch) {
    throw new Error('CMUdict cache branch does not match the production pin');
  }
  if (await git('status', '--porcelain=v1', '--untracked-files=all')) {
    throw new Error('CMUdict cache repository is not clean');
  }
}

function verifyFilePin(bytes, pin, label) {
  if (
    !pin ||
    typeof pin.path !== 'string' ||
    bytes.length !== pin.bytes ||
    countLines(bytes) !== pin.lines ||
    sha256(bytes) !== pin.sha256
  ) {
    throw new Error(`${label} does not match its production pin`);
  }
}

async function resolveContainedFile(root, relativePath) {
  if (path.isAbsolute(relativePath)) throw new Error('CMUdict pin path must be relative');
  const resolved = await realpath(path.resolve(root, relativePath));
  const relative = path.relative(root, resolved);
  if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`CMUdict pin path escapes its repository: ${relativePath}`);
  }
  return resolved;
}

function parseArguments(argv) {
  const options = { ...DEFAULTS, check: false };
  const fields = new Map([
    ['--cmu-repo', 'cmuRepo'],
    ['--output-dir', 'outputDirectory'],
    ['--provenance', 'provenance'],
    ['--subtlex-tarball', 'subtlexTarball'],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') {
      options.check = true;
      continue;
    }
    const field = fields.get(argument);
    if (!field) throw new Error(`Unknown acquisition argument: ${argument}`);
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
    options[field] = path.resolve(value);
  }
  return options;
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function countLines(bytes) {
  let lines = 0;
  for (const byte of bytes) if (byte === 0x0a) lines += 1;
  return lines;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function requiredMapValue(map, key) {
  const value = map.get(key);
  if (!value) throw new Error(`Missing verified CMUdict file: ${key}`);
  return value;
}

if (path.resolve(process.argv[1] ?? '') === path.resolve(import.meta.filename)) {
  acquireProductionRhymeSources()
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
