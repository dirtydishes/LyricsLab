import { createHash } from 'node:crypto';

import {
  DIRECTORY_ENTRY_BYTES,
  FORMAT_VERSION,
  HEADER_BYTES,
  MAGIC,
  SECTION,
  SECTION_WIDTH,
  WORD_FLAG,
  align4,
  compareCodeUnits,
} from './format.mjs';
import { createRhymeKeys, normalizeRhymeWord } from './phonology.mjs';

const MAX_ARTIFACT_BYTES = 64 * 1024 * 1024;
const MAX_UINT32 = 0xffff_ffff;

export function compileRhymeData({ manifest, manifestHash, lexemes, sources }) {
  if (!/^[a-f0-9]{64}$/u.test(manifestHash)) {
    throw new Error('Manifest hash must be a lowercase SHA-256 value');
  }
  const model = buildModel(manifest, lexemes, sources);
  const sections = buildSections(model);
  const directoryBytes = sections.length * DIRECTORY_ENTRY_BYTES;
  let cursor = align4(HEADER_BYTES + directoryBytes);

  for (const section of sections) {
    section.offset = cursor;
    cursor = align4(cursor + section.bytes.length);
  }

  if (cursor > MAX_ARTIFACT_BYTES || cursor > MAX_UINT32) {
    throw new Error('Compiled rhyme data exceeds the bounded artifact size');
  }

  const output = Buffer.alloc(cursor);
  MAGIC.copy(output, 0);
  output.writeUInt16LE(FORMAT_VERSION, 8);
  output.writeUInt16LE(HEADER_BYTES, 10);
  output.writeUInt32LE(output.length, 12);
  output.writeUInt32LE(HEADER_BYTES, 16);
  output.writeUInt16LE(sections.length, 20);
  Buffer.from(manifestHash, 'hex').copy(output, 24);

  sections.forEach((section, index) => {
    const descriptor = HEADER_BYTES + index * DIRECTORY_ENTRY_BYTES;
    output.writeUInt16LE(section.id, descriptor);
    output.writeUInt16LE(section.width, descriptor + 2);
    output.writeUInt32LE(section.offset, descriptor + 4);
    output.writeUInt32LE(section.bytes.length, descriptor + 8);
    output.writeUInt32LE(section.count, descriptor + 12);
    section.bytes.copy(output, section.offset);
  });

  createHash('sha256')
    .update(output.subarray(HEADER_BYTES))
    .digest()
    .copy(output, 56);

  return output;
}

function buildModel(manifest, inputLexemes, inputSources) {
  const lexemes = inputLexemes
    .map((lexeme) => ({
      ...lexeme,
      lemma: normalizeRhymeWord(lexeme.lemma),
      normalizedWord: normalizeRhymeWord(lexeme.normalizedWord ?? lexeme.word),
      pronunciations: [...lexeme.pronunciations]
        .map((phones) => [...phones])
        .sort(comparePhoneSequences),
    }))
    .sort((left, right) => compareCodeUnits(left.normalizedWord, right.normalizedWord));
  const sources = [...inputSources].sort((left, right) =>
    compareCodeUnits(left.id, right.id),
  );
  const strings = new Set([
    manifest.artifact.id,
    manifest.artifact.version,
    manifest.provenance.owner,
    manifest.provenance.purpose,
  ]);
  const phones = new Set();

  for (const source of sources) {
    for (const value of [
      source.id,
      source.kind,
      source.version,
      source.path,
      source.sha256,
      source.license,
      source.ownership,
    ]) {
      strings.add(value);
    }
  }

  const pronunciations = [];
  for (const [wordId, lexeme] of lexemes.entries()) {
    strings.add(lexeme.word);
    strings.add(lexeme.normalizedWord);
    strings.add(lexeme.lemma);

    for (const [ordinal, phoneSequence] of lexeme.pronunciations.entries()) {
      for (const phone of phoneSequence) {
        phones.add(phone);
        strings.add(phone);
      }

      const { exactKey, familyKey } = createRhymeKeys(phoneSequence);
      strings.add(exactKey);
      strings.add(familyKey);
      pronunciations.push({
        exactKey,
        familyKey,
        ordinal,
        phones: phoneSequence,
        wordId,
      });
    }
  }

  const sortedStrings = [...strings].sort(compareCodeUnits);
  const stringIds = new Map(sortedStrings.map((value, index) => [value, index]));
  const sortedPhones = [...phones].sort(compareCodeUnits);
  const phoneIds = new Map(sortedPhones.map((value, index) => [value, index]));

  return {
    lexemes,
    manifest,
    phoneIds,
    phones: sortedPhones,
    pronunciations,
    sources,
    stringIds,
    strings: sortedStrings,
  };
}

function buildSections(model) {
  const encodedStrings = model.strings.map((value) => Buffer.from(value, 'utf8'));
  const stringOffsets = [];
  let stringCursor = 0;
  for (const bytes of encodedStrings) {
    stringOffsets.push(stringCursor);
    stringCursor += bytes.length;
  }
  const stringBytes = Buffer.concat(encodedStrings);
  const stringIndex = recordBuffer(model.strings.length, 8, (buffer, offset, index) => {
    buffer.writeUInt32LE(stringOffsets[index], offset);
    buffer.writeUInt32LE(encodedStrings[index].length, offset + 4);
  });

  const metadata = recordBuffer(1, 16, (buffer, offset) => {
    writeStringId(buffer, offset, model, model.manifest.artifact.id);
    writeStringId(buffer, offset + 4, model, model.manifest.artifact.version);
    writeStringId(buffer, offset + 8, model, model.manifest.provenance.owner);
    writeStringId(buffer, offset + 12, model, model.manifest.provenance.purpose);
  });

  const phoneRecords = recordBuffer(model.phones.length, 4, (buffer, offset, index) => {
    writeStringId(buffer, offset, model, model.phones[index]);
  });

  const pronunciationStarts = new Map();
  let pronunciationCursor = 0;
  for (const [wordId, lexeme] of model.lexemes.entries()) {
    pronunciationStarts.set(wordId, pronunciationCursor);
    pronunciationCursor += lexeme.pronunciations.length;
  }

  const words = recordBuffer(model.lexemes.length, 24, (buffer, offset, wordId) => {
    const lexeme = model.lexemes[wordId];
    writeStringId(buffer, offset, model, lexeme.word);
    writeStringId(buffer, offset + 4, model, lexeme.normalizedWord);
    writeStringId(buffer, offset + 8, model, lexeme.lemma);
    buffer.writeUInt32LE(pronunciationStarts.get(wordId), offset + 12);
    buffer.writeUInt32LE(lexeme.pronunciations.length, offset + 16);
  });

  const flattenedPhoneIds = [];
  const pronunciationRecords = recordBuffer(
    model.pronunciations.length,
    24,
    (buffer, offset, index) => {
      const pronunciation = model.pronunciations[index];
      buffer.writeUInt32LE(pronunciation.wordId, offset);
      buffer.writeUInt32LE(flattenedPhoneIds.length, offset + 4);
      buffer.writeUInt32LE(pronunciation.phones.length, offset + 8);
      writeStringId(buffer, offset + 12, model, pronunciation.exactKey);
      writeStringId(buffer, offset + 16, model, pronunciation.familyKey);
      buffer.writeUInt32LE(pronunciation.ordinal, offset + 20);
      flattenedPhoneIds.push(
        ...pronunciation.phones.map((phone) => requiredId(model.phoneIds, phone)),
      );
    },
  );
  const phoneIdRecords = uint32Buffer(flattenedPhoneIds);

  const exactIndex = buildIndex(model, 'exactKey');
  const slantIndex = buildIndex(model, 'familyKey');
  const flagRecords = uint32Buffer(
    model.lexemes.map((lexeme) => encodeFlags(lexeme.flags ?? [])),
  );
  const rankRecords = recordBuffer(model.lexemes.length, 8, (buffer, offset, index) => {
    const lexeme = model.lexemes[index];
    buffer.writeUInt32LE(lexeme.rank, offset);
    buffer.writeUInt32LE(Math.round(lexeme.commonness * 1_000_000), offset + 4);
  });
  const sourceRecords = recordBuffer(model.sources.length, 28, (buffer, offset, index) => {
    const source = model.sources[index];
    writeStringId(buffer, offset, model, source.id);
    writeStringId(buffer, offset + 4, model, source.kind);
    writeStringId(buffer, offset + 8, model, source.version);
    writeStringId(buffer, offset + 12, model, source.path);
    writeStringId(buffer, offset + 16, model, source.sha256);
    writeStringId(buffer, offset + 20, model, source.license);
    writeStringId(buffer, offset + 24, model, source.ownership);
  });

  const values = [
    [SECTION.METADATA, metadata, 1],
    [SECTION.STRING_BYTES, stringBytes, stringBytes.length],
    [SECTION.STRING_INDEX, stringIndex, model.strings.length],
    [SECTION.PHONES, phoneRecords, model.phones.length],
    [SECTION.WORDS, words, model.lexemes.length],
    [SECTION.PRONUNCIATIONS, pronunciationRecords, model.pronunciations.length],
    [SECTION.PHONE_IDS, phoneIdRecords, flattenedPhoneIds.length],
    [SECTION.EXACT_INDEX, exactIndex, model.pronunciations.length],
    [SECTION.SLANT_INDEX, slantIndex, model.pronunciations.length],
    [SECTION.RANKS, rankRecords, model.lexemes.length],
    [SECTION.FLAGS, flagRecords, model.lexemes.length],
    [SECTION.SOURCES, sourceRecords, model.sources.length],
  ];

  return values.map(([id, bytes, count]) => ({
    bytes,
    count,
    id,
    offset: 0,
    width: SECTION_WIDTH[id],
  }));
}

function buildIndex(model, key) {
  const entries = model.pronunciations
    .map((pronunciation, pronunciationId) => ({
      key: pronunciation[key],
      pronunciationId,
      wordId: pronunciation.wordId,
    }))
    .sort((left, right) =>
      compareCodeUnits(left.key, right.key) ||
      left.wordId - right.wordId ||
      left.pronunciationId - right.pronunciationId,
    );

  return recordBuffer(entries.length, 12, (buffer, offset, index) => {
    const entry = entries[index];
    writeStringId(buffer, offset, model, entry.key);
    buffer.writeUInt32LE(entry.wordId, offset + 4);
    buffer.writeUInt32LE(entry.pronunciationId, offset + 8);
  });
}

function encodeFlags(flags) {
  let value = 0;
  for (const flag of flags) {
    if (flag === 'rap') value |= WORD_FLAG.RAP;
    if (flag === 'safety-blocked') value |= WORD_FLAG.SAFETY_BLOCKED;
    if (flag === 'proper-noun') value |= WORD_FLAG.PROPER_NOUN;
  }
  return value;
}

function recordBuffer(count, width, writer) {
  const byteLength = count * width;
  if (
    !Number.isSafeInteger(count) ||
    count < 0 ||
    count > MAX_UINT32 ||
    !Number.isSafeInteger(byteLength) ||
    byteLength > MAX_ARTIFACT_BYTES
  ) {
    throw new Error('Rhyme data table exceeds format bounds');
  }
  const buffer = Buffer.alloc(byteLength);
  for (let index = 0; index < count; index += 1) {
    writer(buffer, index * width, index);
  }
  return buffer;
}

function uint32Buffer(values) {
  return recordBuffer(values.length, 4, (buffer, offset, index) => {
    buffer.writeUInt32LE(values[index], offset);
  });
}

function writeStringId(buffer, offset, model, value) {
  buffer.writeUInt32LE(requiredId(model.stringIds, value), offset);
}

function requiredId(ids, value) {
  const id = ids.get(value);
  if (id === undefined) throw new Error(`Missing deterministic id for ${value}`);
  return id;
}

function comparePhoneSequences(left, right) {
  return compareCodeUnits(left.join('\0'), right.join('\0'));
}
