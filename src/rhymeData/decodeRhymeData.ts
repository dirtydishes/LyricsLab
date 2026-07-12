import { createRhymeEngine, type RhymeLexemeInput } from '../rhyme/createRhymeEngine';
import type { RhymeEngine } from '../rhyme/RhymeEngine';
import { analyzePronunciation } from '../rhyme/productionPhonology';
import { normalizeRhymeToken } from '../rhyme/normalize';
import {
  RHYME_DATA_DIRECTORY_ENTRY_BYTES,
  RHYME_DATA_FORMAT_VERSION,
  RHYME_DATA_HEADER_BYTES,
  RHYME_DATA_MAGIC,
  RHYME_DATA_MAX_PHONES_PER_PRONUNCIATION,
  RHYME_DATA_MAX_PRONUNCIATIONS_PER_WORD,
  RHYME_DATA_MAX_STRING_BYTES,
  RHYME_DATA_REQUIRED_SECTIONS,
  RHYME_DATA_SECTION_WIDTHS,
  RhymeDataSection,
  RhymeDataWordFlag,
  type RhymeDataSectionDescriptor,
} from './binaryFormat';

export type RhymeDataDigest = (
  bytes: Uint8Array,
) => Promise<Uint8Array>;

export type DecodeRhymeDataOptions = {
  readonly expectedManifestSha256?: string;
  readonly recordsPerChunk?: number;
  readonly sha256: RhymeDataDigest;
  readonly yieldToHost?: () => Promise<void>;
};

export type DecodedRhymeData = {
  readonly artifactId: string;
  readonly engine: RhymeEngine;
  readonly sourceManifestSha256: string;
  readonly version: string;
};

type WordRecord = {
  readonly commonness: number;
  readonly flags: number;
  readonly lemma: string;
  readonly normalizedWord: string;
  readonly pronunciationCount: number;
  readonly pronunciationStart: number;
  readonly word: string;
};

type PronunciationRecord = {
  readonly exactKeyId: number;
  readonly familyKeyId: number;
  readonly phoneCount: number;
  readonly phoneStart: number;
  readonly ordinal: number;
  readonly wordId: number;
};

export async function decodeRhymeData(
  bytes: Uint8Array,
  options: DecodeRhymeDataOptions,
): Promise<DecodedRhymeData> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  validateHeader(bytes, view);
  const descriptors = readDirectory(view);
  validateSectionLayout(bytes, descriptors);
  await validateHashes(bytes, options);

  const getSection = (id: number) => {
    const section = descriptors.get(id);
    if (!section) throw new Error(`Missing rhyme data section ${id}`);
    return section;
  };
  for (const [id, label] of [
    [RhymeDataSection.stringBytes, 'string bytes'],
    [RhymeDataSection.stringIndex, 'string index'],
    [RhymeDataSection.phones, 'phone table'],
    [RhymeDataSection.words, 'word table'],
    [RhymeDataSection.pronunciations, 'pronunciation table'],
    [RhymeDataSection.phoneIds, 'phone id table'],
    [RhymeDataSection.sources, 'source table'],
  ] as const) {
    if (getSection(id).count === 0) {
      throw new Error(`Rhyme data ${label} must not be empty`);
    }
  }
  const strings = await readStrings(
    bytes,
    view,
    getSection(RhymeDataSection.stringBytes),
    getSection(RhymeDataSection.stringIndex),
    options,
  );
  const metadata = getSection(RhymeDataSection.metadata);
  if (metadata.count !== 1) throw new Error('Rhyme data must contain one metadata record');
  const artifactId = readStringReference(view, metadata.offset, strings, 'artifact id');
  const version = readStringReference(view, metadata.offset + 4, strings, 'artifact version');
  const provenanceOwner = readStringReference(
    view,
    metadata.offset + 8,
    strings,
    'provenance owner',
  );
  const provenancePurpose = readStringReference(
    view,
    metadata.offset + 12,
    strings,
    'provenance purpose',
  );
  if (
    [artifactId, version, provenanceOwner, provenancePurpose].some(
      (value) => !value.trim(),
    )
  ) {
    throw new Error('Rhyme data metadata values must be non-empty');
  }

  const phoneNames = await readPhoneNames(
    view,
    getSection(RhymeDataSection.phones),
    strings,
    options,
  );
  const phoneIds = await readUint32Records(
    view,
    getSection(RhymeDataSection.phoneIds),
    options,
  );
  const referencedPhones = new Set<number>();
  for (const phoneId of phoneIds) {
    if (phoneId >= phoneNames.length) throw new Error('Phone id is out of bounds');
    referencedPhones.add(phoneId);
  }
  if (referencedPhones.size !== phoneNames.length) {
    throw new Error('Phone table contains unreferenced records');
  }

  const pronunciationSection = getSection(RhymeDataSection.pronunciations);
  const pronunciations = await readPronunciations(
    view,
    pronunciationSection,
    strings,
    phoneNames,
    phoneIds,
    options,
  );
  await validatePronunciationPhoneRanges(pronunciations, phoneIds.length, options);
  const flags = await readUint32Records(
    view,
    getSection(RhymeDataSection.flags),
    options,
  );
  const commonness = await readRanks(
    view,
    getSection(RhymeDataSection.ranks),
    options,
  );
  const words = await readWords(
    view,
    getSection(RhymeDataSection.words),
    flags,
    commonness,
    strings,
    pronunciationSection.count,
    options,
  );

  await validateWordPronunciationRanges(words, pronunciations, options);
  await validateIndex(
    view,
    getSection(RhymeDataSection.exactIndex),
    pronunciations,
    'exact',
    options,
  );
  await validateIndex(
    view,
    getSection(RhymeDataSection.slantIndex),
    pronunciations,
    'slant',
    options,
  );
  await validateSources(
    view,
    getSection(RhymeDataSection.sources),
    strings,
    options,
  );

  const lexemes: RhymeLexemeInput[] = [];
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    lexemes.push({
      commonness: word.commonness,
      lemma: word.lemma,
      normalizedWord: word.normalizedWord,
      pronunciations: pronunciations
        .slice(
          word.pronunciationStart,
          word.pronunciationStart + word.pronunciationCount,
        )
        .map((pronunciation) => ({
          phones: phoneIds
            .slice(
              pronunciation.phoneStart,
              pronunciation.phoneStart + pronunciation.phoneCount,
            )
            .map((phoneId) => phoneNames[phoneId]),
        })),
      suggestionEligible: (
        word.flags &
        (RhymeDataWordFlag.safetyBlocked | RhymeDataWordFlag.properNoun)
      ) === 0,
      word: word.word,
    });
    await maybeYield(index + 1, options);
  }

  return {
    artifactId,
    engine: createRhymeEngine(lexemes),
    sourceManifestSha256: bytesToHex(bytes.subarray(24, 56)),
    version,
  };
}

function validateHeader(bytes: Uint8Array, view: DataView) {
  if (bytes.length < RHYME_DATA_HEADER_BYTES) {
    throw new Error('Rhyme data header is truncated');
  }
  RHYME_DATA_MAGIC.forEach((expected, index) => {
    if (bytes[index] !== expected) throw new Error('Invalid rhyme data magic');
  });
  if (view.getUint16(8, true) !== RHYME_DATA_FORMAT_VERSION) {
    throw new Error('Unsupported rhyme data format version');
  }
  if (view.getUint16(10, true) !== RHYME_DATA_HEADER_BYTES) {
    throw new Error('Invalid rhyme data header size');
  }
  if (view.getUint32(12, true) !== bytes.length) {
    throw new Error('Rhyme data total size mismatch');
  }
  if (view.getUint32(16, true) !== RHYME_DATA_HEADER_BYTES) {
    throw new Error('Invalid rhyme data directory offset');
  }
  if (view.getUint16(20, true) !== RHYME_DATA_REQUIRED_SECTIONS.length) {
    throw new Error('Invalid rhyme data section count');
  }
  if (view.getUint16(22, true) !== 0) throw new Error('Unsupported header flags');
  for (let offset = 88; offset < RHYME_DATA_HEADER_BYTES; offset += 1) {
    if (bytes[offset] !== 0) throw new Error('Non-zero reserved header bytes');
  }
}

function readDirectory(view: DataView) {
  const count = view.getUint16(20, true);
  const descriptors = new Map<number, RhymeDataSectionDescriptor>();
  let previousId = 0;
  for (let index = 0; index < count; index += 1) {
    const offset = RHYME_DATA_HEADER_BYTES + index * RHYME_DATA_DIRECTORY_ENTRY_BYTES;
    if (offset + RHYME_DATA_DIRECTORY_ENTRY_BYTES > view.byteLength) {
      throw new Error('Rhyme data directory is truncated');
    }
    const descriptor = {
      id: view.getUint16(offset, true),
      width: view.getUint16(offset + 2, true),
      offset: view.getUint32(offset + 4, true),
      length: view.getUint32(offset + 8, true),
      count: view.getUint32(offset + 12, true),
    };
    if (view.getUint32(offset + 16, true) !== 0 || view.getUint32(offset + 20, true) !== 0) {
      throw new Error('Non-zero reserved section descriptor bytes');
    }
    if (descriptors.has(descriptor.id)) throw new Error('Duplicate rhyme data section');
    if (!RHYME_DATA_REQUIRED_SECTIONS.some((id) => id === descriptor.id)) {
      throw new Error(`Unknown rhyme data section ${descriptor.id}`);
    }
    if (descriptor.id <= previousId) throw new Error('Rhyme data sections are not in canonical order');
    descriptors.set(descriptor.id, descriptor);
    previousId = descriptor.id;
  }
  return descriptors;
}

function validateSectionLayout(
  bytes: Uint8Array,
  descriptors: ReadonlyMap<number, RhymeDataSectionDescriptor>,
) {
  const directoryEnd =
    RHYME_DATA_HEADER_BYTES +
    RHYME_DATA_REQUIRED_SECTIONS.length * RHYME_DATA_DIRECTORY_ENTRY_BYTES;
  const ordered = [...descriptors.values()].sort((left, right) => left.offset - right.offset);
  let previousEnd = directoryEnd;

  for (const descriptor of ordered) {
    const expectedWidth = RHYME_DATA_SECTION_WIDTHS[descriptor.id];
    if (descriptor.width !== expectedWidth) throw new Error('Rhyme data record width mismatch');
    if (descriptor.offset % 4 !== 0) throw new Error('Rhyme data section is misaligned');
    if (descriptor.offset < directoryEnd) throw new Error('Rhyme data section overlaps its directory');
    const calculatedLength = descriptor.count * descriptor.width;
    if (!Number.isSafeInteger(calculatedLength) || descriptor.length !== calculatedLength) {
      throw new Error('Rhyme data section length/count mismatch');
    }
    const end = descriptor.offset + descriptor.length;
    if (!Number.isSafeInteger(end) || end > bytes.length) {
      throw new Error('Rhyme data section is out of bounds');
    }
    if (descriptor.offset < previousEnd) throw new Error('Rhyme data sections overlap');
    const expectedOffset = align4(previousEnd);
    if (descriptor.offset !== expectedOffset) {
      throw new Error('Rhyme data section padding is not canonical');
    }
    assertZeroPadding(bytes, previousEnd, descriptor.offset);
    previousEnd = end;
  }

  const expectedTotal = align4(previousEnd);
  if (bytes.length !== expectedTotal) {
    throw new Error('Rhyme data trailing padding is not canonical');
  }
  assertZeroPadding(bytes, previousEnd, bytes.length);
}

async function validateHashes(bytes: Uint8Array, options: DecodeRhymeDataOptions) {
  const actualPayloadHash = await options.sha256(bytes.subarray(RHYME_DATA_HEADER_BYTES));
  if (!equalBytes(actualPayloadHash, bytes.subarray(56, 88))) {
    throw new Error('Rhyme data payload hash mismatch');
  }
  const manifestHash = bytesToHex(bytes.subarray(24, 56));
  if (
    options.expectedManifestSha256 !== undefined &&
    !/^[a-f0-9]{64}$/iu.test(options.expectedManifestSha256)
  ) {
    throw new Error('Expected rhyme data manifest hash is malformed');
  }
  if (
    options.expectedManifestSha256 &&
    manifestHash !== options.expectedManifestSha256.toLowerCase()
  ) {
    throw new Error('Rhyme data manifest hash mismatch');
  }
}

async function readStrings(
  bytes: Uint8Array,
  view: DataView,
  blob: RhymeDataSectionDescriptor,
  index: RhymeDataSectionDescriptor,
  options: DecodeRhymeDataOptions,
) {
  const strings: string[] = [];
  let previous = '';
  let expectedStart = 0;
  for (let record = 0; record < index.count; record += 1) {
    const offset = index.offset + record * index.width;
    const start = view.getUint32(offset, true);
    const length = view.getUint32(offset + 4, true);
    if (length > RHYME_DATA_MAX_STRING_BYTES) {
      throw new Error('String record exceeds the bounded format limit');
    }
    if (start + length > blob.length) throw new Error('String range is out of bounds');
    if (start !== expectedStart) throw new Error('String ranges are not contiguous');
    const value = decodeUtf8(bytes.subarray(blob.offset + start, blob.offset + start + length));
    if (record > 0 && value <= previous) throw new Error('String table is not strictly sorted');
    strings.push(value);
    previous = value;
    expectedStart += length;
    await maybeYield(record + 1, options);
  }
  if (expectedStart !== blob.length) throw new Error('String bytes are not fully indexed');
  return strings;
}

async function readPhoneNames(
  view: DataView,
  section: RhymeDataSectionDescriptor,
  strings: readonly string[],
  options: DecodeRhymeDataOptions,
) {
  const names: string[] = [];
  let previous = '';
  for (let index = 0; index < section.count; index += 1) {
    const name = readStringReference(view, section.offset + index * section.width, strings, 'phone');
    if (index > 0 && name <= previous) throw new Error('Phone table is not strictly sorted');
    names.push(name);
    previous = name;
    await maybeYield(index + 1, options);
  }
  return names;
}

async function readWords(
  view: DataView,
  section: RhymeDataSectionDescriptor,
  flags: readonly number[],
  commonnessValues: readonly number[],
  strings: readonly string[],
  pronunciationCount: number,
  options: DecodeRhymeDataOptions,
) {
  if (flags.length !== section.count) throw new Error('Word flags count mismatch');
  if (commonnessValues.length !== section.count) throw new Error('Word rank count mismatch');
  const words: WordRecord[] = [];
  let previousNormalizedWord = '';
  for (let index = 0; index < section.count; index += 1) {
    const offset = section.offset + index * section.width;
    const normalizedWord = readStringReference(view, offset + 4, strings, 'normalized word');
    const word = readStringReference(view, offset, strings, 'word');
    const lemma = readStringReference(view, offset + 8, strings, 'lemma');
    if (!word.trim()) throw new Error('Word display value must be non-empty');
    if (!normalizedWord || normalizeRhymeToken(normalizedWord) !== normalizedWord) {
      throw new Error('Normalized word is not canonical');
    }
    if (!lemma || normalizeRhymeToken(lemma) !== lemma) {
      throw new Error('Lemma is not canonical');
    }
    if (index > 0 && normalizedWord <= previousNormalizedWord) {
      throw new Error('Word table is not strictly sorted');
    }
    const pronunciationStart = view.getUint32(offset + 12, true);
    const wordPronunciationCount = view.getUint32(offset + 16, true);
    if (view.getUint32(offset + 20, true) !== 0) throw new Error('Non-zero reserved word field');
    if (
      wordPronunciationCount === 0 ||
      wordPronunciationCount > RHYME_DATA_MAX_PRONUNCIATIONS_PER_WORD ||
      pronunciationStart + wordPronunciationCount > pronunciationCount
    ) {
      throw new Error('Word pronunciation range is invalid');
    }
    if ((flags[index] & ~7) !== 0) throw new Error('Unknown word flag bits');
    words.push({
      commonness: commonnessValues[index],
      flags: flags[index],
      lemma,
      normalizedWord,
      pronunciationCount: wordPronunciationCount,
      pronunciationStart,
      word,
    });
    previousNormalizedWord = normalizedWord;
    await maybeYield(index + 1, options);
  }
  return words;
}

async function readRanks(
  view: DataView,
  section: RhymeDataSectionDescriptor,
  options: DecodeRhymeDataOptions,
) {
  const commonness: number[] = [];
  for (let index = 0; index < section.count; index += 1) {
    const offset = section.offset + index * section.width;
    const rank = view.getUint32(offset, true);
    const scaledCommonness = view.getUint32(offset + 4, true);
    if (rank === 0 || scaledCommonness > 1_000_000) {
      throw new Error('Word rank record is out of bounds');
    }
    commonness.push(scaledCommonness / 1_000_000);
    await maybeYield(index + 1, options);
  }
  return commonness;
}

async function readPronunciations(
  view: DataView,
  section: RhymeDataSectionDescriptor,
  strings: readonly string[],
  phoneNames: readonly string[],
  phoneIds: readonly number[],
  options: DecodeRhymeDataOptions,
) {
  const values: PronunciationRecord[] = [];
  for (let index = 0; index < section.count; index += 1) {
    const offset = section.offset + index * section.width;
    const value = {
      wordId: view.getUint32(offset, true),
      phoneStart: view.getUint32(offset + 4, true),
      phoneCount: view.getUint32(offset + 8, true),
      exactKeyId: view.getUint32(offset + 12, true),
      familyKeyId: view.getUint32(offset + 16, true),
      ordinal: view.getUint32(offset + 20, true),
    };
    if (
      value.phoneCount === 0 ||
      value.phoneCount > RHYME_DATA_MAX_PHONES_PER_PRONUNCIATION ||
      value.phoneStart + value.phoneCount > phoneIds.length
    ) {
      throw new Error('Pronunciation phone range is invalid');
    }
    if (value.exactKeyId >= strings.length || value.familyKeyId >= strings.length) {
      throw new Error('Pronunciation key is out of bounds');
    }
    const phones = phoneIds
      .slice(value.phoneStart, value.phoneStart + value.phoneCount)
      .map((phoneId) => phoneNames[phoneId]);
    const analysis = analyzePronunciation(phones);
    if (
      !analysis ||
      strings[value.exactKeyId] !== analysis.tailKey ||
      strings[value.familyKeyId] !== analysis.familyKey
    ) {
      throw new Error('Rhyme data pronunciation key does not match its phones');
    }
    values.push(value);
    await maybeYield(index + 1, options);
  }
  return values;
}

async function validatePronunciationPhoneRanges(
  pronunciations: readonly PronunciationRecord[],
  phoneIdCount: number,
  options: DecodeRhymeDataOptions,
) {
  let nextPhone = 0;
  for (let index = 0; index < pronunciations.length; index += 1) {
    const pronunciation = pronunciations[index];
    if (pronunciation.phoneStart !== nextPhone) {
      throw new Error('Pronunciation phone ranges are not contiguous');
    }
    nextPhone += pronunciation.phoneCount;
    await maybeYield(index + 1, options);
  }
  if (nextPhone !== phoneIdCount) {
    throw new Error('Pronunciation phone ranges do not own every phone id');
  }
}

async function validateWordPronunciationRanges(
  words: readonly WordRecord[],
  pronunciations: readonly PronunciationRecord[],
  options: DecodeRhymeDataOptions,
) {
  let nextPronunciation = 0;
  for (let wordId = 0; wordId < words.length; wordId += 1) {
    const word = words[wordId];
    if (word.pronunciationStart !== nextPronunciation) throw new Error('Word pronunciation ranges are not contiguous');
    for (let index = word.pronunciationStart; index < word.pronunciationStart + word.pronunciationCount; index += 1) {
      if (pronunciations[index].wordId !== wordId) throw new Error('Pronunciation references the wrong word');
      if (pronunciations[index].ordinal !== index - word.pronunciationStart) {
        throw new Error('Pronunciation alternates are not in canonical order');
      }
    }
    nextPronunciation += word.pronunciationCount;
    await maybeYield(wordId + 1, options);
  }
  if (nextPronunciation !== pronunciations.length) throw new Error('Unowned pronunciation records');
}

async function validateIndex(
  view: DataView,
  section: RhymeDataSectionDescriptor,
  pronunciations: readonly PronunciationRecord[],
  kind: 'exact' | 'slant',
  options: DecodeRhymeDataOptions,
) {
  if (section.count !== pronunciations.length) throw new Error(`${kind} index count mismatch`);
  const seen = new Set<number>();
  let previous: readonly number[] | undefined;
  for (let index = 0; index < section.count; index += 1) {
    const offset = section.offset + index * section.width;
    const keyId = view.getUint32(offset, true);
    const wordId = view.getUint32(offset + 4, true);
    const pronunciationId = view.getUint32(offset + 8, true);
    const pronunciation = pronunciations[pronunciationId];
    if (!pronunciation || pronunciation.wordId !== wordId) throw new Error(`${kind} index reference is invalid`);
    const expectedKey = kind === 'exact' ? pronunciation.exactKeyId : pronunciation.familyKeyId;
    if (keyId !== expectedKey) throw new Error(`${kind} index key does not match pronunciation`);
    if (seen.has(pronunciationId)) throw new Error(`${kind} index contains a duplicate pronunciation`);
    const tuple = [keyId, wordId, pronunciationId] as const;
    if (previous && compareNumberTuple(previous, tuple) >= 0) throw new Error(`${kind} index is not strictly sorted`);
    previous = tuple;
    seen.add(pronunciationId);
    await maybeYield(index + 1, options);
  }
}

async function validateSources(
  view: DataView,
  section: RhymeDataSectionDescriptor,
  strings: readonly string[],
  options: DecodeRhymeDataOptions,
) {
  if (section.count === 0) throw new Error('Rhyme data must contain a source record');
  let previous = '';
  for (let index = 0; index < section.count; index += 1) {
    const offset = section.offset + index * section.width;
    const id = readStringReference(view, offset, strings, 'source id');
    if (index > 0 && id <= previous) throw new Error('Source table is not strictly sorted');
    const kind = readStringReference(view, offset + 4, strings, 'source kind');
    const version = readStringReference(view, offset + 8, strings, 'source version');
    const path = readStringReference(view, offset + 12, strings, 'source path');
    const hash = readStringReference(view, offset + 16, strings, 'source hash');
    if (!/^[a-f0-9]{64}$/u.test(hash)) throw new Error('Source hash is malformed');
    const license = readStringReference(view, offset + 20, strings, 'source license');
    const ownership = readStringReference(view, offset + 24, strings, 'source ownership');
    if ([id, kind, version, path, license, ownership].some((value) => !value.trim())) {
      throw new Error('Rhyme data source values must be non-empty');
    }
    previous = id;
    await maybeYield(index + 1, options);
  }
}

async function readUint32Records(
  view: DataView,
  section: RhymeDataSectionDescriptor,
  options: DecodeRhymeDataOptions,
) {
  const values: number[] = [];
  for (let index = 0; index < section.count; index += 1) {
    values.push(view.getUint32(section.offset + index * section.width, true));
    await maybeYield(index + 1, options);
  }
  return values;
}

function readStringReference(view: DataView, offset: number, strings: readonly string[], label: string) {
  const stringId = view.getUint32(offset, true);
  const value = strings[stringId];
  if (value === undefined) throw new Error(`${label} string id is out of bounds`);
  return value;
}

async function maybeYield(index: number, options: DecodeRhymeDataOptions) {
  const chunkSize = normalizeChunkSize(options.recordsPerChunk);
  if (options.yieldToHost && index % chunkSize === 0) await options.yieldToHost();
}

function normalizeChunkSize(value: number | undefined) {
  if (value === undefined) return 256;
  if (!Number.isInteger(value) || value <= 0 || value > 4096) throw new Error('Invalid decode chunk size');
  return value;
}

function align4(value: number) {
  return Math.ceil(value / 4) * 4;
}

function assertZeroPadding(bytes: Uint8Array, start: number, end: number) {
  for (let offset = start; offset < end; offset += 1) {
    if (bytes[offset] !== 0) throw new Error('Rhyme data padding must be zero');
  }
}

function compareNumberTuple(left: readonly number[], right: readonly number[]) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function equalBytes(left: Uint8Array, right: Uint8Array) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function decodeUtf8(bytes: Uint8Array) {
  let output = '';
  for (let index = 0; index < bytes.length; ) {
    const first = bytes[index++];
    let codePoint: number;
    let continuationCount: number;
    if (first <= 0x7f) {
      codePoint = first;
      continuationCount = 0;
    } else if (first >= 0xc2 && first <= 0xdf) {
      codePoint = first & 0x1f;
      continuationCount = 1;
    } else if (first >= 0xe0 && first <= 0xef) {
      codePoint = first & 0x0f;
      continuationCount = 2;
    } else if (first >= 0xf0 && first <= 0xf4) {
      codePoint = first & 0x07;
      continuationCount = 3;
    } else {
      throw new Error('String table contains invalid UTF-8');
    }
    for (let continuation = 0; continuation < continuationCount; continuation += 1) {
      const next = bytes[index++];
      if (next === undefined || (next & 0xc0) !== 0x80) throw new Error('String table contains invalid UTF-8');
      codePoint = (codePoint << 6) | (next & 0x3f);
    }
    if (
      (continuationCount === 2 && codePoint < 0x800) ||
      (continuationCount === 3 && codePoint < 0x10000) ||
      codePoint > 0x10ffff ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff)
    ) {
      throw new Error('String table contains invalid UTF-8');
    }
    output += String.fromCodePoint(codePoint);
  }
  return output;
}
