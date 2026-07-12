import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { createProductionSuggestionSession } from '../src/editor/productionSuggestions';
import { decodeRhymeData } from '../src/rhymeData/decodeRhymeData';
import { PRODUCTION_RHYME_MANIFEST_SHA256 } from '../src/rhymeData/productionArtifact';
import { isCuratedEntryEligible } from '../src/rhymeSources/suggestionEligibility';

type WriterCase = { id: string; prompt: { anchor: string; prefix: string; selectionEmpty: boolean } };
type Fixture = { assertion: 'top-three-contains-sha256' | 'top-three-role-sha256' | 'all-exclude-sha256'; caseId: string; expectedRole?: 'near' | 'perfect'; expectedSuggestionSha256: string; reason: string; sourcePacketSha256: string };

void main();

async function main() {
const root = process.cwd();
const packet = JSON.parse(readFileSync(path.join(root, 'evaluation/rhyme-writer-review/packet-v1.json'), 'utf8')) as { cases: WriterCase[]; seal: { packetContentSha256: string } };
const regressions = JSON.parse(readFileSync(path.join(root, 'evaluation/rhyme-writer-review/regressions-v1.json'), 'utf8')) as { fixtures: Fixture[]; schemaVersion: string };
assert.equal(regressions.schemaVersion, 'lyricslab.rhyme-writer-regressions/v1');
const artifact = readFileSync(path.join(root, 'assets/rhyme/production.rhymebin'));
const decoded = await decodeRhymeData(artifact, { expectedManifestSha256: PRODUCTION_RHYME_MANIFEST_SHA256, sha256: async (bytes) => createHash('sha256').update(bytes).digest() });
const session = createProductionSuggestionSession({ engine: decoded.engine, isSuggestionEligible(normalizedWord, activePrefix) { const policy = decoded.policy?.get(normalizedWord); return policy ? isCuratedEntryEligible(normalizedWord, policy, { activePrefix, mode: 'suggestion' }) : true; } });
const runtime = { state: 'ready' as const, usingLastKnownGood: false as const, version: decoded.version };

for (const fixture of regressions.fixtures) {
  assert.equal(fixture.sourcePacketSha256, packet.seal.packetContentSha256);
  assert.match(fixture.expectedSuggestionSha256, /^[a-f0-9]{64}$/u);
  const reviewCase = packet.cases.find(({ id }) => id === fixture.caseId);
  assert.ok(reviewCase, `Unknown writer regression case ${fixture.caseId}`);
  const line = `signal ${reviewCase.prompt.anchor} ${reviewCase.prompt.prefix}`;
  const view = session.getView({ currentLineText: line, previousToken: reviewCase.prompt.anchor, selectionEmpty: reviewCase.prompt.selectionEmpty, wordBeforeCursor: reviewCase.prompt.prefix }, line, runtime);
  const candidates = view.suggestions.map((suggestion) => ({ hash: sha256(suggestion.word), role: suggestion.role }));
  if (fixture.assertion === 'top-three-contains-sha256') assert.ok(candidates.slice(0, 3).some(({ hash }) => hash === fixture.expectedSuggestionSha256), `Writer regression ${fixture.caseId} is missing its corrected top-three result`);
  else if (fixture.assertion === 'top-three-role-sha256') assert.ok(candidates.slice(0, 3).some(({ hash, role }) => hash === fixture.expectedSuggestionSha256 && role === fixture.expectedRole), `Writer regression ${fixture.caseId} has the wrong top-three classification`);
  else if (fixture.assertion === 'all-exclude-sha256') assert.ok(candidates.every(({ hash }) => hash !== fixture.expectedSuggestionSha256), `Writer regression ${fixture.caseId} emitted an unsafe result`);
  else assert.fail(`Writer regression ${fixture.caseId} has an unknown assertion`);
}
process.stdout.write(`${regressions.fixtures.length} writer regression fixtures passed\n`);
}

function sha256(value: string) { return createHash('sha256').update(value, 'utf8').digest('hex'); }
