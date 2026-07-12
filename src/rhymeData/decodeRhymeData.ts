import { createRhymeEngine, type RhymeLexemeInput } from '../rhyme/createRhymeEngine';
import type { RhymeEngine } from '../rhyme/RhymeEngine';
import {
  RHYME_DATA_DIRECTORY_ENTRY_BYTES,
  RHYME_DATA_FORMAT_VERSION,
  RHYME_DATA_HEADER_BYTES,
  RHYME_DATA_MAGIC,
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
  validateSectionLayout(bytes.length, descriptors);
  await validateHashes(bytes, options);

  const getSection = (id: number) => {
    const section = descriptors.get(id);
    if (!section) throw new Error(`Missing rhyme data section ${id}`);
    return section;
  };
  const strings = readStrings(
    bytes,
    view,
    getSection(RhymeDataSection.stringBytes),
    getSection(RhymeDataSection.stringIndex),
  );
  const metadata = getSection(RhymeDataSection.metadata);
  const artifactId = readStringReference(view, metadata.offset, strings, 'artifact id');
  const version = readStringReference(view, metadata.offset + 4, strings, 'artifact version');
  readStringReference(view, metadata.offset + 8, strings, 'provenance owner');
  readStringReference(view, metadata.offset + 12, strings, 'provenance purpose');

  const phoneNames = readPhoneNames(
    view,
    getSection(RhymeDataSection.phones),
    strings,
  );
  const phoneIds = readUint32Records(view, getSection(RhymeDataSection.phoneIds));
  for (const phoneId of phoneIds) {
    if (phoneId >= phoneNames.length) throw new Error('Phone id is out of bounds');
  }

  const pronunciationSection = getSection(RhymeDataSection.pronunciations);
  const pronunciations = await readPronunciations(
    view,
    pronunciationSection,
    strings.length,
    phoneIds.length,
    options,
  );
  const flags = readUint32Records(view, getSection(RhymeDataSection.flags));
  const commonness = readRanks(view, getSection(RhymeDataSection.ranks));
  const words = await readWords(
    view,
    getSection(RhymeDataSection.words),
    flags,
    commonness,
    strings,
    pronunciationSection.count,
    options,
  );

  validateWordPronunciationRanges(words, pronunciations);
  validateIndex(
    view,
    getSection(RhymeDataSection.exactIndex),
    pronunciations,
    'exact',
  );
  validateIndex(
    view,
    getSection(RhymeDataSection.slantIndex),
    pronunciations,
    'slant',
  );
  validateSources(view, getSection(RhymeDataSection.sources), strings);

  const lexemes = words
    .filter((word) => (word.flags & RhymeDataWordFlag.safetyBlocked) === 0)
    .map<RhymeLexemeInput>((word) => ({
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
      word: word.word,
    }));

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
  totalBytes: number,
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
    if (descriptor.length !== descriptor.count * descriptor.width) {
      throw new Error('Rhyme data section length/count mismatch');
    }
    const end = descriptor.offset + descriptor.length;
    if (!Number.isSafeInteger(end) || end > totalBytes) {
      throw new Error('Rhyme data section is out of bounds');
    }
    if (descriptor.offset < previousEnd) throw new Error('Rhyme data sections overlap');
    previousEnd = end;
  }
}

async function validateHashes(bytes: Uint8Array, options: DecodeRhymeDataOptions) {
  const actualPayloadHash = await options.sha256(bytes.subarray(RHYME_DATA_HEADER_BYTES));
  if (!equalBytes(actualPayloadHash, bytes.subarray(56, 88))) {
    throw new Error('Rhyme data payload hash mismatch');
  }
  const manifestHash = bytesToHex(bytes.subarray(24, 56));
  if (
    options.expectedManifestSha256 &&
    manifestHash !== options.expectedManifestSha256.toLowerCase()
  ) {
    throw new Error('Rhyme data manifest hash mismatch');
  }
}

function readStrings(
  bytes: Uint8Array,
  view: DataView,
  blob: RhymeDataSectionDescriptor,
  index: RhymeDataSectionDescriptor,
) {
  const strings: string[] = [];
  let previous = '';
  let expectedStart = 0;
  for (let record = 0; record < index.count; record += 1) {
    const offset = index.offset + record * index.width;
    const start = view.getUint32(offset, true);
    const length = view.getUint32(offset + 4, true);
    if (start + length > blob.length) throw new Error('String range is out of bounds');
    if (start !== expectedStart) throw new Error('String ranges are not contiguous');
    const value = decodeUtf8(bytes.subarray(blob.offset + start, blob.offset + start + length));
    if (record > 0 && value <= previous) throw new Error('String table is not strictly sorted');
    strings.push(value);
    previous = value;
    expectedStart += length;
  }
  if (expectedStart !== blob.length) throw new Error('String bytes are not fully indexed');
  return strings;
}

function readPhoneNames(view: DataView, section: RhymeDataSectionDescriptor, strings: readonly string[]) {
  const names: string[] = [];
  let previous = '';
  for (let index = 0; index < section.count; index += 1) {
    const name = readStringReference(view, section.offset + index * section.width, strings, 'phone');
    if (index > 0 && name <= previous) throw new Error('Phone table is not strictly sorted');
    names.push(name);
    previous = name;
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
    if (index > 0 && normalizedWord <= previousNormalizedWord) {
      throw new Error('Word table is not strictly sorted');
    }
    const pronunciationStart = view.getUint32(offset + 12, true);
    const wordPronunciationCount = view.getUint32(offset + 16, true);
    if (view.getUint32(offset + 20, true) !== 0) throw new Error('Non-zero reserved word field');
    if (pronunciationStart + wordPronunciationCount > pronunciationCount || wordPronunciationCount === 0) {
      throw new Error('Word pronunciation range is invalid');
    }
    if ((flags[index] & ~7) !== 0) throw new Error('Unknown word flag bits');
    words.push({
      commonness: commonnessValues[index],
      flags: flags[index],
      lemma: readStringReference(view, offset + 8, strings, 'lemma'),
      normalizedWord,
      pronunciationCount: wordPronunciationCount,
      pronunciationStart,
      word: readStringReference(view, offset, strings, 'word'),
    });
    previousNormalizedWord = normalizedWord;
    await maybeYield(index + 1, options);
  }
  return words;
}

function readRanks(view: DataView, section: RhymeDataSectionDescriptor) {
  const commonness: number[] = [];
  for (let index = 0; index < section.count; index += 1) {
    const offset = section.offset + index * section.width;
    const rank = view.getUint32(offset, true);
    const scaledCommonness = view.getUint32(offset + 4, true);
    if (rank === 0 || scaledCommonness > 1_000_000) {
      throw new Error('Word rank record is out of bounds');
    }
    commonness.push(scaledCommonness / 1_000_000);
  }
  return commonness;
}

async function readPronunciations(
  view: DataView,
  section: RhymeDataSectionDescriptor,
  stringCount: number,
  phoneIdCount: number,
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
    if (value.phoneCount === 0 || value.phoneStart + value.phoneCount > phoneIdCount) {
      throw new Error('Pronunciation phone range is invalid');
    }
    if (value.exactKeyId >= stringCount || value.familyKeyId >= stringCount) {
      throw new Error('Pronunciation key is out of bounds');
    }
    values.push(value);
    await maybeYield(index + 1, options);
  }
  return values;
}

function validateWordPronunciationRanges(words: readonly WordRecord[], pronunciations: readonly PronunciationRecord[]) {
  let nextPronunciation = 0;
  words.forEach((word, wordId) => {
    if (word.pronunciationStart !== nextPronunciation) throw new Error('Word pronunciation ranges are not contiguous');
    for (let index = word.pronunciationStart; index < word.pronunciationStart + word.pronunciationCount; index += 1) {
      if (pronunciations[index].wordId !== wordId) throw new Error('Pronunciation references the wrong word');
      if (pronunciations[index].ordinal !== index - word.pronunciationStart) {
        throw new Error('Pronunciation alternates are not in canonical order');
      }
    }
    nextPronunciation += word.pronunciationCount;
  });
  if (nextPronunciation !== pronunciations.length) throw new Error('Unowned pronunciation records');
}

function validateIndex(
  view: DataView,
  section: RhymeDataSectionDescriptor,
  pronunciations: readonly PronunciationRecord[],
  kind: 'exact' | 'slant',
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
  }
}

function validateSources(view: DataView, section: RhymeDataSectionDescriptor, strings: readonly string[]) {
  let previous = '';
  for (let index = 0; index < section.count; index += 1) {
    const offset = section.offset + index * section.width;
    const id = readStringReference(view, offset, strings, 'source id');
    if (index > 0 && id <= previous) throw new Error('Source table is not strictly sorted');
    readStringReference(view, offset + 4, strings, 'source kind');
    readStringReference(view, offset + 8, strings, 'source version');
    readStringReference(view, offset + 12, strings, 'source path');
    const hash = readStringReference(view, offset + 16, strings, 'source hash');
    if (!/^[a-f0-9]{64}$/u.test(hash)) throw new Error('Source hash is malformed');
    readStringReference(view, offset + 20, strings, 'source license');
    readStringReference(view, offset + 24, strings, 'source ownership');
    previous = id;
  }
}

function readUint32Records(view: DataView, section: RhymeDataSectionDescriptor) {
  return Array.from({ length: section.count }, (_, index) =>
    view.getUint32(section.offset + index * section.width, true),
  );
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
