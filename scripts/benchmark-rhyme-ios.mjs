import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

import { validateDeviceBenchmarkReport, validateIosEvidence } from './lib/rhyme-ios-contract.mjs';

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  process.stdout.write('Usage: npm run benchmark:rhyme:ios -- --device UDID --app RELEASE.app --report REPORT.json --evidence EVIDENCE.json --artifacts EVIDENCE_DIR\nRequires macOS, Xcode, an exact connected physical iPhone UDID, a signed diagnostics Release app, and complete independently bound evidence files.\n');
  process.exit(0);
}
if (!/^[A-Fa-f0-9-]{8,64}$/u.test(args.device ?? '')) throw new Error('Selected device must be a valid physical-device UDID');
if (process.platform !== 'darwin') throw new Error('Physical iPhone benchmark requires macOS with Xcode/xcrun; this host is not eligible');
try { execFileSync('xcrun', ['--find', 'devicectl'], { stdio: 'pipe' }); } catch { throw new Error('Missing xcrun/Xcode devicectl'); }

const listing = execFileSync('xcrun', ['xctrace', 'list', 'devices'], { encoding: 'utf8' });
const deviceLine = listing.split('\n').find((entry) => entry.includes(`(${args.device})`));
if (!deviceLine || /Simulator/u.test(deviceLine) || !/iPhone/iu.test(deviceLine)) throw new Error(`Selected UDID is absent or is not a physical iPhone: ${args.device}`);

const appPath = await safeExistingPath(args.app, 'Release app');
if (!appPath.endsWith('.app') || !(await stat(appPath)).isDirectory()) throw new Error('Missing signed Release --app PATH.app');
execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'pipe' });
const infoPath = path.join(appPath, 'Info.plist');
const infoBytes = await readFile(infoPath);
const info = JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', infoPath], { encoding: 'utf8' }));
if (info.CFBundleIdentifier !== 'com.dirtydishes.lyricslab-mobile.diagnostics') throw new Error('Release app is not the diagnostics-only bundle');
const embeddedArtifacts = await findNamedFiles(appPath, 'production.rhymebin');
if (embeddedArtifacts.length !== 1) throw new Error('Release app must contain exactly one production.rhymebin');
const embeddedArtifactBytes = await readFile(embeddedArtifacts[0]);
const artifactSha256 = sha256(embeddedArtifactBytes);
const instrumentedBundles = await findContainingFiles(appPath, Buffer.from('lyricslab.rhyme-ios-benchmark/v1'));
if (instrumentedBundles.length !== 1) throw new Error('Release app is missing unambiguous diagnostics benchmark instrumentation');
const instrumentedBundleBytes = await readFile(instrumentedBundles[0]);
const appStat = await stat(appPath);
const buildFingerprintSha256 = sha256(Buffer.concat([infoBytes, Buffer.from('\0'), embeddedArtifactBytes, Buffer.from('\0'), instrumentedBundleBytes]));

const reportPath = await safeExistingPath(args.report, 'diagnostics benchmark report');
await assertSmallJsonFile(reportPath, 'diagnostics benchmark report');
const reportBytes = await readFile(reportPath);
const report = JSON.parse(reportBytes.toString('utf8'));
const gitCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const corpusBytes = await readFile('benchmarks/rhyme-benchmark-corpus-v1.json');
const corpus = JSON.parse(corpusBytes.toString('utf8'));
const manifestSha256 = sourceConstant('PRODUCTION_RHYME_MANIFEST_SHA256');
const reportErrors = validateDeviceBenchmarkReport(report, { artifactSha256, corpus, corpusSha256: sha256(corpusBytes), gitCommit, manifestSha256 });
if (reportErrors.length) throw new Error(`Diagnostics benchmark report rejected:\n- ${reportErrors.join('\n- ')}`);
const evidencePath = await safeExistingPath(args.evidence, 'physical evidence');
await assertSmallJsonFile(evidencePath, 'physical evidence');
const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
const evidenceDirectory = await safeExistingPath(args.artifacts, 'evidence artifact directory');
if (!(await stat(evidenceDirectory)).isDirectory()) throw new Error('Evidence artifacts path is not a directory');
const evidenceArtifactHashes = await hashEvidenceArtifacts(evidenceDirectory);
const packet = JSON.parse(await readFile('evaluation/rhyme-writer-review/packet-v1.json', 'utf8'));
const decisionsPath = 'evaluation/rhyme-writer-review/decisions-v1.jsonl';
execFileSync(process.execPath, ['scripts/writer-review-rhyme.mjs', '--validate-decisions', decisionsPath], { stdio: 'pipe' });
const decisionLogSha256 = sha256(await readFile(decisionsPath));
const expected = {
  'device.udid': args.device,
  'build.appVersion': String(info.CFBundleShortVersionString),
  'build.bundleIdentifier': info.CFBundleIdentifier,
  'build.gitCommit': gitCommit,
  'build.artifactSha256': artifactSha256,
  'build.manifestSha256': manifestSha256,
  'build.buildFingerprintSha256': buildFingerprintSha256,
  'benchmark.reportSha256': sha256(reportBytes),
  'writerReview.packetSha256': packet.seal.packetContentSha256,
  minimumBuiltAt: appStat.mtimeMs - 5 * 60 * 1000,
};
const errors = validateIosEvidence(evidence, expected);
if (evidence.writerReview?.decisionLogSha256 !== decisionLogSha256) errors.push('writerReview.decisionLogSha256 does not match the validated decision log');
const knownEvidenceHashes = new Set([...evidenceArtifactHashes, sha256(reportBytes), decisionLogSha256]);
for (const referencedHash of [evidence.airplaneMode?.evidenceSha256, ...((evidence.cases ?? []).flatMap((entry) => entry?.evidenceSha256 ?? []))]) if (!knownEvidenceHashes.has(referencedHash)) errors.push(`referenced evidence artifact is missing: ${referencedHash ?? '<missing>'}`);
for (const [field, actual] of [['p50Ms', report.latency.p50Ms], ['p95Ms', report.latency.p95Ms], ['maxMs', report.latency.maxMs], ['samples', report.samples], ['warmupsDiscarded', report.warmupsDiscarded], ['coldLoadMs', report.coldLoad.durationMs], ['interval', report.measurement.interval], ['pass', report.pass]]) {
  if (evidence.benchmark?.[field] !== actual) errors.push(`benchmark.${field} does not match the diagnostics report`);
}
if (errors.length) throw new Error(`Physical iPhone evidence rejected:\n- ${[...new Set(errors)].join('\n- ')}`);
process.stdout.write(`physical iPhone benchmark evidence accepted for ${args.device}\n`);

function parseArgs(raw) {
  if (raw.length === 1 && raw[0] === '--help') return { help: true };
  const result = { help: false };
  for (let index = 0; index < raw.length; index += 2) {
    const flag = raw[index]; const value = raw[index + 1];
    if (!['--device', '--app', '--report', '--evidence', '--artifacts'].includes(flag) || !value || value.startsWith('--')) throw new Error(`Unknown, duplicate, or incomplete iOS benchmark option: ${flag ?? '<missing>'}`);
    const key = flag.slice(2);
    if (result[key] !== undefined) throw new Error(`Unknown, duplicate, or incomplete iOS benchmark option: ${flag}`);
    result[key] = value;
  }
  for (const key of ['device', 'app', 'report', 'evidence', 'artifacts']) if (!result[key]) throw new Error(`Missing required --${key} ${key.toUpperCase()}`);
  return result;
}

async function safeExistingPath(input, label) {
  const absolute = path.resolve(input);
  if ((await lstat(absolute)).isSymbolicLink()) throw new Error(`${label} must not be a symbolic link`);
  return realpath(absolute);
}

async function findNamedFiles(directory, name) {
  const matches = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) matches.push(...await findNamedFiles(target, name));
    else if (entry.isFile() && entry.name === name) matches.push(target);
  }
  return matches;
}

async function assertSmallJsonFile(target, label) {
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size > 1024 * 1024) throw new Error(`${label} must be a regular JSON file smaller than 1 MiB`);
}

async function findContainingFiles(directory, needle) {
  const matches = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) matches.push(...await findContainingFiles(target, needle));
    else if (entry.isFile()) {
      const metadata = await stat(target);
      if (metadata.size <= 32 * 1024 * 1024 && (await readFile(target)).includes(needle)) matches.push(target);
    }
  }
  return matches;
}

async function hashEvidenceArtifacts(directory) {
  const hashes = new Set();
  let files = 0;
  let totalBytes = 0;
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Evidence artifact directory contains a symbolic link');
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile()) {
        const metadata = await stat(target);
        files += 1; totalBytes += metadata.size;
        if (files > 128 || metadata.size > 50 * 1024 * 1024 || totalBytes > 500 * 1024 * 1024) throw new Error('Evidence artifact directory exceeds safe bounds');
        hashes.add(sha256(await readFile(target)));
      }
    }
  }
  await visit(directory);
  return hashes;
}

function sourceConstant(name) {
  const source = execFileSync('git', ['show', `HEAD:src/rhymeData/productionArtifact.ts`], { encoding: 'utf8' });
  const match = source.match(new RegExp(`${name}\\s*=\\s*\\n?\\s*'([a-f0-9]{64})'`, 'u'));
  if (!match) throw new Error(`Cannot derive ${name} from reviewed HEAD`);
  return match[1];
}

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
