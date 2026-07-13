#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const DEFAULT_ANCHORS = [
  'time',
  'night',
  'love',
  'flow',
  'song',
  'heart',
  'fire',
  'dream',
  'rhyme',
  'light',
];

const DEFAULT_ARTIFACT_CANDIDATES = [
  'data/cmu-rhyme-artifact.json',
  'data/cmu-rhyme-index-artifact.json',
  'src/rhyme/generated/cmuRhymeArtifact.json',
  'src/rhyme/generated/cmuRhymeArtifact.ts',
  'src/rhyme/generated/cmuRhymeIndexArtifact.json',
  'src/rhyme/generated/cmuRhymeIndexArtifact.ts',
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const artifactPath = resolveArtifactPath(options.artifactPath);
  const runtime = compileRhymeRuntime();

  const loadStart = performance.now();
  const artifact = await loadArtifact(artifactPath);
  const loadMs = performance.now() - loadStart;
  const artifactStats = statSync(artifactPath);
  const artifactBytes = readFileSync(artifactPath);

  const indexStart = performance.now();
  const index = runtime.loadRhymeIndexFromArtifact(artifact);
  const indexMs = performance.now() - indexStart;

  const lookups = options.anchors.map((anchor) => {
    const lookupStart = performance.now();
    const candidates = runtime.findExactRhymeCandidates(index, anchor, {
      maxResults: options.maxResults,
    });
    const durationMs = performance.now() - lookupStart;

    return {
      anchor,
      candidateCount: candidates.length,
      durationMs: roundMs(durationMs),
      sample: candidates.slice(0, options.sampleSize).map((candidate) => ({
        word: candidate.word,
        rhymeTailKey: candidate.rhymeTailKey,
      })),
    };
  });

  const hitLookupCount = lookups.filter(
    (lookup) => lookup.candidateCount > 0,
  ).length;

  if (hitLookupCount < options.minHitLookups) {
    throw new Error(
      `expected at least ${options.minHitLookups} lookup(s) with candidates, found ${hitLookupCount}`,
    );
  }

  const lookupDurations = lookups.map((lookup) => lookup.durationMs);
  const artifactCounts = summarizeArtifactCounts(artifact);

  const report = {
    artifactPath: path.relative(repoRoot, artifactPath),
    artifactSizeBytes: artifactStats.size,
    artifactSha256: createHash('sha256').update(artifactBytes).digest('hex'),
    artifactFormat: artifact.format,
    artifactVersion: artifact.version,
    lexemeCount: artifactCounts.lexemes,
    pronunciationCount: artifactCounts.pronunciations,
    artifactTailCount: artifactCounts.tailKeys,
    noTailPronunciationCount: artifactCounts.noTailPronunciations,
    indexedLexemeCount: index.lexemes.length,
    indexedWordCount: index.lexemesByToken.size,
    indexedTailCount: index.tailIndex.size,
    loadMs: roundMs(loadMs),
    indexMs: roundMs(indexMs),
    lookupCount: lookups.length,
    hitLookupCount,
    lookupTimingMs: {
      total: roundMs(sum(lookupDurations)),
      p50: percentile(lookupDurations, 0.5),
      p95: percentile(lookupDurations, 0.95),
      max: percentile(lookupDurations, 1),
    },
    lookups,
  };

  process.stdout.write(
    `${JSON.stringify(report, null, options.pretty ? 2 : 0)}\n`,
  );
}

function parseArgs(args) {
  const options = {
    anchors: DEFAULT_ANCHORS,
    artifactPath: process.env.CMU_RHYME_ARTIFACT ?? null,
    maxResults: 12,
    minHitLookups: null,
    pretty: true,
    sampleSize: 5,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg) {
      continue;
    }

    if (arg === '--compact') {
      options.pretty = false;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    }

    const [name, inlineValue] = arg.split('=', 2);

    if (name === '--anchors') {
      const value = inlineValue ?? args[++index];
      options.anchors = splitCsv(value, '--anchors');
      continue;
    }

    if (name === '--max-results') {
      const value = inlineValue ?? args[++index];
      options.maxResults = parsePositiveInteger(value, '--max-results');
      continue;
    }

    if (name === '--min-hit-lookups') {
      const value = inlineValue ?? args[++index];
      options.minHitLookups = parseNonNegativeInteger(
        value,
        '--min-hit-lookups',
      );
      continue;
    }

    if (name === '--sample-size') {
      const value = inlineValue ?? args[++index];
      options.sampleSize = parseNonNegativeInteger(value, '--sample-size');
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`unknown option: ${arg}\n\n${usage()}`);
    }

    if (options.artifactPath) {
      throw new Error(`multiple artifact paths provided: ${arg}`);
    }

    options.artifactPath = arg;
  }

  if (options.anchors.length === 0) {
    throw new Error('--anchors must include at least one token');
  }

  options.minHitLookups ??= options.anchors.length;

  return options;
}

function resolveArtifactPath(artifactPath) {
  if (artifactPath) {
    return toExistingFile(artifactPath);
  }

  for (const candidate of DEFAULT_ARTIFACT_CANDIDATES) {
    try {
      return toExistingFile(candidate);
    } catch {
      // Try the next conventional generated artifact path.
    }
  }

  throw new Error(
    `no artifact path provided and no default artifact was found\n\n${usage()}`,
  );
}

function toExistingFile(filePath) {
  const absolutePath = path.resolve(repoRoot, filePath);
  const stats = statSync(absolutePath);

  if (!stats.isFile()) {
    throw new Error(`artifact path is not a file: ${filePath}`);
  }

  return absolutePath;
}

async function loadArtifact(artifactPath) {
  const extension = path.extname(artifactPath);

  if (extension === '.json') {
    return JSON.parse(readFileSync(artifactPath, 'utf8'));
  }

  if (extension === '.ts') {
    return loadArtifactExport(await importTranspiledTypeScript(artifactPath));
  }

  return loadArtifactExport(await import(pathToFileURL(artifactPath).href));
}

function loadArtifactExport(moduleExports) {
  const candidates = [
    moduleExports.default,
    moduleExports.artifact,
    moduleExports.rhymeIndexArtifact,
    moduleExports.cmuRhymeArtifact,
    moduleExports.cmuRhymeIndexArtifact,
    moduleExports.CMU_RHYME_ARTIFACT,
    moduleExports.CMU_RHYME_INDEX_ARTIFACT,
    ...Object.values(moduleExports),
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === 'object' &&
      candidate.format === 'lyricslab.rhyme-index'
    ) {
      return candidate;
    }
  }

  throw new Error(
    'artifact module must export a lyricslab.rhyme-index object',
  );
}

function summarizeArtifactCounts(artifact) {
  if (Array.isArray(artifact.lexemes)) {
    const pronunciationCount = artifact.lexemes.reduce(
      (count, lexeme) => count + lexeme.pronunciations.length,
      0,
    );
    const tailKeys = new Set();
    let noTailPronunciations = 0;

    for (const lexeme of artifact.lexemes) {
      for (const pronunciation of lexeme.pronunciations) {
        if (pronunciation.rhymeTail === null) {
          noTailPronunciations += 1;
          continue;
        }

        tailKeys.add(pronunciation.rhymeTail.join(' '));
      }
    }

    return {
      lexemes: artifact.lexemes.length,
      noTailPronunciations,
      pronunciations: pronunciationCount,
      tailKeys: tailKeys.size,
    };
  }

  if (
    Array.isArray(artifact.words) &&
    Array.isArray(artifact.pronunciations) &&
    Array.isArray(artifact.tails)
  ) {
    return {
      lexemes: artifact.words.length,
      noTailPronunciations:
        artifact.build?.counts?.noTailPronunciations ??
        artifact.pronunciations.filter((pronunciation) => pronunciation[1] === null)
          .length,
      pronunciations: artifact.pronunciations.length,
      tailKeys: artifact.tails.length,
    };
  }

  throw new Error('artifact must contain lexemes or compact words/pronunciations/tails tables');
}

async function importTranspiledTypeScript(sourcePath) {
  const require = createRequire(import.meta.url);
  const ts = require('typescript');
  const source = readFileSync(sourcePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  });
  const tempDir = mkdtempSync(path.join(tmpdir(), 'lyricslab-rhyme-artifact-'));
  const outputPath = path.join(tempDir, `${path.basename(sourcePath, '.ts')}.mjs`);

  writeFileSync(outputPath, output.outputText);

  try {
    return await import(pathToFileURL(outputPath).href);
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
}

function compileRhymeRuntime() {
  const require = createRequire(import.meta.url);
  const tempDir = mkdtempSync(path.join(tmpdir(), 'lyricslab-rhyme-runtime-'));
  const tscPath = require.resolve('typescript/bin/tsc');
  const sourceDir = path.join(repoRoot, 'src/rhyme');
  const sourceFiles = [
    'artifact.ts',
    'rhymeIndex.ts',
    'rhymeTail.ts',
    'normalize.ts',
  ].map((file) => path.join(sourceDir, file));
  const result = spawnSync(
    process.execPath,
    [
      tscPath,
      '--target',
      'ES2020',
      '--module',
      'commonjs',
      '--rootDir',
      sourceDir,
      '--outDir',
      tempDir,
      '--ignoreConfig',
      '--strict',
      '--skipLibCheck',
      ...sourceFiles,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  if (result.status !== 0) {
    rmSync(tempDir, { force: true, recursive: true });
    throw new Error(
      `failed to compile rhyme runtime\n${result.stdout}${result.stderr}`,
    );
  }

  copyFileSync(
    path.join(sourceDir, 'normalizeCore.cjs'),
    path.join(tempDir, 'normalizeCore.cjs'),
  );

  const runtimeRequire = createRequire(path.join(tempDir, 'runtime.cjs'));
  const artifactRuntime = runtimeRequire(path.join(tempDir, 'artifact.js'));
  const indexRuntime = runtimeRequire(path.join(tempDir, 'rhymeIndex.js'));

  return {
    findExactRhymeCandidates: indexRuntime.findExactRhymeCandidates,
    loadRhymeIndexFromArtifact: (artifact) => {
      try {
        return artifactRuntime.loadRhymeIndexFromArtifact(artifact);
      } finally {
        rmSync(tempDir, { force: true, recursive: true });
      }
    },
  };
}

function splitCsv(value, optionName) {
  if (!value) {
    throw new Error(`${optionName} requires a comma-separated value`);
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePositiveInteger(value, optionName) {
  const integer = parseNonNegativeInteger(value, optionName);

  if (integer <= 0) {
    throw new Error(`${optionName} must be greater than 0`);
  }

  return integer;
}

function parseNonNegativeInteger(value, optionName) {
  const integer = Number(value);

  if (!Number.isInteger(integer) || integer < 0) {
    throw new Error(`${optionName} must be a non-negative integer`);
  }

  return integer;
}

function percentile(values, fraction) {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sortedValues.length - 1,
    Math.ceil(sortedValues.length * fraction) - 1,
  );

  return roundMs(sortedValues[index]);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function roundMs(value) {
  return Math.round(value * 1000) / 1000;
}

function usage() {
  return [
    'Usage: node scripts/smoke-cmu-rhyme-artifact.mjs [artifact-path] [options]',
    '',
    'Options:',
    '  --anchors=time,night,love       Representative lookup anchors',
    '  --max-results=12                Max candidates per lookup',
    '  --min-hit-lookups=COUNT         Fail if fewer lookups return candidates; defaults to all anchors',
    '  --sample-size=5                 Candidate samples to include per lookup',
    '  --compact                       Print single-line JSON',
    '',
    'If artifact-path is omitted, CMU_RHYME_ARTIFACT or common generated artifact paths are used.',
  ].join('\n');
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
});
