import { createProductionRhymeEngineRuntime } from '../platform/createProductionRhymeEngineRuntime';
import { wrapDiagnosticsRuntime } from './diagnosticsRuntimeCore';

export const diagnosticsRuntime = wrapDiagnosticsRuntime(
  createProductionRhymeEngineRuntime(),
);
