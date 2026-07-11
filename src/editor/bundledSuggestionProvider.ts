import { getBundledCmuRhymeIndex } from '../rhyme/defaultCmuIndex';
import { createRhymeSuggestionProvider } from './suggestions';

export const bundledSuggestionProvider =
  createRhymeSuggestionProvider(getBundledCmuRhymeIndex);
