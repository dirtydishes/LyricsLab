/// <reference types="jest" />

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

describe('Phase 03 runtime boundary', () => {
  it('keeps the shipped editor provider on the legacy seam until Phase 05', () => {
    const provider = readFileSync(path.join(process.cwd(), 'src/editor/bundledSuggestionProvider.ts'), 'utf8');
    expect(provider).toContain('createLegacyRhymeEngineAdapter');
    expect(provider).not.toContain('rhymeData');
    expect(provider).not.toContain('fixture.rhymebin');
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

  it('does not activate the fixture runtime from normal app or editor source', () => {
    const roots = ['app', 'src/editor'].map((root) => path.join(process.cwd(), root));
    for (const root of roots) {
      for (const file of listTypeScriptFiles(root)) {
        const source = readFileSync(file, 'utf8');
        expect(source).not.toMatch(
          /(?:rhymeData|createExpoRhymeEngineRuntime|fixture\.rhymebin)/u,
        );
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
