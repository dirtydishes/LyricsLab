import type { RhymeEngineRuntime, RhymeEngineRuntimeSnapshot } from '../rhymeData/rhymeEngineRuntime';

export type SyntheticRhymeRuntimeState = 'error' | 'loading' | null;

export function wrapDiagnosticsRuntime(production: RhymeEngineRuntime) {
  const listeners = new Set<() => void>();
  let syntheticState: SyntheticRhymeRuntimeState = null;
  production.subscribe(notify);

  const runtime: RhymeEngineRuntime = {
    engine: production.engine,
    cancel: production.cancel,
    getSnapshot() {
      const snapshot = production.getSnapshot();
      return syntheticState ? syntheticSnapshot(snapshot, syntheticState) : snapshot;
    },
    isSuggestionEligible: production.isSuggestionEligible,
    async retry() {
      syntheticState = null;
      notify();
      await production.retry();
    },
    start: production.start,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  function notify() {
    for (const listener of [...listeners]) {
      try { listener(); } catch { /* Diagnostics observers cannot alter runtime state. */ }
    }
  }

  return {
    createRuntime: () => runtime,
    setSyntheticState(next: SyntheticRhymeRuntimeState) {
      syntheticState = next;
      notify();
    },
  };
}

function syntheticSnapshot(snapshot: RhymeEngineRuntimeSnapshot, state: Exclude<SyntheticRhymeRuntimeState, null>): RhymeEngineRuntimeSnapshot {
  return state === 'loading'
    ? { state, usingLastKnownGood: false, version: snapshot.version }
    : { errorMessage: 'Injected diagnostics-only load failure.', state, usingLastKnownGood: false, version: snapshot.version };
}
