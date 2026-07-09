#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const defaultSourcePath = path.join(repoRoot, 'data/cmudict.txt');
const defaultOutputPath = path.join(
  repoRoot,
  'src/rhyme/generated/cmuRhymeArtifact.json',
);

const artifactFormat = 'lyricslab.rhyme-index';
const artifactVersion = 1;
const generatorVersion = 1;
const generatorName = 'scripts/build-cmu-artifact.mjs';

const curlyApostrophePattern = /[\u2018\u2019\u201A\u201B\u02BC\uFF07]/gu;
const tokenEdgePattern = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
const cmuVowelPhones = new Set([
  'AA',
  'AE',
  'AH',
  'AO',
  'AW',
  'AY',
  'EH',
  'ER',
  'EY',
  'IH',
  'IY',
  'OW',
  'OY',
  'UH',
  'UW',
]);

class BuildError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BuildError';
  }
}

try {
  await main();
} catch (error) {
  if (error instanceof BuildError) {
    console.error(error.message);
  } else {
    console.error(error?.stack ?? String(error));
  }

  process.exit(1);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const source = await readRequiredFile(
    options.sourcePath,
    `CMU dictionary source is missing: ${relativeRepoPath(options.sourcePath)}`,
  );
  const entries = parseCmuDictionary(source, options.sourcePath);
  const artifact = buildCmuArtifact(entries, source, options.sourcePath);
  const artifactJson = formatArtifactJson(artifact);

  if (options.check) {
    await checkGeneratedArtifact(artifactJson, options.outputPath);
    return;
  }

  await mkdir(path.dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, artifactJson, 'utf8');

  console.log(
    [
      `Wrote ${relativeRepoPath(options.outputPath)}.`,
      `${artifact.build.counts.lexemes} words,`,
      `${artifact.build.counts.pronunciations} pronunciations,`,
      `${artifact.build.counts.tailKeys} rhyme tails.`,
    ].join(' '),
  );
}

function parseArgs(args) {
  const options = {
    check: false,
    outputPath: defaultOutputPath,
    sourcePath: defaultSourcePath,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--check') {
      options.check = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printUsage(console.log);
      process.exit(0);
    }

    if (arg === '--source') {
      options.sourcePath = resolveRepoPath(readArgValue(args, index, arg));
      index += 1;
      continue;
    }

    if (arg === '--out' || arg === '--output') {
      options.outputPath = resolveRepoPath(readArgValue(args, index, arg));
      index += 1;
      continue;
    }

    printUsage(console.error);
    throw new BuildError(`Unknown argument: ${arg}`);
  }

  return options;
}

function readArgValue(args, index, arg) {
  const value = args[index + 1];

  if (!value || value.startsWith('--')) {
    printUsage(console.error);
    throw new BuildError(`Missing value for ${arg}`);
  }

  return value;
}

function printUsage(writeLine) {
  writeLine(
    [
      'Usage: node scripts/build-cmu-artifact.mjs [--check] [--source <path>] [--out <path>]',
      '',
      'Defaults:',
      `  --source ${relativeRepoPath(defaultSourcePath)}`,
      `  --out ${relativeRepoPath(defaultOutputPath)}`,
    ].join('\n'),
  );
}

async function readRequiredFile(filePath, missingMessage) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new BuildError(missingMessage);
    }

    throw error;
  }
}

async function checkGeneratedArtifact(expectedArtifactJson, outputPath) {
  const relativeOutputPath = relativeRepoPath(outputPath);
  let currentArtifactJson;

  try {
    currentArtifactJson = await readFile(outputPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new BuildError(
        `Generated CMU artifact is missing: ${relativeOutputPath}. Run \`node scripts/build-cmu-artifact.mjs\` to create it.`,
      );
    }

    throw error;
  }

  if (currentArtifactJson !== expectedArtifactJson) {
    throw new BuildError(
      `Generated CMU artifact is stale: ${relativeOutputPath}. Run \`node scripts/build-cmu-artifact.mjs\` to refresh it.`,
    );
  }

  console.log(`Generated CMU artifact is fresh: ${relativeOutputPath}.`);
}

function parseCmuDictionary(source, sourcePath) {
  const entries = [];
  const lines = source.split(/\r\n|\n|\r/);

  for (let index = 0; index < lines.length; index += 1) {
    const entry = parseCmuLine(lines[index], {
      lineNumber: index + 1,
      sourcePath,
    });

    if (entry) {
      entries.push(entry);
    }
  }

  if (entries.length === 0) {
    throw new BuildError(
      `CMU dictionary source produced no entries: ${relativeRepoPath(sourcePath)}`,
    );
  }

  return entries;
}

function parseCmuLine(line, context) {
  const entryText = stripInlineComment(line).trim();

  if (!entryText || entryText.startsWith(';;;')) {
    return null;
  }

  const [headword, ...phonemes] = entryText.split(/\s+/);

  if (!headword || phonemes.length === 0) {
    throw new BuildError(
      `Invalid CMU entry at ${relativeRepoPath(context.sourcePath)}:${context.lineNumber}: expected "<headword> <phoneme...>".`,
    );
  }

  const { alternate, displayWord } = parseCmuHeadword(headword);

  return {
    alternate,
    displayWord,
    normalizedWord: normalizeCmuWord(displayWord),
    phonemes,
  };
}

function normalizeCmuWord(word) {
  return normalizeLyricToken(parseCmuHeadword(word.trim()).displayWord);
}

function parseCmuHeadword(headword) {
  const alternateMatch = headword.match(/^(.*)\((\d+)\)$/);

  if (!alternateMatch) {
    return {
      alternate: null,
      displayWord: headword,
    };
  }

  return {
    alternate: Number(alternateMatch[2]),
    displayWord: alternateMatch[1],
  };
}

function stripInlineComment(line) {
  const commentStart = line.indexOf('#');

  return commentStart === -1 ? line : line.slice(0, commentStart);
}

function normalizeLyricToken(token) {
  return token
    .normalize('NFC')
    .toLowerCase()
    .replace(curlyApostrophePattern, "'")
    .trim()
    .replace(tokenEdgePattern, '');
}

function buildCmuArtifact(entries, source, sourcePath) {
  const lexemesByWord = new Map();
  const phoneSet = new Set();
  const tailKeySet = new Set();
  let noTailPronunciations = 0;

  for (const entry of entries) {
    const normalizedWord = normalizeLyricToken(entry.normalizedWord);

    if (!normalizedWord) {
      continue;
    }

    const lexeme = getOrCreateLexeme(lexemesByWord, normalizedWord);
    const rhymeTail = extractRhymeTailFromPhonemes(entry.phonemes);
    const rhymeTailKey = rhymeTail?.key ?? null;

    for (const phoneme of entry.phonemes) {
      phoneSet.add(phoneme);
    }

    if (rhymeTailKey === null) {
      noTailPronunciations += 1;
    } else {
      tailKeySet.add(rhymeTailKey);
    }

    lexeme.pronunciations.push({
      phones: entry.phonemes,
      rhymeTailKey,
    });
  }

  const phoneInventory = [...phoneSet].sort(compareStrings);
  const phoneIds = new Map(
    phoneInventory.map((phone, index) => [phone, index]),
  );
  const tails = [...tailKeySet].sort(compareStrings);
  const tailIds = new Map(tails.map((tailKey, index) => [tailKey, index]));
  const lexemes = [...lexemesByWord.values()].sort((left, right) =>
    compareStrings(left.normalizedWord, right.normalizedWord),
  );
  const words = [];
  const pronunciations = [];

  for (const lexeme of lexemes) {
    const pronunciationStart = pronunciations.length;

    for (const pronunciation of lexeme.pronunciations) {
      pronunciations.push([
        pronunciation.phones.map((phone) =>
          mustGet(phoneIds, phone, `Missing phone id for ${phone}`),
        ),
        pronunciation.rhymeTailKey === null
          ? null
          : mustGet(
              tailIds,
              pronunciation.rhymeTailKey,
              `Missing rhyme-tail id for ${pronunciation.rhymeTailKey}`,
            ),
      ]);
    }

    words.push([
      lexeme.normalizedWord,
      pronunciationStart,
      lexeme.pronunciations.length,
    ]);
  }

  if (words.length === 0) {
    throw new BuildError('CMU dictionary source produced no indexable words.');
  }

  const artifactData = {
    format: artifactFormat,
    version: artifactVersion,
    phoneInventory,
    words,
    pronunciations,
    tails,
  };

  return {
    format: artifactFormat,
    version: artifactVersion,
    build: {
      generator: generatorName,
      generatorVersion,
      source: {
        path: relativeRepoPath(sourcePath),
        sha256: sha256(source),
        bytes: Buffer.byteLength(source, 'utf8'),
        lines: countSourceLines(source),
      },
      artifactDataSha256: sha256(JSON.stringify(artifactData)),
      counts: {
        entries: entries.length,
        lexemes: words.length,
        pronunciations: pronunciations.length,
        tailKeys: tails.length,
        noTailPronunciations,
      },
      sort: [
        'phoneInventory: lexical by ARPAbet token',
        'tails: lexical by rhyme-tail key',
        'words: lexical by normalizedWord',
        'pronunciations: CMU source order within each normalized word',
      ],
    },
    phoneInventory,
    words,
    pronunciations,
    tails,
  };
}

function getOrCreateLexeme(lexemesByWord, normalizedWord) {
  const existing = lexemesByWord.get(normalizedWord);

  if (existing) {
    return existing;
  }

  const lexeme = {
    normalizedWord,
    pronunciations: [],
  };

  lexemesByWord.set(normalizedWord, lexeme);
  return lexeme;
}

function extractRhymeTailFromPhonemes(phonemes) {
  const pronunciation = phonemes.map(parseArpabetPhoneToken);

  for (let index = pronunciation.length - 1; index >= 0; index -= 1) {
    const phone = pronunciation[index];

    if (!phone) {
      continue;
    }

    if (isStressedVowel(phone)) {
      const phones = pronunciation.slice(index);
      const tailPhonemes = phones.map(formatPhoneToken);

      return {
        key: tailPhonemes.join(' '),
        phonemes: tailPhonemes,
        startsAt: index,
      };
    }
  }

  return null;
}

function parseArpabetPhoneToken(phoneme) {
  const stressMatch = phoneme.match(/^(.+)([012])$/);

  if (!stressMatch) {
    return {
      phone: phoneme,
      stress: null,
    };
  }

  return {
    phone: stressMatch[1],
    stress: Number(stressMatch[2]),
  };
}

function formatPhoneToken(phone) {
  if (phone.stress === null) {
    return phone.phone;
  }

  return `${phone.phone}${phone.stress}`;
}

function isStressedVowel(phone) {
  return (
    (phone.stress === 1 || phone.stress === 2) &&
    cmuVowelPhones.has(phone.phone)
  );
}

function formatArtifactJson(artifact) {
  return `{
  "format": ${JSON.stringify(artifact.format)},
  "version": ${artifact.version},
  "build": ${formatIndentedJson(artifact.build, 2)},
  "phoneInventory": [
${formatItems(artifact.phoneInventory, (phone) => `    ${JSON.stringify(phone)}`)}
  ],
  "words": [
${formatItems(artifact.words, formatWord)}
  ],
  "pronunciations": [
${formatItems(artifact.pronunciations, formatPronunciation)}
  ],
  "tails": [
${formatItems(artifact.tails, (tail) => `    ${JSON.stringify(tail)}`)}
  ]
}
`;
}

function formatIndentedJson(value, baseIndent) {
  const padding = ' '.repeat(baseIndent);

  return JSON.stringify(value, null, 2).replace(/\n/g, `\n${padding}`);
}

function formatItems(items, formatItem) {
  return items
    .map((item, index) => {
      const comma = index === items.length - 1 ? '' : ',';
      return `${formatItem(item)}${comma}`;
    })
    .join('\n');
}

function formatWord([normalizedWord, pronunciationStart, pronunciationCount]) {
  return `    [${JSON.stringify(normalizedWord)}, ${pronunciationStart}, ${pronunciationCount}]`;
}

function formatPronunciation([phoneIds, rhymeTailIndex]) {
  return `    [[${phoneIds.join(', ')}], ${formatNullableNumber(rhymeTailIndex)}]`;
}

function formatNullableNumber(value) {
  return value === null ? 'null' : String(value);
}

function countSourceLines(source) {
  if (source.length === 0) {
    return 0;
  }

  const lineBreaks = source.match(/\r\n|\n|\r/g)?.length ?? 0;
  const hasTrailingLineBreak = /(?:\r\n|\n|\r)$/u.test(source);

  return lineBreaks + (hasTrailingLineBreak ? 0 : 1);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function compareStrings(left, right) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function mustGet(map, key, message) {
  if (!map.has(key)) {
    throw new BuildError(message);
  }

  return map.get(key);
}

function resolveRepoPath(rawPath) {
  return path.isAbsolute(rawPath) ? rawPath : path.join(repoRoot, rawPath);
}

function relativeRepoPath(filePath) {
  const relativePath = path.relative(repoRoot, filePath);

  if (
    !relativePath ||
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath)
  ) {
    return filePath;
  }

  return relativePath;
}
