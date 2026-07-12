import { parseCmuDictionary } from './cmuParser';
import {
  createDiagnosticRhymeEngine,
  type DiagnosticRhymeEngine,
  type RhymeLexemeInput,
} from './createRhymeEngine';

export type { DiagnosticRhymeEngine, RhymeLexemeInput };

export type RhymeEngineLexemeMetadata = {
  readonly commonness?: number;
  readonly lemma?: string;
};

export function createFixtureRhymeEngineFromCmu(
  source: string,
  metadata: Readonly<Record<string, RhymeEngineLexemeMetadata>> = {},
) {
  const lexemesByWord = new Map<string, RhymeLexemeInput>();

  for (const entry of parseCmuDictionary(source)) {
    const lexemeMetadata = metadata[entry.normalizedWord];
    const existing = lexemesByWord.get(entry.normalizedWord);
    const pronunciation = { phones: entry.phonemes };

    lexemesByWord.set(entry.normalizedWord, {
      commonness: lexemeMetadata?.commonness ?? existing?.commonness,
      lemma: lexemeMetadata?.lemma ?? existing?.lemma,
      normalizedWord: entry.normalizedWord,
      pronunciations: [...(existing?.pronunciations ?? []), pronunciation],
      word: existing?.word ?? entry.normalizedWord,
    });
  }

  return createDiagnosticRhymeEngine([...lexemesByWord.values()]);
}
