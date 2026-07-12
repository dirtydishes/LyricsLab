import { createHash } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';

import { loadAndValidateRhymeSources } from './rhyme-sources/contract.mjs';
import { isCuratedEntryEligible } from '../src/rhymeSources/suggestionEligibility.ts';

const GOLD_PATH = 'evaluation/rhyme-sources/oov-gold-v1.json';
const GOLD_SCHEMA_PATH = 'evaluation/rhyme-sources/oov-gold-v1.schema.json';
const MANIFEST_PATH = 'evaluation/rhyme-sources/oov-evaluation-manifest-v1.json';
const CORRECTIONS_PATH = 'evaluation/rhyme-sources/oov-gold-corrections-v1.jsonl';
const RESULT_PATH = 'evaluation/rhyme-sources/oov-evaluation-result-v1.json';
const SOURCE_MANIFEST_PATH = 'data/rhyme-sources/manifest.json';
const LEGACY_CMU_PATH = 'data/cmudict.txt';
const ACCEPTANCE_PERCENT = 90;

const goldBytesBefore = await readFile(GOLD_PATH);
const goldHashBefore = sha256(goldBytesBefore);
const seal = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));

if (goldHashBefore !== seal.gold_sha256) {
  throw new Error(`Sealed gold hash mismatch before evaluation: ${goldHashBefore}`);
}

const goldMode = (await stat(GOLD_PATH)).mode & 0o777;
if ((goldMode & 0o222) !== 0) {
  throw new Error(`Sealed gold must be read-only, got mode ${goldMode.toString(8)}`);
}

const [gold, goldSchema, corrections, sources, legacyCmu] = await Promise.all([
  parseJson(goldBytesBefore, 'sealed gold'),
  readFile(GOLD_SCHEMA_PATH, 'utf8').then((value) => parseJson(value, 'gold schema')),
  loadCorrections(CORRECTIONS_PATH),
  loadAndValidateRhymeSources(SOURCE_MANIFEST_PATH),
  readFile(LEGACY_CMU_PATH, 'utf8').then(parseLegacyCmu),
]);

validateGold(gold, goldSchema, corrections);

const entriesByWord = new Map(sources.entries.map((entry) => [entry.normalized, entry]));
const correctionByCase = new Map(corrections.map((correction) => [correction.case_id, correction]));
const positiveCandidates = gold.cases.filter((testCase) => testCase.adjudication.state === 'accepted');
const legacyPresentPositives = positiveCandidates.filter((testCase) => testCase.legacy_cmu.status === 'present-in-legacy-cmu');
const positiveOovBeforeCorrections = positiveCandidates.filter((testCase) => testCase.legacy_cmu.status === 'confirmed-oov');
const validPositiveOov = positiveOovBeforeCorrections.filter((testCase) => !correctionByCase.has(testCase.id));
const ambiguousNegatives = gold.cases.filter((testCase) => testCase.adjudication.state === 'rejected-ambiguous');

const evaluations = validPositiveOov.map((testCase) => evaluatePronunciation(testCase, entriesByWord, legacyCmu));
const matches = evaluations.filter((evaluation) => evaluation.correct);
const misses = evaluations.filter((evaluation) => !evaluation.correct);
const percentage = roundPercent(matches.length, evaluations.length);
const categoryBreakdown = breakdown(evaluations, 'category');
const regionBreakdown = breakdown(evaluations, 'region');
const policy = verifyPolicies(sources.entries);
const goldBytesAfter = await readFile(GOLD_PATH);
const goldHashAfter = sha256(goldBytesAfter);

if (goldHashAfter !== goldHashBefore) {
  throw new Error(`Sealed gold changed during evaluation: ${goldHashBefore} -> ${goldHashAfter}`);
}

const result = {
  schema_version: 1,
  evaluated_at: new Date().toISOString(),
  source_manifest: SOURCE_MANIFEST_PATH,
  seal: {
    expected_sha256: seal.gold_sha256,
    sha256_before: goldHashBefore,
    sha256_after: goldHashAfter,
    unchanged: goldHashBefore === goldHashAfter,
    mode: goldMode.toString(8).padStart(4, '0'),
  },
  corpus: {
    all_cases: gold.cases.length,
    positive_candidates: positiveCandidates.length,
    positive_present_in_legacy_cmu: legacyPresentPositives.length,
    positive_oov_before_corrections: positiveOovBeforeCorrections.length,
    correction_exclusions: corrections.length,
    valid_positive_oov: validPositiveOov.length,
    ambiguous_negative_controls: ambiguousNegatives.length,
  },
  coverage: {
    numerator: matches.length,
    denominator: evaluations.length,
    percentage,
    threshold_percentage: ACCEPTANCE_PERCENT,
    passed: percentage >= ACCEPTANCE_PERCENT,
  },
  by_category: categoryBreakdown,
  by_region: regionBreakdown,
  misses,
  ambiguous_negatives: ambiguousNegatives.map((testCase) => ({
    id: testCase.id,
    normalized: testCase.normalized,
    rationale: testCase.adjudication.rationale,
    curated_entry_present: entriesByWord.has(testCase.normalized),
    scored: false,
  })),
  disputes: corrections.map((correction) => ({
    case_id: correction.case_id,
    action: correction.action,
    rationale: correction.rationale,
    gold_sha256_before: correction.gold_sha256_before,
    gold_sha256_after: correction.gold_sha256_after,
  })),
  policy,
  source_summary: sources.summary,
  acceptance: {
    coverage_passed: percentage >= ACCEPTANCE_PERCENT,
    policy_passed: policy.passed,
    passed: percentage >= ACCEPTANCE_PERCENT && policy.passed,
    blocker: percentage < ACCEPTANCE_PERCENT
      ? `Correct pronunciation coverage ${matches.length}/${evaluations.length} (${percentage}%) is below ${ACCEPTANCE_PERCENT}%.`
      : policy.passed ? null : 'One or more safety/proper-noun policy controls failed.',
  },
};

await writeFile(RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`);

console.log(JSON.stringify({
  gold_sha256_before: goldHashBefore,
  gold_sha256_after: goldHashAfter,
  gold_unchanged: goldHashBefore === goldHashAfter,
  numerator: matches.length,
  denominator: evaluations.length,
  percentage,
  threshold_percentage: ACCEPTANCE_PERCENT,
  coverage_passed: result.coverage.passed,
  policy_passed: policy.passed,
  acceptance_passed: result.acceptance.passed,
  result: RESULT_PATH,
}, null, 2));

if (!result.acceptance.passed) {
  process.exitCode = 1;
}

function evaluatePronunciation(testCase, entriesByWord, legacyCmu) {
  const entry = entriesByWord.get(testCase.normalized);
  if (!entry) {
    return miss(testCase, 'missing-curated-entry', null, null, null);
  }

  const pronunciation = entry.pronunciation;
  const phones = pronunciation.kind === 'direct'
    ? pronunciation.phones.join(' ')
    : pronunciation.verifiedPhones.join(' ');

  if (pronunciation.kind === 'alias') {
    const resolved = legacyCmu.get(pronunciation.target) ?? [];
    if (!resolved.includes(phones)) {
      return miss(testCase, 'alias-does-not-resolve-to-verified-phones', entry.id, pronunciation.kind, phones);
    }
  }

  if (!testCase.accepted_pronunciations.includes(phones)) {
    return miss(testCase, 'pronunciation-mismatch', entry.id, pronunciation.kind, phones);
  }

  return {
    id: testCase.id,
    normalized: testCase.normalized,
    category: testCase.category,
    region: testCase.region,
    correct: true,
    curated_entry_id: entry.id,
    pronunciation_kind: pronunciation.kind,
    resolved_phones: phones,
  };
}

function miss(testCase, reason, entryId, pronunciationKind, resolvedPhones) {
  return {
    id: testCase.id,
    normalized: testCase.normalized,
    category: testCase.category,
    region: testCase.region,
    correct: false,
    reason,
    curated_entry_id: entryId,
    pronunciation_kind: pronunciationKind,
    resolved_phones: resolvedPhones,
    accepted_pronunciations: testCase.accepted_pronunciations,
  };
}

function breakdown(evaluations, key) {
  return Object.fromEntries([...new Set(evaluations.map((evaluation) => evaluation[key]))]
    .sort()
    .map((value) => {
      const selected = evaluations.filter((evaluation) => evaluation[key] === value);
      const correct = selected.filter((evaluation) => evaluation.correct).length;
      return [value, {
        numerator: correct,
        denominator: selected.length,
        percentage: roundPercent(correct, selected.length),
      }];
    }));
}

function verifyPolicies(entries) {
  const ordinaryProfanityWords = ['ass', 'bitch', 'damn', 'fuck', 'shit'];
  const ordinaryProfanity = ordinaryProfanityWords.map((word) => {
    const entry = entries.find((candidate) => candidate.normalized === word);
    const eligible = entry ? isCuratedEntryEligible(entry.normalized, flags(entry), {
      mode: 'suggestion',
      activePrefix: '',
    }) : false;
    return {
      normalized: word,
      curated_entry_id: entry?.id ?? null,
      rap_flag: entry?.flags.includes('rap') ?? false,
      safety_blocked: entry?.flags.includes('safety-blocked') ?? null,
      unsolicited_eligible: eligible,
      passed: Boolean(entry?.flags.includes('rap')) && !entry.flags.includes('safety-blocked') && eligible,
    };
  });

  const highRisk = entries.filter((entry) => entry.flags.includes('safety-blocked')).map((entry) => {
    const anchorEligible = isCuratedEntryEligible(entry.normalized, flags(entry), { mode: 'anchor' });
    const unsolicitedWithPrefix = isCuratedEntryEligible(entry.normalized, flags(entry), {
      mode: 'suggestion',
      activePrefix: entry.normalized,
    });
    const unsolicitedWithoutPrefix = isCuratedEntryEligible(entry.normalized, flags(entry), {
      mode: 'suggestion',
      activePrefix: '',
    });
    return {
      curated_entry_id: entry.id,
      analyzable_as_anchor: anchorEligible,
      unsolicited_with_prefix: unsolicitedWithPrefix,
      unsolicited_without_prefix: unsolicitedWithoutPrefix,
      passed: anchorEligible && !unsolicitedWithPrefix && !unsolicitedWithoutPrefix,
    };
  });

  const properNouns = entries.filter((entry) => entry.flags.includes('proper-noun')).map((entry) => {
    const explicitPrefix = entry.normalized.slice(0, Math.min(3, entry.normalized.length));
    const anchorEligible = isCuratedEntryEligible(entry.normalized, flags(entry), { mode: 'anchor' });
    const noPrefix = isCuratedEntryEligible(entry.normalized, flags(entry), {
      mode: 'suggestion',
      activePrefix: '',
    });
    const matchingPrefix = isCuratedEntryEligible(entry.normalized, flags(entry), {
      mode: 'suggestion',
      activePrefix: `  '${explicitPrefix.toUpperCase()}`,
    });
    const wrongPrefix = isCuratedEntryEligible(entry.normalized, flags(entry), {
      mode: 'suggestion',
      activePrefix: 'zz-unmatched',
    });
    return {
      curated_entry_id: entry.id,
      analyzable_as_anchor: anchorEligible,
      no_prefix: noPrefix,
      matching_explicit_prefix: matchingPrefix,
      wrong_prefix: wrongPrefix,
      passed: anchorEligible && !noPrefix && matchingPrefix && !wrongPrefix,
    };
  });

  const ordinaryPassed = ordinaryProfanity.every((control) => control.passed);
  const highRiskPassed = highRisk.length > 0 && highRisk.every((control) => control.passed);
  const properNounPassed = properNouns.length > 0 && properNouns.every((control) => control.passed);

  return {
    passed: ordinaryPassed && highRiskPassed && properNounPassed,
    ordinary_profanity: {
      passed: ordinaryPassed,
      controls: ordinaryProfanity,
    },
    high_risk: {
      passed: highRiskPassed,
      count: highRisk.length,
      controls: highRisk,
    },
    proper_noun_place_acronym: {
      passed: properNounPassed,
      count: properNouns.length,
      controls: properNouns,
    },
  };
}

function flags(entry) {
  return {
    properNoun: entry.flags.includes('proper-noun'),
    safetyBlocked: entry.flags.includes('safety-blocked'),
  };
}

function validateGold(gold, schema, corrections) {
  if (schema.$id !== 'oov-gold-v1.schema.json' || gold.schema_version !== 1) {
    throw new Error('Unsupported sealed gold schema');
  }
  if (!Array.isArray(gold.cases) || gold.cases.length !== 250) {
    throw new Error(`Sealed gold must contain exactly 250 cases, got ${gold.cases?.length}`);
  }

  const ids = new Set();
  const normalized = new Set();
  for (const [index, testCase] of gold.cases.entries()) {
    const expectedId = `oov-${String(index + 1).padStart(3, '0')}`;
    if (testCase.id !== expectedId || ids.has(testCase.id)) throw new Error(`Invalid gold id at ${index}`);
    if (normalized.has(testCase.normalized)) throw new Error(`Duplicate normalized gold case: ${testCase.normalized}`);
    if (normalize(testCase.surface) !== testCase.normalized) throw new Error(`Noncanonical normalized gold case: ${testCase.id}`);
    if (testCase.adjudication.state === 'accepted' && testCase.accepted_pronunciations.length === 0) throw new Error(`Accepted case has no pronunciation: ${testCase.id}`);
    if (testCase.adjudication.state === 'rejected-ambiguous' && testCase.accepted_pronunciations.length !== 0) throw new Error(`Ambiguous negative has a pronunciation: ${testCase.id}`);
    if (!['confirmed-oov', 'present-in-legacy-cmu'].includes(testCase.legacy_cmu.status)) throw new Error(`Unchecked legacy status: ${testCase.id}`);
    ids.add(testCase.id);
    normalized.add(testCase.normalized);
  }

  for (const correction of corrections) {
    if (!ids.has(correction.case_id)) throw new Error(`Correction references unknown case: ${correction.case_id}`);
    if (correction.gold_sha256_before !== seal.gold_sha256 || correction.gold_sha256_after !== seal.gold_sha256) {
      throw new Error(`Correction changed or references the wrong sealed hash: ${correction.case_id}`);
    }
  }
}

function parseLegacyCmu(contents) {
  const pronunciations = new Map();
  for (const raw of contents.split(/\r?\n/u)) {
    const line = raw.trim();
    if (!line || line.startsWith(';;;')) continue;
    const match = line.match(/^(\S+)\s+(.+)$/u);
    if (!match) continue;
    const word = normalize(match[1].replace(/\(\d+\)$/u, ''));
    const phones = match[2].trim();
    const values = pronunciations.get(word) ?? [];
    if (!values.includes(phones)) values.push(phones);
    pronunciations.set(word, values);
  }
  return pronunciations;
}

async function loadCorrections(path) {
  const contents = await readFile(path, 'utf8');
  return contents.split(/\r?\n/u).filter(Boolean).map((line) => parseJson(line, 'gold correction'));
}

function normalize(token) {
  return token.normalize('NFC').toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u02BC\uFF07]/gu, "'")
    .trim()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function roundPercent(numerator, denominator) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 10000) / 100;
}

function parseJson(value, label) {
  try {
    return JSON.parse(value.toString('utf8'));
  } catch {
    throw new Error(`Invalid JSON in ${label}`);
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}
