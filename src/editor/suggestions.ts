import type { SuggestionContext } from './bridge';
import { normalizeRhymeToken } from '../rhyme/normalize';
import type { RhymeEngine, RhymeSuggestion } from '../rhyme/RhymeEngine';

export type WordSuggestion = {
  id: string;
  label?: string;
  word: string;
};

export type SuggestionProvider = {
  getSuggestions(context: SuggestionContext | null): WordSuggestion[];
};

export type RhymeSuggestionProviderOptions = {
  fallbackProvider?: SuggestionProvider;
  maxSuggestions?: number;
};

export type RhymeEngineSource = RhymeEngine | (() => RhymeEngine);

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
const MIN_ACTIVE_ANCHOR_LENGTH = 3;

export const staticSuggestionProvider: SuggestionProvider = {
  getSuggestions(context) {
    return getWordSuggestions(context);
  },
};

export function createRhymeSuggestionProvider(
  engineSource: RhymeEngineSource,
  options: RhymeSuggestionProviderOptions = {},
): SuggestionProvider {
  const maxSuggestions = normalizeMaxSuggestions(
    options.maxSuggestions ?? MAX_SUGGESTIONS,
  );
  const fallbackProvider = options.fallbackProvider ?? staticSuggestionProvider;

  return {
    getSuggestions(context) {
      if (maxSuggestions <= 0 || context?.selectionEmpty === false) {
        return [];
      }

      const anchors = getRhymeAnchors(context);

      if (anchors.length === 0) {
        return getFallbackSuggestions(fallbackProvider, context, maxSuggestions);
      }

      const engine = resolveRhymeEngine(engineSource);
      const activeWord = normalizeToken(context?.wordBeforeCursor ?? '');
      const excludedWords = getExcludedTokens(context);

      for (const anchor of anchors) {
        const candidates = engine.suggest({
          anchor,
          excludedWords,
        })
          .filter((candidate) => !isActiveWordCandidate(candidate, activeWord))
          .slice(0, maxSuggestions);

        if (candidates.length > 0) {
          return candidates.map(createRhymeSuggestion);
        }
      }

      return getFallbackSuggestions(fallbackProvider, context, maxSuggestions);
    },
  };
}

export function getWordSuggestions(
  context: SuggestionContext | null,
  maxSuggestions = MAX_SUGGESTIONS,
): WordSuggestion[] {
  maxSuggestions = normalizeMaxSuggestions(maxSuggestions);

  if (maxSuggestions <= 0 || context?.selectionEmpty === false) {
    return [];
  }

  const previousToken = normalizeToken(context?.previousToken ?? '');
  const activeWord = normalizeToken(context?.wordBeforeCursor ?? '');
  const contextualWords = previousToken ? FOLLOW_UP_WORDS[previousToken] : [];
  const words = uniqueWords([...(contextualWords ?? []), ...DEFAULT_WORDS]);
  const blockedWords = new Set(getExcludedTokens(context));

  return words
    .filter((word) => {
      const normalizedWord = normalizeToken(word);

      if (blockedWords.has(normalizedWord)) {
        return false;
      }

      return !activeWord || !normalizedWord.startsWith(activeWord);
    })
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

function getRhymeAnchors(context: SuggestionContext | null) {
  if (!context) {
    return [];
  }

  const previousToken = normalizeToken(context?.previousToken ?? '');
  const activeWord = normalizeToken(context?.wordBeforeCursor ?? '');

  return uniqueNormalizedTokens([
    previousToken,
    activeWord.length >= MIN_ACTIVE_ANCHOR_LENGTH ? activeWord : '',
  ]);
}

function getExcludedTokens(context: SuggestionContext | null) {
  return uniqueNormalizedTokens([
    ...getCurrentLineTokens(context),
    context?.previousToken ?? '',
    context?.wordBeforeCursor ?? '',
  ]);
}

function getCurrentLineTokens(context: SuggestionContext | null) {
  return (context?.currentLineText ?? '').split(/\s+/u);
}

function uniqueNormalizedTokens(tokens: readonly string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const token of tokens) {
    const normalizedToken = normalizeToken(token);

    if (!normalizedToken || seen.has(normalizedToken)) {
      continue;
    }

    seen.add(normalizedToken);
    unique.push(normalizedToken);
  }

  return unique;
}

function resolveRhymeEngine(engineSource: RhymeEngineSource) {
  return typeof engineSource === 'function' ? engineSource() : engineSource;
}

function getFallbackSuggestions(
  fallbackProvider: SuggestionProvider,
  context: SuggestionContext | null,
  maxSuggestions: number,
) {
  return fallbackProvider.getSuggestions(context).slice(0, maxSuggestions);
}

function createRhymeSuggestion(candidate: RhymeSuggestion) {
  const suggestion: WordSuggestion = {
    id: candidate.id,
    word: candidate.word,
  };

  const label = getWordInclusiveLabel(candidate);

  if (label) {
    suggestion.label = label;
  }

  return suggestion;
}

function isActiveWordCandidate(
  candidate: RhymeSuggestion,
  activeWord: string,
) {
  return Boolean(
    activeWord && getCandidateNormalizedWord(candidate).startsWith(activeWord),
  );
}

function getCandidateNormalizedWord(candidate: RhymeSuggestion) {
  return normalizeToken(candidate.normalizedWord);
}

function getWordInclusiveLabel(candidate: RhymeSuggestion) {
  const label = candidate.label?.trim();

  if (!label) {
    return undefined;
  }

  const normalizedWord = getCandidateNormalizedWord(candidate);
  const includesWord = label
    .split(/\s+/u)
    .map(normalizeToken)
    .includes(normalizedWord);

  return includesWord ? label : undefined;
}

function normalizeMaxSuggestions(maxSuggestions: number) {
  if (!Number.isFinite(maxSuggestions)) {
    return 0;
  }

  return Math.max(0, Math.floor(maxSuggestions));
}

function normalizeToken(token: string) {
  return normalizeRhymeToken(token);
}
