import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';

import type { SuggestionContext } from '../editor/bridge';
import {
  createProductionSuggestionSession,
  type ProductionSuggestionView,
} from '../editor/productionSuggestions';
import type {
  RhymeEngineRuntime,
  RhymeEngineRuntimeSnapshot,
} from '../rhymeData/rhymeEngineRuntime';
import { createProductionRhymeEngineRuntime } from './createProductionRhymeEngineRuntime';

type ProductionRhymeContextValue = {
  getSuggestionView(
    context: SuggestionContext | null,
    bodyText: string,
  ): ProductionSuggestionView;
  retry(): Promise<void>;
  snapshot: RhymeEngineRuntimeSnapshot;
};

type ProductionRhymeProviderProps = PropsWithChildren<{
  createRuntime?: () => RhymeEngineRuntime;
}>;

const ProductionRhymeContext =
  createContext<ProductionRhymeContextValue | null>(null);

export function ProductionRhymeProvider({
  children,
  createRuntime = createProductionRhymeEngineRuntime,
}: ProductionRhymeProviderProps) {
  const runtime = useMemo(() => createRuntime(), [createRuntime]);
  const snapshot = useSyncExternalStore(
    runtime.subscribe,
    runtime.getSnapshot,
    runtime.getSnapshot,
  );
  const session = useMemo(
    () =>
      createProductionSuggestionSession({
        engine: runtime.engine,
        isSuggestionEligible: runtime.isSuggestionEligible,
      }),
    [runtime],
  );

  useEffect(() => {
    runtime.start();
    return runtime.cancel;
  }, [runtime]);

  const getSuggestionView = useCallback(
    (context: SuggestionContext | null, bodyText: string) =>
      session.getView(context, bodyText, snapshot),
    [session, snapshot],
  );
  const value = useMemo<ProductionRhymeContextValue>(
    () => ({
      getSuggestionView,
      retry: runtime.retry,
      snapshot,
    }),
    [getSuggestionView, runtime.retry, snapshot],
  );

  return (
    <ProductionRhymeContext.Provider value={value}>
      {children}
    </ProductionRhymeContext.Provider>
  );
}

export function useProductionRhyme() {
  const value = useContext(ProductionRhymeContext);
  if (!value) throw new Error('Production rhyme runtime is not available');
  return value;
}
