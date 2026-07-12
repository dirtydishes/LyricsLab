#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { cpus, hostname, tmpdir } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

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
  'mind',
  'line',
];

const DEFAULT_ARTIFACT_PATH = 'src/rhyme/generated/cmuRhymeArtifact.json';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const artifactPath = path.resolve(repoRoot, options.artifactPath);

  const freshnessCheck = runArtifactFreshnessCheck(artifactPath);
  const runtime = compileRhymeRuntime();

  try {
    const artifactStart = performance.now();
    const artifactText = readFileSync(artifactPath, 'utf8');
    const artifact = JSON.parse(artifactText);
    const artifactLoadMs = performance.now() - artifactStart;

    const indexStart = performance.now();
    const index = runtime.api.loadRhymeIndexFromArtifact(artifact);
    const indexBuildMs = performance.now() - indexStart;

    const warmupSummary = runLookupModes(runtime.api, index, options, {
      iterations: options.warmupIterations,
      recordSamples: false,
    });
    const measuredSummary = runLookupModes(runtime.api, index, options, {
      iterations: options.iterations,
      recordSamples: true,
    });
    const artifactCounts = summarizeArtifactCounts(artifact);

    const report = {
      command: 'perf:rhyme-ranking',
      lookupFunction: 'findRhymeCandidates',
      freshnessCheck,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        host: hostname(),
        cpuModel: cpus()[0]?.model ?? 'unknown',
      },
      artifact: {
        path: path.relative(repoRoot, artifactPath),
        bytes: Buffer.byteLength(artifactText),
        sha256: createHash('sha256').update(artifactText).digest('hex'),
        format: artifact.format,
        version: artifact.version,
        lexemeCount: artifactCounts.lexemes,
        pronunciationCount: artifactCounts.pronunciations,
        tailCount: artifactCounts.tailKeys,
        noTailPronunciationCount: artifactCounts.noTailPronunciations,
      },
      index: {
        lexemeCount: index.lexemes.length,
        wordCount: index.lexemesByToken.size,
        tailCount: index.tailIndex.size,
      },
      setupTimingMs: {
        artifactLoad: roundMs(artifactLoadMs),
        indexBuild: roundMs(indexBuildMs),
        warmupTotal: roundMs(warmupSummary.totalMs),
      },
      options: {
        anchors: options.anchors,
        iterations: options.iterations,
        modes: options.modes,
        warmupIterations: options.warmupIterations,
        maxResults: options.maxResults,
        minSlantSimilarity: options.minSlantSimilarity,
        excludedWords: options.excludedWords,
      },
      measuredLookups: measuredSummary,
    };

    process.stdout.write(
      `${JSON.stringify(report, null, options.pretty ? 2 : 0)}\n`,
    );
  } finally {
    runtime.cleanup();
  }
}

function runArtifactFreshnessCheck(artifactPath) {
  const start = performance.now();
  const args = ['scripts/build-cmu-artifact.mjs', '--check'];
  const relativeArtifactPath = path.relative(repoRoot, artifactPath);

  if (relativeArtifactPath !== DEFAULT_ARTIFACT_PATH) {
    args.push('--out', artifactPath);
  }

  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const durationMs = performance.now() - start;

  if (result.status !== 0) {
    throw new Error(
      [
        'CMU rhyme artifact freshness check failed.',
        `Command: node ${args.join(' ')}`,
        result.stdout.trim(),
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return {
    command: `node ${args.join(' ')}`,
    durationMs: roundMs(durationMs),
    result: result.stdout.trim(),
  };
}

function compileRhymeRuntime() {
  const require = createRequire(import.meta.url);
  const tempDir = mkdtempSync(path.join(tmpdir(), 'lyricslab-rhyme-perf-'));
  const tscPath = require.resolve('typescript/bin/tsc');
  const sourceDir = path.join(repoRoot, 'src/rhyme');
  const sourceFiles = [
    'artifact.ts',
    'cmuParser.ts',
    'index.ts',
    'normalize.ts',
    'rhymeIndex.ts',
    'rhymeRanking.ts',
    'rhymeTail.ts',
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

  const runtimeRequire = createRequire(path.join(tempDir, 'runtime.cjs'));
  const api = runtimeRequire(path.join(tempDir, 'index.js'));

  return {
    api: {
      findRhymeCandidates: api.findRhymeCandidates,
      loadRhymeIndexFromArtifact: api.loadRhymeIndexFromArtifact,
    },
    cleanup() {
      rmSync(tempDir, { force: true, recursive: true });
    },
  };
}

function runLookupModes(api, index, options, batchOptions) {
  const modes = {};
  let totalMs = 0;

  for (const mode of options.modes) {
    const summary = runLookupBatch(api, index, options, {
      ...batchOptions,
      mode,
    });

    modes[mode] = summary;
    totalMs += summary.totalMs;
  }

  return {
    modes,
    totalMs: roundMs(totalMs),
  };
}

function runLookupBatch(api, index, options, batchOptions) {
  const durations = [];
  const anchorStats = new Map(
    options.anchors.map((anchor) => [
      anchor,
      {
        durations: [],
        sample: [],
      },
    ]),
  );
  const batchStart = performance.now();
  let lookupCount = 0;
  let hitLookupCount = 0;

  for (let iteration = 0; iteration < batchOptions.iterations; iteration += 1) {
    for (const anchor of options.anchors) {
      const lookupStart = performance.now();
      const candidates = api.findRhymeCandidates(index, {
        anchor,
        candidateKinds:
          batchOptions.mode === 'slant' ? ['slant'] : ['exact', 'slant'],
        excludedWords: options.excludedWords,
        maxResults: options.maxResults,
        minSlantSimilarity: options.minSlantSimilarity,
      });
      const durationMs = performance.now() - lookupStart;
      const stats = anchorStats.get(anchor);

      lookupCount += 1;
      durations.push(durationMs);
      stats.durations.push(durationMs);

      if (candidates.length > 0) {
        hitLookupCount += 1;
      }

      if (batchOptions.recordSamples && iteration === 0) {
        stats.sample = candidates
          .slice(0, options.sampleSize)
          .map((candidate) => ({
            kind: candidate.kind,
            score: candidate.score,
            slantSimilarity: candidate.slantSimilarity,
            word: candidate.word,
            rhymeTailKey: candidate.rhymeTailKey,
          }));
        stats.candidateCount = candidates.length;
      }
    }
  }

  const totalMs = performance.now() - batchStart;

  if (batchOptions.recordSamples && hitLookupCount === 0) {
    throw new Error(
      `representative ${batchOptions.mode} rhyme performance lookups returned no candidates`,
    );
  }

  return {
    mode: batchOptions.mode,
    lookupCount,
    hitLookupCount,
    totalMs: roundMs(totalMs),
    timingMs: summarizeDurations(durations),
    anchors: [...anchorStats.entries()].map(([anchor, stats]) => ({
      anchor,
      candidateCount: stats.candidateCount ?? null,
      timingMs: summarizeDurations(stats.durations),
      sample: stats.sample,
    })),
  };
}

function summarizeArtifactCounts(artifact) {
  if (Array.isArray(artifact.lexemes)) {
    const tailKeys = new Set();
    let noTailPronunciations = 0;
    let pronunciationCount = 0;

    for (const lexeme of artifact.lexemes) {
      for (const pronunciation of lexeme.pronunciations) {
        pronunciationCount += 1;

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
        artifact.pronunciations.filter(
          (pronunciation) => pronunciation[1] === null,
        ).length,
      pronunciations: artifact.pronunciations.length,
      tailKeys: artifact.tails.length,
    };
  }

  throw new Error(
    'artifact must contain lexemes or compact words/pronunciations/tails tables',
  );
}

function parseArgs(args) {
  const options = {
    anchors: DEFAULT_ANCHORS,
    artifactPath: process.env.CMU_RHYME_ARTIFACT ?? DEFAULT_ARTIFACT_PATH,
    excludedWords: [],
    iterations: 50,
    maxResults: 12,
    minSlantSimilarity: 0.35,
    modes: ['mixed', 'slant'],
    pretty: true,
    sampleSize: 5,
    warmupIterations: 5,
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

    if (name === '--artifact') {
      options.artifactPath = inlineValue ?? args[++index];
      continue;
    }

    if (name === '--excluded-words') {
      const value = inlineValue ?? args[++index];
      options.excludedWords = splitCsv(value, '--excluded-words');
      continue;
    }

    if (name === '--iterations') {
      const value = inlineValue ?? args[++index];
      options.iterations = parsePositiveInteger(value, '--iterations');
      continue;
    }

    if (name === '--max-results') {
      const value = inlineValue ?? args[++index];
      options.maxResults = parsePositiveInteger(value, '--max-results');
      continue;
    }

    if (name === '--min-slant-similarity') {
      const value = inlineValue ?? args[++index];
      options.minSlantSimilarity = parseNumber(
        value,
        '--min-slant-similarity',
      );
      continue;
    }

    if (name === '--modes') {
      const value = inlineValue ?? args[++index];
      options.modes = splitCsv(value, '--modes').map(parseMode);
      continue;
    }

    if (name === '--sample-size') {
      const value = inlineValue ?? args[++index];
      options.sampleSize = parseNonNegativeInteger(value, '--sample-size');
      continue;
    }

    if (name === '--warmup-iterations') {
      const value = inlineValue ?? args[++index];
      options.warmupIterations = parseNonNegativeInteger(
        value,
        '--warmup-iterations',
      );
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`unknown option: ${arg}\n\n${usage()}`);
    }

    options.artifactPath = arg;
  }

  if (options.anchors.length === 0) {
    throw new Error('--anchors must include at least one token');
  }

  if (!options.artifactPath) {
    throw new Error('--artifact requires a path');
  }

  if (options.modes.length === 0) {
    throw new Error('--modes must include at least one mode');
  }

  return options;
}

function parseMode(mode) {
  if (mode === 'mixed' || mode === 'slant') {
    return mode;
  }

  throw new Error(`unsupported mode: ${mode}`);
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

function parseNumber(value, optionName) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(`${optionName} must be a finite number`);
  }

  return number;
}

function summarizeDurations(values) {
  return {
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    max: percentile(values, 1),
  };
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

function roundMs(value) {
  return Math.round(value * 1000) / 1000;
}

function usage() {
  return [
    'Usage: node scripts/perf-rhyme-ranking.mjs [artifact-path] [options]',
    '',
    'Options:',
    '  --artifact <path>                  Generated CMU rhyme artifact path',
    '  --anchors=time,night,love          Representative lookup anchors',
    '  --excluded-words=time,night        Words excluded from every lookup',
    '  --iterations=50                    Measured iterations per anchor',
    '  --warmup-iterations=5              Warmup iterations per anchor',
    '  --max-results=12                   Max candidates per lookup',
    '  --min-slant-similarity=0.35        Minimum slant similarity for mixed lookups',
    '  --modes=mixed,slant                Lookup modes to measure',
    '  --sample-size=5                    Candidate samples to include per anchor',
    '  --compact                          Print single-line JSON',
    '',
    'The harness runs scripts/build-cmu-artifact.mjs --check before measuring lookups.',
  ].join('\n');
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exit(1);
});
