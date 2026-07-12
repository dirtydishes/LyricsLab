export const REQUIRED_IOS_CASES = [
  'local-release-build', 'editor-editing', 'search', 'relaunch', 'non-blocking-load',
  'perfect-pill', 'near-pill', 'multisyllabic-pill', 'prompt-pill', 'prefix', 'caret',
  'selection', 'repeated-insertion', 'repetition-penalty', 'theme-system',
  'theme-light', 'theme-dark', 'theme-persistence',
  'airplane-mode', 'injected-failure-retry', 'voiceover', 'dynamic-type',
  'reduced-motion', 'latency', 'writer-signoff',
];

const ROOT_KEYS = ['airplaneMode', 'attestation', 'benchmark', 'build', 'cases', 'device', 'schemaVersion', 'writerReview'];

export function validateIosEvidence(value, expected = {}) {
  const errors = [];
  exactKeys(value, ROOT_KEYS, 'evidence', errors);
  if (value?.schemaVersion !== 'lyricslab.rhyme-ios-evidence/v1') errors.push('invalid schemaVersion');

  exactKeys(value?.device, ['model', 'name', 'osVersion', 'physical', 'udid'], 'device', errors);
  if (!value?.device?.physical || !udid(value?.device?.udid) || !text(value?.device?.name) || !text(value?.device?.model) || !text(value?.device?.osVersion)) errors.push('missing physical device identity');

  exactKeys(value?.build, ['appVersion', 'artifactSha256', 'buildFingerprintSha256', 'builtAt', 'bundleIdentifier', 'configuration', 'diagnosticsEnabled', 'gitCommit', 'manifestSha256'], 'build', errors);
  if (value?.build?.configuration !== 'Release') errors.push('build is not Release');
  if (value?.build?.diagnosticsEnabled !== true) errors.push('build is missing diagnostics instrumentation');
  for (const field of ['appVersion', 'bundleIdentifier', 'gitCommit']) if (!text(value?.build?.[field])) errors.push(`missing build.${field}`);
  for (const field of ['artifactSha256', 'buildFingerprintSha256', 'manifestSha256']) if (!hash(value?.build?.[field])) errors.push(`invalid build.${field}`);
  if (!timestamp(value?.build?.builtAt)) errors.push('invalid build.builtAt timestamp');

  exactKeys(value?.airplaneMode, ['attestedBy', 'enabled', 'evidenceSha256', 'timestamp'], 'airplaneMode', errors);
  if (value?.airplaneMode?.enabled !== true || !text(value?.airplaneMode?.attestedBy) || !timestamp(value?.airplaneMode?.timestamp) || !hash(value?.airplaneMode?.evidenceSha256)) errors.push('absent airplane-mode evidence');

  exactKeys(value?.benchmark, ['coldLoadMs', 'interval', 'maxMs', 'p50Ms', 'p95Ms', 'pass', 'reportSha256', 'samples', 'warmupsDiscarded'], 'benchmark', errors);
  if (!(value?.benchmark?.p50Ms < 50) || !(value?.benchmark?.p95Ms < 100) || !(value?.benchmark?.maxMs >= value?.benchmark?.p95Ms) || value?.benchmark?.pass !== true || !hash(value?.benchmark?.reportSha256) || value?.benchmark?.samples !== 60 || !(value?.benchmark?.warmupsDiscarded >= 20) || !(value?.benchmark?.coldLoadMs >= 0) || value?.benchmark?.interval !== 'selection-context-received-to-first-react-committed-suggestion-frame') errors.push('benchmark thresholds failed or benchmark metadata is malformed');

  exactKeys(value?.writerReview, ['accepted', 'decisionLogSha256', 'packetSha256', 'signedAt', 'signedBy'], 'writerReview', errors);
  if (value?.writerReview?.accepted !== true || !text(value?.writerReview?.signedBy) || !timestamp(value?.writerReview?.signedAt) || !hash(value?.writerReview?.packetSha256) || !hash(value?.writerReview?.decisionLogSha256)) errors.push('writer review is unsigned or unaccepted');

  const entries = Array.isArray(value?.cases) ? value.cases : [];
  const caseIds = entries.map((entry) => entry?.id).filter(text);
  if (new Set(caseIds).size !== caseIds.length) errors.push('duplicate case id');
  if (entries.length !== REQUIRED_IOS_CASES.length) errors.push(`expected exactly ${REQUIRED_IOS_CASES.length} checklist cases`);
  const cases = new Map(entries.map((entry) => [entry?.id, entry]));
  for (const entry of entries) {
    exactKeys(entry, ['attestedBy', 'evidenceSha256', 'id', 'status', 'timestamp'], `case ${entry?.id ?? 'unknown'}`, errors);
    if (!timestamp(entry?.timestamp)) errors.push(`invalid timestamp for case ${entry?.id ?? 'unknown'}`);
  }
  for (const id of REQUIRED_IOS_CASES) {
    const entry = cases.get(id);
    if (entry?.status !== 'pass' || !text(entry?.attestedBy) || !timestamp(entry?.timestamp) || !Array.isArray(entry?.evidenceSha256) || entry.evidenceSha256.length < 1 || !entry.evidenceSha256.every(hash)) errors.push(`missing passing case ${id}`);
  }

  requireCaseEvidence(cases, 'local-release-build', value?.build?.buildFingerprintSha256, errors);
  requireCaseEvidence(cases, 'airplane-mode', value?.airplaneMode?.evidenceSha256, errors);
  requireCaseEvidence(cases, 'latency', value?.benchmark?.reportSha256, errors);
  requireCaseEvidence(cases, 'writer-signoff', value?.writerReview?.decisionLogSha256, errors);
  const builtAt = Date.parse(value?.build?.builtAt);
  if (Number.isFinite(builtAt) && entries.some((entry) => Date.parse(entry?.timestamp) < builtAt)) errors.push('checklist evidence predates the selected build');

  exactKeys(value?.attestation, ['signedAt', 'signedBy', 'statement'], 'attestation', errors);
  if (!text(value?.attestation?.signedBy) || !timestamp(value?.attestation?.signedAt) || !text(value?.attestation?.statement) || value.attestation.statement.trim().length < 20) errors.push('missing final human attestation');
  const latestCaseAt = Math.max(Date.parse(value?.airplaneMode?.timestamp), ...entries.map((entry) => Date.parse(entry?.timestamp)));
  if (timestamp(value?.attestation?.signedAt) && Date.parse(value.attestation.signedAt) < latestCaseAt) errors.push('final attestation predates checklist evidence');

  compareExpected(value, expected, errors);
  return [...new Set(errors)];
}

export function validateDeviceBenchmarkReport(report, expected) {
  const errors = [];
  const serialized = JSON.stringify(report).toLowerCase();
  for (const forbidden of ['bodytext', 'returnedwords', 'lyrictext', 'suggestionword']) if (serialized.includes(forbidden)) errors.push(`diagnostics report violates privacy boundary: ${forbidden}`);
  if (report?.schemaVersion !== 'lyricslab.rhyme-ios-benchmark/v1' || report?.measurement?.qualifiesAsPhysicalDeviceEvidence !== true || report?.measurement?.interval !== 'selection-context-received-to-first-react-committed-suggestion-frame' || report?.build?.profile !== 'release-diagnostics' || report?.build?.release !== true || report?.build?.diagnosticsEnabled !== true || report?.build?.bundleIdentifier !== 'com.dirtydishes.lyricslab-mobile.diagnostics' || report?.build?.gitCommit !== expected.gitCommit || report?.device?.platform !== 'ios' || report?.artifact?.artifactSha256 !== expected.artifactSha256 || report?.artifact?.manifestSha256 !== expected.manifestSha256 || report?.corpus?.sha256 !== expected.corpusSha256 || report?.samples !== 60 || report?.sampleRecords?.length !== 60 || report?.caseLatency?.length !== expected.corpus.cases.length || report?.warmupsDiscarded < expected.corpus.cases.length || report?.coldLoad?.includedInLatency !== false || !(report?.coldLoad?.durationMs >= 0)) errors.push('diagnostics benchmark report is malformed, stale, or failed');
  const expectedIds = expected.corpus.cases.map(({ id }) => id);
  const durations = [];
  for (const id of expectedIds) {
    const records = Array.isArray(report?.sampleRecords) ? report.sampleRecords.filter((record) => record?.caseId === id) : [];
    if (records.length !== 3 || records.some((record) => Object.keys(record).sort().join(',') !== 'caseId,durationMs' || !Number.isFinite(record.durationMs) || record.durationMs < 0)) { errors.push(`diagnostics benchmark has malformed samples for ${id}`); continue; }
    durations.push(...records.map(({ durationMs }) => durationMs));
    const ordered = records.map(({ durationMs }) => durationMs).sort((a, b) => a - b);
    const summary = report.caseLatency.find((entry) => entry?.caseId === id);
    if (!summary || summary.samples !== 3 || summary.p50Ms !== percentile(ordered, 0.5) || summary.p95Ms !== percentile(ordered, 0.95) || summary.maxMs !== ordered.at(-1)) errors.push(`diagnostics benchmark case summary is malformed for ${id}`);
  }
  if (Array.isArray(report?.sampleRecords) && report.sampleRecords.some(({ caseId }) => !expectedIds.includes(caseId))) errors.push('diagnostics benchmark contains an unknown case ID');
  const ordered = durations.sort((a, b) => a - b);
  if (ordered.length !== 60 || report?.latency?.p50Ms !== percentile(ordered, 0.5) || report?.latency?.p95Ms !== percentile(ordered, 0.95) || report?.latency?.maxMs !== ordered.at(-1) || report?.pass !== (report?.latency?.p50Ms < 50 && report?.latency?.p95Ms < 100) || report?.pass !== true) errors.push('diagnostics benchmark aggregate or threshold result is malformed');
  return [...new Set(errors)];
}

export function createIosEvidenceTemplate(device = '') {
  return {
    schemaVersion: 'lyricslab.rhyme-ios-evidence/v1',
    device: { udid: device, name: '', model: '', osVersion: '', physical: true },
    build: { configuration: 'Release', diagnosticsEnabled: true, appVersion: '', bundleIdentifier: '', gitCommit: '', artifactSha256: '', manifestSha256: '', buildFingerprintSha256: '', builtAt: '' },
    airplaneMode: { enabled: null, attestedBy: '', timestamp: '', evidenceSha256: '' },
    benchmark: { reportSha256: '', interval: '', samples: null, warmupsDiscarded: null, coldLoadMs: null, p50Ms: null, p95Ms: null, maxMs: null, pass: null },
    writerReview: { packetSha256: '', decisionLogSha256: '', accepted: null, signedBy: '', signedAt: '' },
    cases: REQUIRED_IOS_CASES.map((id) => ({ id, status: 'pending', attestedBy: '', timestamp: '', evidenceSha256: [] })),
    attestation: { signedBy: '', signedAt: '', statement: '' },
  };
}

function compareExpected(value, expected, errors) {
  for (const [path, actual] of [
    ['device.udid', value?.device?.udid], ['build.appVersion', value?.build?.appVersion],
    ['build.bundleIdentifier', value?.build?.bundleIdentifier], ['build.gitCommit', value?.build?.gitCommit],
    ['build.artifactSha256', value?.build?.artifactSha256], ['build.manifestSha256', value?.build?.manifestSha256],
    ['build.buildFingerprintSha256', value?.build?.buildFingerprintSha256], ['benchmark.reportSha256', value?.benchmark?.reportSha256],
    ['writerReview.packetSha256', value?.writerReview?.packetSha256],
  ]) {
    if (expected[path] !== undefined && actual !== expected[path]) errors.push(`${path} does not match independently derived evidence`);
  }
  if (expected.minimumBuiltAt !== undefined && Date.parse(value?.build?.builtAt) < expected.minimumBuiltAt) errors.push('build evidence is stale');
}

function requireCaseEvidence(cases, id, expectedHash, errors) {
  if (hash(expectedHash) && !cases.get(id)?.evidenceSha256?.includes(expectedHash)) errors.push(`${id} case is not bound to its canonical evidence hash`);
}

function exactKeys(value, expected, label, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) { errors.push(`${label} is not an object`); return; }
  const actual = Object.keys(value).sort(codeUnitCompare);
  const wanted = [...expected].sort(codeUnitCompare);
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) errors.push(`${label} fields do not match the v1 schema`);
}

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const hash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const udid = (value) => typeof value === 'string' && /^[A-Fa-f0-9-]{8,64}$/u.test(value);
const timestamp = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) && Number.isFinite(Date.parse(value));
const codeUnitCompare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const percentile = (values, fraction) => values[Math.min(values.length - 1, Math.ceil(values.length * fraction) - 1)] ?? 0;
