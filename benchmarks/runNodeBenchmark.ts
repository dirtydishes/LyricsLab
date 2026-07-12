import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createProductionSuggestionSession } from '../src/editor/productionSuggestions';
import { decodeRhymeData } from '../src/rhymeData/decodeRhymeData';
import { PRODUCTION_RHYME_MANIFEST_SHA256 } from '../src/rhymeData/productionArtifact';
import { isCuratedEntryEligible } from '../src/rhymeSources/suggestionEligibility';

type CorpusCase = {
  anchor: string;
  category: string;
  id: string;
  line: string;
  prefix: string;
  selectionEmpty: boolean;
};

const root = process.cwd();

void main();

async function main() {
const options = parseOptions(process.argv.slice(2));
const corpusBytes = readFileSync(path.join(root, 'benchmarks/rhyme-benchmark-corpus-v1.json'));
const corpus = JSON.parse(corpusBytes.toString('utf8')) as {
  cases: CorpusCase[]; schemaVersion: string; seed: number; version: string;
};
if (corpus.schemaVersion !== 'lyricslab.rhyme-benchmark-corpus/v1' || corpus.cases.length !== 20) {
  throw new Error('Benchmark corpus schema or case count is invalid');
}
const artifact = readFileSync(path.join(root, 'assets/rhyme/production.rhymebin'));
const loadStartedAt = performance.now();
const decoded = await decodeRhymeData(artifact, {
  expectedManifestSha256: PRODUCTION_RHYME_MANIFEST_SHA256,
  recordsPerChunk: 4096,
  sha256: async (bytes) => createHash('sha256').update(bytes).digest(),
  yieldToHost: async () => new Promise<void>((resolve) => setImmediate(resolve)),
});
const coldLoadMs = performance.now() - loadStartedAt;
const session = createProductionSuggestionSession({
  engine: decoded.engine,
  isSuggestionEligible(normalizedWord, activePrefix) {
    const policy = decoded.policy?.get(normalizedWord);
    return policy ? isCuratedEntryEligible(normalizedWord, policy, {
      activePrefix, mode: 'suggestion',
    }) : true;
  },
});
const runtime = { state: 'ready' as const, usingLastKnownGood: false as const, version: decoded.version };
for (let index = 0; index < options.warmups; index += 1) {
  await measure(corpus.cases[index % corpus.cases.length]!, session, runtime);
}
const samples: { caseId: string; durationMs: number }[] = [];
for (let repeat = 0; repeat < options.samplesPerCase; repeat += 1) {
  for (const benchmarkCase of corpus.cases) {
    samples.push({ caseId: benchmarkCase.id, durationMs: round(await measure(benchmarkCase, session, runtime)) });
  }
}
const durations = samples.map(({ durationMs }) => durationMs).sort((a, b) => a - b);
const latency = {
  interval: 'selection-context-received-to-first-host-commit-frame',
  maxMs: round(durations.at(-1) ?? 0),
  p50Ms: round(percentile(durations, 0.5)),
  p95Ms: round(percentile(durations, 0.95)),
};
const thresholds = { p50MsExclusive: 50, p95MsExclusive: 100 };
const stable = {
  schemaVersion: 'lyricslab.rhyme-benchmark/v1',
  toolVersion: '1.0.0', appVersion: '1.0.0', artifactVersion: decoded.version,
  corpusVersion: corpus.version, corpusSha256: sha256(corpusBytes), seed: corpus.seed,
  cases: corpus.cases.map(({ category, id }) => ({ category, id })), thresholds,
};
const report = {
  schemaVersion: stable.schemaVersion,
  tool: { name: 'benchmark:rhyme', version: stable.toolVersion },
  app: { name: 'LyricsLab', version: stable.appVersion },
  build: { gitCommit: gitCommit(), profile: 'node-quick', sourceSha256: sourceHash() },
  device: { architecture: os.arch(), class: 'host', cpuModel: os.cpus()[0]?.model ?? 'unknown' },
  runtime: { engine: 'production-binary-v2', node: process.version, platform: process.platform },
  artifact: { format: 'binary-v2', version: decoded.version },
  corpus: { schemaVersion: corpus.schemaVersion, version: corpus.version },
  hashes: {
    artifactSha256: sha256(artifact), corpusSha256: stable.corpusSha256,
    manifestSha256: PRODUCTION_RHYME_MANIFEST_SHA256,
    stableReportSha256: sha256(Buffer.from(canonicalJson(stable))),
  },
  seed: corpus.seed,
  cases: stable.cases,
  warmupsDiscarded: options.warmups,
  samples,
  coldLoad: { durationMs: round(coldLoadMs), includedInLatency: false },
  latency,
  thresholds,
  pass: latency.p50Ms < thresholds.p50MsExclusive && latency.p95Ms < thresholds.p95MsExclusive,
  environment: { locale: 'en-US', timer: 'performance.now', frameApproximation: 'setImmediate host commit boundary' },
};
process.stdout.write(`${JSON.stringify(report, null, options.compact ? 0 : 2)}\n`);
if (!report.pass) process.exitCode = 1;
}

async function measure(
  benchmarkCase: CorpusCase,
  targetSession: ReturnType<typeof createProductionSuggestionSession>,
  targetRuntime: { state: 'ready'; usingLastKnownGood: false; version: string },
) {
  const receivedAt = performance.now();
  targetSession.getView({
    currentLineText: benchmarkCase.line,
    previousToken: benchmarkCase.anchor,
    selectionEmpty: benchmarkCase.selectionEmpty,
    wordBeforeCursor: benchmarkCase.prefix,
  }, benchmarkCase.line, targetRuntime);
  await new Promise<void>((resolve) => setImmediate(resolve));
  return performance.now() - receivedAt;
}

function parseOptions(args: string[]) {
  let samplesPerCase = 3;
  let warmups = 5;
  let compact = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--compact') compact = true;
    else if (arg === '--samples') samplesPerCase = Number(args[++index]);
    else if (arg === '--warmups') warmups = Number(args[++index]);
    else throw new Error(`Unknown benchmark option: ${arg}`);
  }
  if (!Number.isInteger(samplesPerCase) || samplesPerCase < 1 || samplesPerCase > 20) {
    throw new Error('samples must be an integer from 1 through 20');
  }
  if (!Number.isInteger(warmups) || warmups < 1 || warmups > 100) {
    throw new Error('warmups must be an integer from 1 through 100');
  }
  return { compact, samplesPerCase, warmups };
}

function percentile(values: number[], value: number) {
  return values[Math.min(values.length - 1, Math.ceil(values.length * value) - 1)] ?? 0;
}
function round(value: number) { return Number(value.toFixed(3)); }
function sha256(value: Uint8Array) { return createHash('sha256').update(value).digest('hex'); }
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`;
  return JSON.stringify(value);
}
function gitCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
}
function sourceHash() {
  const files = [
    'benchmarks/runNodeBenchmark.ts', 'benchmarks/rhyme-benchmark-corpus-v1.json',
    'src/editor/productionSuggestions.ts', 'src/rhymeData/decodeRhymeData.ts',
    'src/rhyme/createRhymeEngine.ts', 'src/rhyme/productionPhonology.ts',
  ];
  const hash = createHash('sha256');
  for (const file of files) hash.update(file).update('\0').update(readFileSync(path.join(root, file)));
  return hash.digest('hex');
}
