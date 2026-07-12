import type { SuggestionContext } from './bridge';
import type { WordSuggestion } from './suggestions';
import { normalizeRhymeToken } from '../rhyme/normalize';
import type { RhymeEngine, RhymeSuggestion } from '../rhyme/RhymeEngine';

const MAX_VISIBLE_SUGGESTIONS = 8;
const CANDIDATE_WINDOW = 32;
const MAX_REPETITION_TOKENS = 4096;

export type ProductionSuggestionViewKind =
  | 'error'
  | 'hidden'
  | 'loading'
  | 'prompt'
  | 'results'
  | 'unavailable';

export type ProductionSuggestionView = {
  readonly canRetry: boolean;
  readonly kind: ProductionSuggestionViewKind;
  readonly message?: string;
  readonly suggestions: readonly WordSuggestion[];
};

export type SuggestionRuntimeSnapshot = {
  readonly errorMessage?: string;
  readonly state: 'error' | 'loading' | 'ready';
  readonly usingLastKnownGood: boolean;
  readonly version: string;
};

export type ProductionSuggestionSession = {
  getView(
    context: SuggestionContext | null,
    bodyText: string,
    runtime: SuggestionRuntimeSnapshot,
  ): ProductionSuggestionView;
};

type CreateProductionSuggestionSessionOptions = {
  readonly engine: RhymeEngine;
  readonly isSuggestionEligible?: (
    normalizedWord: string,
    activePrefix: string,
  ) => boolean;
};

export function createProductionSuggestionSession({
  engine,
  isSuggestionEligible = () => true,
}: CreateProductionSuggestionSessionOptions): ProductionSuggestionSession {
  let cachedCandidates: readonly RhymeSuggestion[] = [];
  let cachedQueryKey = '';

  return {
    getView(context, bodyText, runtime) {
      if (context?.selectionEmpty === false) {
        return view('hidden');
      }

      const anchor = normalizeRhymeToken(context?.previousToken ?? '');
      if (!anchor) {
        return view('prompt', 'Finish a word to see rhymes.');
      }

      if (runtime.state === 'loading' && !runtime.usingLastKnownGood) {
        return view('loading', 'Preparing offline rhymes…');
      }

      if (runtime.state === 'error' && !runtime.usingLastKnownGood) {
        return view('error', 'Rhymes unavailable.', true);
      }

      const activePrefix = normalizeRhymeToken(context?.wordBeforeCursor ?? '');
      const sourceTokens = getStableSourceTokens(bodyText, activePrefix);
      const excludedWords = getCompletedLineTokens(context, activePrefix);
      const queryKey = [
        runtime.version,
        anchor,
        ...sourceTokens,
        '|',
        ...excludedWords,
      ].join('\0');

      if (cachedQueryKey !== queryKey) {
        cachedCandidates = engine.suggest({
          anchor,
          excludedWords,
          maxResults: CANDIDATE_WINDOW,
          sourceTokens,
        });
        cachedQueryKey = queryKey;
      }

      const eligible = cachedCandidates.filter((candidate) =>
        isSuggestionEligible(candidate.normalizedWord, activePrefix),
      );
      const prefixMatches = activePrefix
        ? eligible.filter((candidate) =>
            normalizeRhymeToken(candidate.normalizedWord).startsWith(activePrefix),
          )
        : [];
      const selected = (prefixMatches.length > 0 ? prefixMatches : eligible)
        .slice(0, MAX_VISIBLE_SUGGESTIONS)
        .map((candidate) => toWordSuggestion(candidate, context?.wordBeforeCursor ?? ''));

      return selected.length > 0
        ? { canRetry: false, kind: 'results', suggestions: selected }
        : view('unavailable', 'No strong rhymes yet.');
    },
  };
}

export function getSuggestionTransitionDuration(
  previous: ProductionSuggestionViewKind,
  next: ProductionSuggestionViewKind,
  reduceMotion: boolean,
) {
  return !reduceMotion && previous === 'prompt' && next === 'results' ? 180 : 0;
}

function view(
  kind: ProductionSuggestionViewKind,
  message?: string,
  canRetry = false,
): ProductionSuggestionView {
  return { canRetry, kind, message, suggestions: [] };
}

function getStableSourceTokens(bodyText: string, activePrefix: string) {
  const tokens = tokenize(bodyText);
  if (activePrefix && !/\s$/u.test(bodyText)) {
    tokens.pop();
  }
  return [...new Set(tokens)].slice(0, MAX_REPETITION_TOKENS);
}

function getCompletedLineTokens(
  context: SuggestionContext | null,
  activePrefix: string,
) {
  const tokens = tokenize(context?.currentLineText ?? '');
  if (activePrefix && !/\s$/u.test(context?.currentLineText ?? '')) {
    tokens.pop();
  }
  return tokens;
}

function tokenize(value: string) {
  return value
    .split(/\s+/u)
    .map(normalizeRhymeToken)
    .filter(Boolean);
}

function toWordSuggestion(
  candidate: RhymeSuggestion,
  activePrefix: string,
): WordSuggestion {
  return {
    id: candidate.id,
    label: candidate.label,
    word: applyPrefixCasing(candidate.word, activePrefix),
  };
}

function applyPrefixCasing(word: string, prefix: string) {
  const letters = prefix.replace(/[^\p{L}]/gu, '');
  if (letters.length > 1 && letters === letters.toLocaleUpperCase()) {
    return word.toLocaleUpperCase();
  }
  const first = letters.at(0);
  const rest = letters.slice(1);
  return first && first === first.toLocaleUpperCase() && rest === rest.toLocaleLowerCase()
    ? `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`
    : word;
}
