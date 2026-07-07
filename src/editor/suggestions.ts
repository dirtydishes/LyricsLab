import type { SuggestionContext } from './bridge';

export type WordSuggestion = {
  id: string;
  label?: string;
  word: string;
};

export type SuggestionProvider = {
  getSuggestions(context: SuggestionContext | null): WordSuggestion[];
};

const DEFAULT_WORDS = [
  'again',
  'alive',
  'bars',
  'beat',
  'breath',
  'city',
  'dream',
  'drift',
  'fire',
  'flow',
  'gold',
  'hook',
  'late',
  'light',
  'line',
  'mind',
  'move',
  'night',
  'paper',
  'rise',
  'room',
  'shine',
  'truth',
  'voice',
] as const;

const FOLLOW_UP_WORDS: Record<string, readonly string[]> = {
  a: ['dream', 'line', 'hook', 'voice'],
  and: ['again', 'alive', 'moving', 'breathing'],
  in: ['motion', 'silence', 'rhythm', 'time'],
  my: ['mind', 'heart', 'city', 'voice'],
  no: ['sleep', 'fear', 'limits', 'doubt'],
  on: ['fire', 'stage', 'time', 'sight'],
  the: ['night', 'city', 'room', 'light'],
  with: ['purpose', 'patience', 'pressure', 'grace'],
} as const;

const MAX_SUGGESTIONS = 12;

export const staticSuggestionProvider: SuggestionProvider = {
  getSuggestions(context) {
    return getWordSuggestions(context);
  },
};

export function getWordSuggestions(
  context: SuggestionContext | null,
  maxSuggestions = MAX_SUGGESTIONS,
): WordSuggestion[] {
  const previousToken = normalizeToken(context?.previousToken ?? '');
  const activeWord = normalizeToken(context?.wordBeforeCursor ?? '');
  const contextualWords = previousToken ? FOLLOW_UP_WORDS[previousToken] : [];
  const words = uniqueWords([...(contextualWords ?? []), ...DEFAULT_WORDS]);
  const blockedWords = new Set([previousToken, activeWord].filter(Boolean));

  return words
    .filter((word) => !blockedWords.has(normalizeToken(word)))
    .slice(0, maxSuggestions)
    .map((word) => ({
      id: `word:${normalizeToken(word)}`,
      word,
    }));
}

function uniqueWords(words: readonly string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const word of words) {
    const normalizedWord = normalizeToken(word);

    if (!normalizedWord || seen.has(normalizedWord)) {
      continue;
    }

    seen.add(normalizedWord);
    unique.push(word);
  }

  return unique;
}

function normalizeToken(token: string) {
  return token.trim().toLowerCase();
}
