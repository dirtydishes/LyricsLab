export const REQUIRED_IOS_CASES = [
  'local-release-build', 'editor-editing', 'search', 'relaunch', 'non-blocking-load',
  'perfect-pill', 'near-pill', 'multisyllabic-pill', 'prompt-pill', 'prefix', 'caret',
  'selection', 'repeated-insertion', 'repetition-penalty', 'theme-persistence',
  'airplane-mode', 'injected-failure-retry', 'voiceover', 'dynamic-type',
  'reduced-motion', 'latency', 'writer-signoff',
];

export function validateIosEvidence(value) {
  const errors = [];
  if (value?.schemaVersion !== 'lyricslab.rhyme-ios-evidence/v1') errors.push('invalid schemaVersion');
  if (!value?.device?.physical || !text(value?.device?.udid) || !text(value?.device?.name) || !text(value?.device?.model) || !text(value?.device?.osVersion)) errors.push('missing physical device identity');
  if (value?.build?.configuration !== 'Release') errors.push('build is not Release');
  for (const field of ['appVersion', 'bundleIdentifier', 'gitCommit', 'artifactSha256', 'manifestSha256', 'builtAt']) if (!text(value?.build?.[field])) errors.push(`missing build.${field}`);
  if (value?.airplaneMode?.enabled !== true || !text(value?.airplaneMode?.attestedBy) || !text(value?.airplaneMode?.timestamp) || !hash(value?.airplaneMode?.evidenceSha256)) errors.push('absent airplane-mode evidence');
  if (!(value?.benchmark?.p50Ms < 50) || !(value?.benchmark?.p95Ms < 100) || value?.benchmark?.pass !== true || !hash(value?.benchmark?.reportSha256)) errors.push('benchmark thresholds failed');
  if (value?.writerReview?.accepted !== true || !text(value?.writerReview?.signedBy) || !text(value?.writerReview?.signedAt) || !hash(value?.writerReview?.packetSha256) || !hash(value?.writerReview?.decisionLogSha256)) errors.push('writer review is unsigned or unaccepted');
  const cases = new Map(Array.isArray(value?.cases) ? value.cases.map((entry) => [entry?.id, entry]) : []);
  for (const id of REQUIRED_IOS_CASES) {
    const entry = cases.get(id);
    if (entry?.status !== 'pass' || !text(entry?.attestedBy) || !text(entry?.timestamp) || !Array.isArray(entry?.evidenceSha256) || entry.evidenceSha256.length < 1 || !entry.evidenceSha256.every(hash)) errors.push(`missing passing case ${id}`);
  }
  if (!text(value?.attestation?.signedBy) || !text(value?.attestation?.signedAt) || !text(value?.attestation?.statement)) errors.push('missing final human attestation');
  return errors;
}

export function createIosEvidenceTemplate(device = '') {
  return {
    schemaVersion: 'lyricslab.rhyme-ios-evidence/v1',
    device: { udid: '', name: device, model: '', osVersion: '', physical: true },
    build: { configuration: 'Release', appVersion: '', bundleIdentifier: '', gitCommit: '', artifactSha256: '', manifestSha256: '', builtAt: '' },
    airplaneMode: { enabled: null, attestedBy: '', timestamp: '', evidenceSha256: '' },
    benchmark: { reportSha256: '', p50Ms: null, p95Ms: null, pass: null },
    writerReview: { packetSha256: '', decisionLogSha256: '', accepted: null, signedBy: '', signedAt: '' },
    cases: REQUIRED_IOS_CASES.map((id) => ({ id, status: 'pending', attestedBy: '', timestamp: '', evidenceSha256: [] })),
    attestation: { signedBy: '', signedAt: '', statement: '' },
  };
}
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const hash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
