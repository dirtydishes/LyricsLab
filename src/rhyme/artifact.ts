import { buildRhymeIndex, type RhymeIndex } from './rhymeIndex';

export const RHYME_INDEX_ARTIFACT_FORMAT = 'lyricslab.rhyme-index' as const;
export const RHYME_INDEX_ARTIFACT_VERSION = 1 as const;

export type RhymeIndexArtifact =
  | CompactRhymeIndexArtifact
  | LexemeRhymeIndexArtifact;

export type RhymeIndexArtifactBuildInfo = {
  readonly generator: string;
  readonly generatorVersion: number;
  readonly source: {
    readonly path: string;
    readonly sha256: string;
    readonly bytes: number;
    readonly lines: number;
  };
  readonly artifactDataSha256: string;
  readonly counts: {
    readonly entries: number;
    readonly lexemes: number;
    readonly pronunciations: number;
    readonly tailKeys: number;
    readonly noTailPronunciations: number;
  };
  readonly sort: readonly string[];
};

export type CompactRhymeIndexArtifact = {
  readonly format: typeof RHYME_INDEX_ARTIFACT_FORMAT;
  readonly version: typeof RHYME_INDEX_ARTIFACT_VERSION;
  readonly build: RhymeIndexArtifactBuildInfo;
  readonly phoneInventory: readonly string[];
  readonly words: readonly RhymeArtifactWordTuple[];
  readonly pronunciations: readonly RhymeArtifactPronunciationTuple[];
  readonly tails: readonly string[];
};

export type RhymeArtifactWordTuple = readonly [
  normalizedWord: string,
  pronunciationStart: number,
  pronunciationCount: number,
];

export type RhymeArtifactPronunciationTuple = readonly [
  phoneIds: readonly number[],
  rhymeTailIndex: number | null,
];

export type LexemeRhymeIndexArtifact = {
  readonly format: typeof RHYME_INDEX_ARTIFACT_FORMAT;
  readonly version: typeof RHYME_INDEX_ARTIFACT_VERSION;
  readonly lexemes: readonly RhymeArtifactLexeme[];
};

export type RhymeArtifactLexeme = {
  readonly word: string;
  readonly normalizedWord: string;
  readonly pronunciations: readonly RhymeArtifactPronunciation[];
};

export type RhymeArtifactPronunciation = {
  readonly phones: readonly string[];
  readonly rhymeTail: readonly string[] | null;
};

export function loadRhymeIndexFromArtifact(
  artifact: unknown,
): RhymeIndex {
  assertRhymeIndexArtifact(artifact);

  if (isCompactRhymeIndexArtifact(artifact)) {
    return buildRhymeIndex(expandCompactArtifactLexemes(artifact));
  }

  return buildRhymeIndex(artifact.lexemes);
}

export function assertRhymeIndexArtifact(
  artifact: unknown,
): asserts artifact is RhymeIndexArtifact {
  const artifactObject = asObject(artifact, 'artifact');

  if (artifactObject.format !== RHYME_INDEX_ARTIFACT_FORMAT) {
    throw new TypeError('unsupported rhyme artifact format');
  }

  if (artifactObject.version !== RHYME_INDEX_ARTIFACT_VERSION) {
    throw new TypeError('unsupported rhyme artifact version');
  }

  if (Array.isArray(artifactObject.lexemes)) {
    assertArtifactLexemes(artifactObject.lexemes);
    return;
  }

  assertCompactArtifactTables(artifactObject);
}

export function getRhymeIndexArtifactBuildInfo(
  artifact: RhymeIndexArtifact,
): RhymeIndexArtifactBuildInfo | null {
  return isCompactRhymeIndexArtifact(artifact) ? artifact.build : null;
}

function isCompactRhymeIndexArtifact(
  artifact: RhymeIndexArtifact,
): artifact is CompactRhymeIndexArtifact {
  return 'words' in artifact;
}

function expandCompactArtifactLexemes(
  artifact: CompactRhymeIndexArtifact,
): RhymeArtifactLexeme[] {
  return artifact.words.map(
    ([normalizedWord, pronunciationStart, pronunciationCount]) => {
      const pronunciations = artifact.pronunciations
        .slice(pronunciationStart, pronunciationStart + pronunciationCount)
        .map(([phoneIds, rhymeTailIndex]) => ({
          phones: phoneIds.map((phoneId) => {
            const phone = artifact.phoneInventory[phoneId];

            if (phone === undefined) {
              throw new TypeError(`missing phone inventory id ${phoneId}`);
            }

            return phone;
          }),
          rhymeTail:
            rhymeTailIndex === null
              ? null
              : splitRhymeTail(getTailKey(artifact, rhymeTailIndex)),
        }));

      return {
        normalizedWord,
        pronunciations,
        word: normalizedWord,
      };
    },
  );
}

function getTailKey(
  artifact: CompactRhymeIndexArtifact,
  rhymeTailIndex: number,
) {
  const tailKey = artifact.tails[rhymeTailIndex];

  if (tailKey === undefined) {
    throw new TypeError(`missing rhyme-tail id ${rhymeTailIndex}`);
  }

  return tailKey;
}

function splitRhymeTail(rhymeTailKey: string): readonly string[] {
  return rhymeTailKey.split(' ');
}

function assertCompactArtifactTables(
  artifactObject: Record<string, unknown>,
): asserts artifactObject is CompactRhymeIndexArtifact {
  asObject(artifactObject.build, 'artifact.build');
  assertStringArray(artifactObject.phoneInventory, 'artifact.phoneInventory');
  assertStringArray(artifactObject.tails, 'artifact.tails');
  assertWordTuples(artifactObject.words);
  assertPronunciationTuples(artifactObject.pronunciations);
}

function assertArtifactLexemes(
  lexemes: unknown,
): asserts lexemes is readonly RhymeArtifactLexeme[] {
  if (!Array.isArray(lexemes)) {
    throw new TypeError('rhyme artifact lexemes must be an array');
  }

  for (const [lexemeIndex, lexeme] of lexemes.entries()) {
    const lexemeObject = asObject(
      lexeme,
      `rhyme artifact lexemes[${lexemeIndex}]`,
    );
    assertString(lexemeObject.word, `lexemes[${lexemeIndex}].word`);
    assertString(
      lexemeObject.normalizedWord,
      `lexemes[${lexemeIndex}].normalizedWord`,
    );

    if (!Array.isArray(lexemeObject.pronunciations)) {
      throw new TypeError(
        `lexemes[${lexemeIndex}].pronunciations must be an array`,
      );
    }

    for (const [
      pronunciationIndex,
      pronunciation,
    ] of lexemeObject.pronunciations.entries()) {
      const pronunciationObject = asObject(
        pronunciation,
        `lexemes[${lexemeIndex}].pronunciations[${pronunciationIndex}]`,
      );
      assertStringArray(
        pronunciationObject.phones,
        `lexemes[${lexemeIndex}].pronunciations[${pronunciationIndex}].phones`,
      );
      assertStringArrayOrNull(
        pronunciationObject.rhymeTail,
        `lexemes[${lexemeIndex}].pronunciations[${pronunciationIndex}].rhymeTail`,
      );
    }
  }
}

function assertWordTuples(
  value: unknown,
): asserts value is readonly RhymeArtifactWordTuple[] {
  if (!Array.isArray(value)) {
    throw new TypeError('artifact.words must be an array');
  }

  for (const [index, word] of value.entries()) {
    if (
      !Array.isArray(word) ||
      word.length !== 3 ||
      typeof word[0] !== 'string' ||
      !isNonNegativeInteger(word[1]) ||
      !isNonNegativeInteger(word[2])
    ) {
      throw new TypeError(
        `artifact.words[${index}] must be [string, number, number]`,
      );
    }
  }
}

function assertPronunciationTuples(
  value: unknown,
): asserts value is readonly RhymeArtifactPronunciationTuple[] {
  if (!Array.isArray(value)) {
    throw new TypeError('artifact.pronunciations must be an array');
  }

  for (const [index, pronunciation] of value.entries()) {
    if (
      !Array.isArray(pronunciation) ||
      pronunciation.length !== 2 ||
      !isNumberArray(pronunciation[0]) ||
      !isNullableNonNegativeInteger(pronunciation[1])
    ) {
      throw new TypeError(
        `artifact.pronunciations[${index}] must be [number[], number | null]`,
      );
    }
  }
}

function asObject(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }

  return value as Record<string, unknown>;
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string`);
  }
}

function assertStringArray(
  value: unknown,
  name: string,
): asserts value is readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new TypeError(`${name} must be a string array`);
  }
}

function assertStringArrayOrNull(
  value: unknown,
  name: string,
): asserts value is readonly string[] | null {
  if (value === null) {
    return;
  }

  assertStringArray(value, name);
}

function isNumberArray(value: unknown): value is readonly number[] {
  return Array.isArray(value) && value.every(isNonNegativeInteger);
}

function isNullableNonNegativeInteger(value: unknown): value is number | null {
  return value === null || isNonNegativeInteger(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}
