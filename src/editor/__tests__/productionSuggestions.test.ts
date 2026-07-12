/// <reference types="jest" />

import type { SuggestionContext } from '../bridge';
import {
  createProductionSuggestionSession,
  getSuggestionTransitionDuration,
} from '../productionSuggestions';
import type {
  RhymeEngine,
  RhymeEngineQuery,
  RhymeSuggestion,
} from '../../rhyme/RhymeEngine';
import type { RhymeEngineRuntimeSnapshot } from '../../rhymeData/rhymeEngineRuntime';

function context(overrides: Partial<SuggestionContext> = {}): SuggestionContext {
  return {
    currentLineText: 'hold the night br',
    previousToken: 'night',
    selectionEmpty: true,
    wordBeforeCursor: 'br',
    ...overrides,
  };
}

function candidate(
  word: string,
  kind: RhymeSuggestion['kind'] = 'exact',
  score = 1,
): RhymeSuggestion {
  return {
    familyKey: 'AY1 T',
    id: `rhyme:${kind}:${word}`,
    kind,
    label: `${kind === 'exact' ? 'Perfect' : 'Near'} ${word}`,
    matchedSyllables: 1,
    normalizedWord: word,
    score,
    word,
  };
}

const ready: RhymeEngineRuntimeSnapshot = {
  state: 'ready',
  usingLastKnownGood: false,
  version: 'production-v2',
};

describe('production suggestion session', () => {
  it('keeps the completed anchor cache stable while filtering partial prefixes cheaply', () => {
    const suggest = jest.fn((_query: RhymeEngineQuery) => [
      candidate('bright'),
      candidate('flight'),
      candidate('sight'),
    ]);
    const session = createSession({ suggest });

    expect(session.getView(context(), 'hold the night br', ready).suggestions.map(({ word }) => word))
      .toEqual(['bright']);
    expect(session.getView(context({ wordBeforeCursor: 'bri' }), 'hold the night bri', ready)
      .suggestions.map(({ word }) => word)).toEqual(['bright']);
    expect(session.getView(context({ wordBeforeCursor: 'zz' }), 'hold the night zz', ready)
      .suggestions.map(({ word }) => word)).toEqual(['bright', 'flight', 'sight']);
    expect(suggest).toHaveBeenCalledTimes(1);
    expect(suggest).toHaveBeenCalledWith(expect.objectContaining({
      anchor: 'night',
      maxResults: expect.any(Number),
      sourceTokens: ['hold', 'the', 'night'],
    }));
  });

  it('refreshes repetition context without retaining or exposing lyric text', () => {
    const suggest = jest.fn((query: RhymeEngineQuery) =>
      query.sourceTokens?.includes('flight')
        ? [candidate('sight'), candidate('flight')]
        : [candidate('flight'), candidate('sight')],
    );
    const session = createSession({ suggest });

    expect(session.getView(context({ wordBeforeCursor: '' }), 'hold the night ', ready)
      .suggestions[0]?.word).toBe('flight');
    expect(session.getView(context({ wordBeforeCursor: '' }), 'flight holds the night ', ready)
      .suggestions[0]?.word).toBe('sight');
    expect(JSON.stringify(session)).not.toContain('flight holds the night');
  });

  it('returns no more than eight engine-ranked results without fallback padding', () => {
    const candidates = Array.from({ length: 12 }, (_, index) =>
      candidate(`word${index}`, index % 2 === 0 ? 'exact' : 'slant', 1 - index / 100),
    );
    const session = createSession({ suggest: () => candidates });

    const view = session.getView(context({ wordBeforeCursor: '' }), 'hold the night ', ready);
    expect(view.kind).toBe('results');
    expect(view.suggestions).toHaveLength(8);
    expect(view.suggestions.map(({ word }) => word)).toEqual(
      candidates.slice(0, 8).map(({ word }) => word),
    );
  });

  it('admits proper names only for an explicit matching prefix and never admits safety blocks', () => {
    const eligible = jest.fn((word: string, prefix: string) =>
      word !== 'blocked' && (word !== 'atl' || prefix === 'at'),
    );
    const session = createSession({
      isSuggestionEligible: eligible,
      suggest: () => [candidate('atl'), candidate('blocked'), candidate('battle')],
    });

    expect(session.getView(context({ wordBeforeCursor: '' }), 'hold the night ', ready)
      .suggestions.map(({ word }) => word)).toEqual(['battle']);
    expect(session.getView(context({ wordBeforeCursor: 'at' }), 'hold the night at', ready)
      .suggestions.map(({ word }) => word)).toEqual(['atl']);
    expect(eligible).toHaveBeenCalledWith('blocked', 'at');
  });

  it('presents deterministic hidden, prompt, loading, unavailable, and retryable states', () => {
    const session = createSession({ suggest: () => [] });
    expect(session.getView(context({ selectionEmpty: false }), '', ready).kind).toBe('hidden');
    expect(session.getView(context({ previousToken: '', wordBeforeCursor: '' }), '', ready))
      .toMatchObject({ kind: 'prompt', message: 'Finish a word to see rhymes.' });
    expect(session.getView(context(), '', { ...ready, state: 'loading' }))
      .toMatchObject({ kind: 'loading', message: 'Preparing offline rhymes…' });
    expect(session.getView(context(), '', {
      errorMessage: 'corrupt artifact', state: 'error', usingLastKnownGood: false, version: 'v2',
    })).toMatchObject({ kind: 'error', message: 'Rhymes unavailable.', canRetry: true });
    expect(session.getView(context(), '', ready))
      .toMatchObject({ kind: 'unavailable', message: 'No strong rhymes yet.' });
  });

  it('uses only the accepted prompt-to-results crossfade and honors reduced motion', () => {
    expect(getSuggestionTransitionDuration('prompt', 'results', false)).toBe(180);
    expect(getSuggestionTransitionDuration('loading', 'results', false)).toBe(0);
    expect(getSuggestionTransitionDuration('prompt', 'results', true)).toBe(0);
  });

  it('invalidates the anchor cache only when the published engine version changes', () => {
    let result = candidate('flight');
    const suggest = jest.fn(() => [result]);
    const session = createSession({ suggest });
    expect(session.getView(context({ wordBeforeCursor: '' }), 'night ', ready)
      .suggestions[0]?.word).toBe('flight');
    result = candidate('sight');
    expect(session.getView(context({ wordBeforeCursor: '' }), 'night ', {
      ...ready,
      version: 'production-v3',
    }).suggestions[0]?.word).toBe('sight');
    expect(suggest).toHaveBeenCalledTimes(2);
  });

  it('presents candidate casing from the active prefix without changing its stable id', () => {
    const session = createSession({ suggest: () => [candidate('bright')] });
    expect(session.getView(context({ wordBeforeCursor: 'BR' }), 'night BR', ready)
      .suggestions).toEqual([
        expect.objectContaining({ id: 'rhyme:exact:bright', word: 'BRIGHT' }),
      ]);
  });
});

function createSession({
  isSuggestionEligible = () => true,
  suggest,
}: {
  isSuggestionEligible?: (normalizedWord: string, activePrefix: string) => boolean;
  suggest: RhymeEngine['suggest'];
}) {
  return createProductionSuggestionSession({
    engine: { suggest },
    isSuggestionEligible,
  });
}
