import type { SuggestionContext } from './bridge';
import type { WordSuggestion } from './suggestions';
import { normalizeRhymeToken } from '../rhyme/normalize';
import type { RhymeEngine, RhymeSuggestion } from '../rhyme/RhymeEngine';

const MAX_VISIBLE_SUGGESTIONS = 8;
const CANDIDATE_WINDOW = 32;
const MAX_REPETITION_TOKENS = 4096;
const MAX_REPETITION_TEXT_LENGTH = 256 * 1024;

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
  let cachedContextKey = '';
  let cachedRepetitionKey = '';

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
      const excludedWords = getCompletedLineTokens(context, activePrefix);
      const contextKey = [
        runtime.version,
        anchor,
        ...excludedWords,
      ].join('\0');

      // A partial-word edit leaves the completed line context unchanged, so
      // it can reuse the anchor query without rescanning bodyText. With no
      // active prefix, refresh the bounded repetition snapshot so completed
      // edits elsewhere in the song remain current.
      if (cachedContextKey !== contextKey || !activePrefix) {
        const sourceTokens = getStableSourceTokens(bodyText, activePrefix);
        const repetitionKey = sourceTokens.join('\0');
        if (
          cachedContextKey !== contextKey ||
          cachedRepetitionKey !== repetitionKey
        ) {
          cachedCandidates = engine.suggest({
            anchor,
            excludedWords,
            maxResults: CANDIDATE_WINDOW,
            sourceTokens,
          });
          cachedContextKey = contextKey;
          cachedRepetitionKey = repetitionKey;
        }
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
  const tokens = tokenize(
    bodyText.slice(0, MAX_REPETITION_TEXT_LENGTH),
    MAX_REPETITION_TOKENS + 1,
  );
  if (activePrefix) {
    const activeTokenIndex = tokens.lastIndexOf(activePrefix);
    if (activeTokenIndex >= 0) tokens.splice(activeTokenIndex, 1);
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

function tokenize(value: string, maxTokens = Number.POSITIVE_INFINITY) {
  return value
    .split(/\s+/u)
    .map(normalizeRhymeToken)
    .filter(Boolean)
    .slice(0, maxTokens);
}

function toWordSuggestion(
  candidate: RhymeSuggestion,
  activePrefix: string,
): WordSuggestion {
  return {
    id: candidate.id,
    label: candidate.label,
    role: candidate.kind === 'exact' ? 'perfect' : 'near',
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
