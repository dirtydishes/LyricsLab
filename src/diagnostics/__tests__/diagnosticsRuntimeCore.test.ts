import { wrapDiagnosticsRuntime } from '../diagnosticsRuntimeCore';
import type { RhymeEngineRuntime, RhymeEngineRuntimeSnapshot } from '../../rhymeData/rhymeEngineRuntime';

describe('diagnostics runtime wrapper', () => {
  it('injects loading and failure states without replacing the production engine, then clears them on retry', async () => {
    let snapshot: RhymeEngineRuntimeSnapshot = { state: 'ready', usingLastKnownGood: false, version: 'production-v1' };
    const productionListeners = new Set<() => void>();
    const retry = jest.fn(async () => {});
    const production: RhymeEngineRuntime = {
      engine: { suggest: jest.fn(() => []) }, cancel: jest.fn(), getSnapshot: () => snapshot,
      isSuggestionEligible: jest.fn(() => true), retry, start: jest.fn(),
      subscribe(listener) { productionListeners.add(listener); return () => productionListeners.delete(listener); },
    };
    const diagnostics = wrapDiagnosticsRuntime(production);
    const runtime = diagnostics.createRuntime();
    const listener = jest.fn();
    runtime.subscribe(listener);

    expect(runtime.engine).toBe(production.engine);
    diagnostics.setSyntheticState('loading');
    expect(runtime.getSnapshot()).toEqual({ state: 'loading', usingLastKnownGood: false, version: 'production-v1' });
    diagnostics.setSyntheticState('error');
    expect(runtime.getSnapshot()).toEqual({ errorMessage: 'Injected diagnostics-only load failure.', state: 'error', usingLastKnownGood: false, version: 'production-v1' });
    await runtime.retry();
    expect(retry).toHaveBeenCalledTimes(1);
    expect(runtime.getSnapshot()).toBe(snapshot);

    snapshot = { state: 'loading', usingLastKnownGood: true, version: 'production-v1' };
    for (const notify of productionListeners) notify();
    expect(listener).toHaveBeenCalledTimes(4);
  });
});
