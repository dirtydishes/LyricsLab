/// <reference types="jest" />

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

describe('Phase 03 runtime boundary', () => {
  it('keeps the shipped editor provider on the legacy seam until Phase 05', () => {
    const provider = readFileSync(path.join(process.cwd(), 'src/editor/bundledSuggestionProvider.ts'), 'utf8');
    expect(provider).toContain('createLegacyRhymeEngineAdapter');
    expect(provider).not.toContain('rhymeData');
    expect(provider).not.toContain('fixture.rhymebin');
    expect(provider).not.toContain('production.rhymebin');
  });

  it('keeps platform dependencies in the dormant Expo adapter only', () => {
    const decoder = readFileSync(path.join(process.cwd(), 'src/rhymeData/decodeRhymeData.ts'), 'utf8');
    const runtime = readFileSync(path.join(process.cwd(), 'src/rhymeData/rhymeEngineRuntime.ts'), 'utf8');
    const adapter = readFileSync(path.join(process.cwd(), 'src/platform/createExpoRhymeEngineRuntime.ts'), 'utf8');
    for (const source of [decoder, runtime]) {
      expect(source).not.toMatch(/expo-|react-native|sqlite|fetch\s*\(|cmuRhymeArtifact/u);
    }
    expect(adapter).toContain("from 'expo-asset'");
    expect(adapter).toContain("from 'expo-file-system'");
    expect(adapter).toContain('Asset.fromModule(moduleId)');
    expect(adapter).toContain('downloadAsync()');
    expect(adapter).toContain('FileMode.ReadOnly');
    expect(adapter).toContain('readBytes(maxBytes)');
    expect(adapter).not.toContain('Asset.fromURI');
    expect(adapter).not.toMatch(/fetch\s*\(|expo-sqlite/u);
  });

  it('keeps every generic runtime module free of platform, storage, network, and editor imports', () => {
    const runtimeRoot = path.join(process.cwd(), 'src/rhymeData');
    const forbidden = [
      'cmuParser',
      'cmuRhymeArtifact',
      'defaultCmuIndex',
      'expo-',
      'react',
      'react-native',
      'sqlite',
      '/editor/',
    ];

    for (const file of listTypeScriptFiles(runtimeRoot)) {
      const source = readFileSync(file, 'utf8');
      for (const specifier of extractModuleSpecifiers(source)) {
        for (const token of forbidden) {
          expect({ file: path.relative(runtimeRoot, file), matchingImport: specifier.includes(token) })
            .toEqual({ file: path.relative(runtimeRoot, file), matchingImport: false });
        }
      }
      expect(source).not.toMatch(/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/u);
    }
  });

  it('does not transitively activate fixture or production runtimes from app, editor, or settings value imports', () => {
    const entryRoots = ['app', 'src/editor', 'src/settings']
      .map((root) => path.join(process.cwd(), root));
    const forbiddenRuntimeTargets = [
      path.join(process.cwd(), 'src/platform/createExpoRhymeEngineRuntime.ts'),
      path.join(process.cwd(), 'src/platform/createProductionRhymeEngineRuntime.ts'),
      path.join(process.cwd(), 'src/rhymeData/decodeRhymeData.ts'),
      path.join(process.cwd(), 'src/rhymeData/rhymeEngineRuntime.ts'),
    ];
    const forbiddenAssetSpecifiers = [
      'fixture.rhymebin',
      'production.rhymebin',
    ];

    for (const root of entryRoots) {
      for (const file of listTypeScriptFiles(root)) {
        const visited = collectValueImportGraph(file);
        for (const target of forbiddenRuntimeTargets) {
          expect({
            entry: path.relative(process.cwd(), file),
            target: path.relative(process.cwd(), target),
            reachesTarget: visited.has(target),
          }).toEqual({
            entry: path.relative(process.cwd(), file),
            target: path.relative(process.cwd(), target),
            reachesTarget: false,
          });
        }
        for (const source of [...visited, file].map((candidate) => readFileSync(candidate, 'utf8'))) {
          for (const specifier of extractValueModuleSpecifiers(source)) {
            expect(
              forbiddenAssetSpecifiers.some((asset) => specifier.includes(asset)),
            ).toBe(false);
          }
        }
      }
    }
  });
});

function listTypeScriptFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    if (entry === '__tests__') continue;
    const entryPath = path.join(root, entry);
    if (statSync(entryPath).isDirectory()) {
      files.push(...listTypeScriptFiles(entryPath));
    } else if (/\.tsx?$/u.test(entry)) {
      files.push(entryPath);
    }
  }
  return files;
}

function extractModuleSpecifiers(source: string) {
  return [...source.matchAll(/(?:from\s+|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/gu)]
    .map(([, specifier]) => specifier);
}

function collectValueImportGraph(entry: string): ReadonlySet<string> {
  const visited = new Set<string>();
  const pending = [entry];

  while (pending.length > 0) {
    const file = pending.pop()!;
    const source = readFileSync(file, 'utf8');
    for (const specifier of extractValueModuleSpecifiers(source)) {
      const resolved = resolveRelativeTypeScriptImport(file, specifier);
      if (resolved && !visited.has(resolved)) {
        visited.add(resolved);
        pending.push(resolved);
      }
    }
  }

  return visited;
}

function extractValueModuleSpecifiers(source: string) {
  return [
    ...[...source.matchAll(/import\s+(?!type\b)(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/gu)]
      .map(([, specifier]) => specifier),
    ...[...source.matchAll(/(?:import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/gu)]
      .map(([, specifier]) => specifier),
  ];
}

function resolveRelativeTypeScriptImport(importer: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(importer), specifier);
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]) {
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // Try the next TypeScript resolution candidate.
    }
  }
  return null;
}
