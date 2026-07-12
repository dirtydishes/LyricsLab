import { getBundledCmuRhymeIndex } from '../rhyme/defaultCmuIndex';
import { createLegacyRhymeEngineAdapter } from '../rhyme/legacyRhymeEngineAdapter';
import { createRhymeSuggestionProvider } from './suggestions';

export const bundledSuggestionProvider =
  createRhymeSuggestionProvider(
    createLegacyRhymeEngineAdapter(getBundledCmuRhymeIndex),
  );
