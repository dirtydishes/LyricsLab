/// <reference types="jest" />

import fs from 'node:fs';
import path from 'node:path';

const CORE_ENTRY_FILES = [
  'RhymeEngine.ts',
  'createRhymeEngine.ts',
  'legacyRhymeEngineAdapter.ts',
  'rhymeEngineTesting.ts',
] as const;

const IMPORT_PATTERN =
  /(?:from\s+|import\s*\(|import\s+|require\s*\()\s*['"]([^'"]+)['"]/gu;

describe('production rhyme core boundary', () => {
  it('has no UI, persistence, platform, network, or large-dataset imports', () => {
    const forbiddenImports = [
      'react',
      'react-native',
      'webview',
      'sqlite',
      'expo',
      'fetch',
      'axios',
      'generated/cmuRhymeArtifact',
    ];

    const coreDirectory = path.join(__dirname, '..');
    const importGraph = collectImportGraph(
      CORE_ENTRY_FILES.map((file) => path.join(coreDirectory, file)),
    );

    for (const [file, imports] of importGraph) {
      const normalizedImports = imports.map((moduleName) =>
        moduleName.toLowerCase(),
      );

      for (const forbiddenImport of forbiddenImports) {
        const matchingImports = normalizedImports.filter((moduleName) =>
          moduleName.includes(forbiddenImport.toLowerCase()),
        );

        expect({
          file: path.relative(coreDirectory, file),
          matchingImports,
        }).toEqual({
          file: path.relative(coreDirectory, file),
          matchingImports: [],
        });
      }
    }
  });
});

function collectImportGraph(entryFiles: readonly string[]) {
  const graph = new Map<string, readonly string[]>();
  const pending = [...entryFiles];

  while (pending.length > 0) {
    const file = pending.pop();

    if (!file || graph.has(file)) {
      continue;
    }

    const source = fs.readFileSync(file, 'utf8');
    const imports = [...source.matchAll(IMPORT_PATTERN)].flatMap(
      ([, moduleName]) => (moduleName ? [moduleName] : []),
    );
    graph.set(file, imports);

    for (const moduleName of imports) {
      if (!moduleName.startsWith('.')) {
        continue;
      }

      const importedFile = resolveTypeScriptModule(file, moduleName);

      if (importedFile) {
        pending.push(importedFile);
      }
    }
  }

  return graph;
}

function resolveTypeScriptModule(fromFile: string, moduleName: string) {
  const modulePath = path.resolve(path.dirname(fromFile), moduleName);
  const candidates = [`${modulePath}.ts`, path.join(modulePath, 'index.ts')];

  return candidates.find((candidate) => fs.existsSync(candidate));
}
