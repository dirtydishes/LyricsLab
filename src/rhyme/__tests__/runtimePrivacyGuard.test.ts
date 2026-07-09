/// <reference types="jest" />

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

const RHYME_RUNTIME_ROOT = join(__dirname, '..');
const SENSITIVE_LYRIC_TOKEN = 'privatehook';
const SENSITIVE_LYRIC_CONTENT = 'privatehook never leaves this test';

const FORBIDDEN_RUNTIME_MODULES = [
  '../../editor/EditorWebView',
  '../../editor/LyricsEditorScreen',
  '../../editor/SuggestionBar',
  '../../editor/bridge',
  '../../editor/suggestions',
  '../../songs/expoSQLiteSongStore',
  'expo-sqlite',
  'fs',
  'fs/promises',
  'http',
  'https',
  'net',
  'node:fs',
  'node:fs/promises',
  'node:http',
  'node:https',
  'node:net',
  'node:tls',
  'react',
  'react-native',
  'react-native-webview',
  'tls',
] as const;

const FORBIDDEN_RUNTIME_GLOBALS = [
  'EventSource',
  'WebSocket',
  'XMLHttpRequest',
  'fetch',
] as const;

const CONSOLE_METHODS = [
  'debug',
  'error',
  'info',
  'log',
  'trace',
  'warn',
] as const;

describe('rhyme artifact runtime privacy guard', () => {
  afterEach(() => {
    for (const moduleName of FORBIDDEN_RUNTIME_MODULES) {
      jest.dontMock(moduleName);
    }

    jest.resetModules();
  });

  it('keeps src/rhyme runtime source free of forbidden imports and side channels', () => {
    const failures: string[] = [];

    for (const filePath of listRuntimeSourceFiles(RHYME_RUNTIME_ROOT)) {
      const source = readFileSync(filePath, 'utf8');
      const testPath = relative(RHYME_RUNTIME_ROOT, filePath);

      for (const specifier of extractModuleSpecifiers(source)) {
        const reason = classifyForbiddenImport(specifier);

        if (reason) {
          failures.push(`${testPath}: ${reason} import "${specifier}"`);
        }
      }

      for (const match of source.matchAll(
        /\bconsole\.(?:debug|error|info|log|trace|warn)\b/g,
      )) {
        failures.push(`${testPath}: console call "${match[0]}"`);
      }

      for (const match of source.matchAll(
        /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/g,
      )) {
        failures.push(`${testPath}: network global "${match[0]}"`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('loads and queries artifacts without editor/native/sqlite/fs/network access or lyric logging', () => {
    jest.isolateModules(() => {
      for (const moduleName of FORBIDDEN_RUNTIME_MODULES) {
        mockForbiddenDependency(moduleName);
      }

      const restoreGlobals = installForbiddenRuntimeGlobals();
      const consoleSpies = spyOnConsole();

      try {
        const {
          findExactRhymeCandidates,
          loadRhymeIndexFromArtifact,
          RHYME_INDEX_ARTIFACT_FORMAT,
        } = jest.requireActual<typeof import('../index')>('../index');

        const index = loadRhymeIndexFromArtifact({
          format: RHYME_INDEX_ARTIFACT_FORMAT,
          version: 1,
          lexemes: [
            {
              normalizedWord: SENSITIVE_LYRIC_TOKEN,
              pronunciations: [
                {
                  phones: ['P', 'R', 'AY1', 'V', 'AH0', 'T', 'HH', 'UH1', 'K'],
                  rhymeTail: ['UH1', 'K'],
                },
              ],
              word: SENSITIVE_LYRIC_TOKEN,
            },
            {
              normalizedWord: 'hook',
              pronunciations: [
                {
                  phones: ['HH', 'UH1', 'K'],
                  rhymeTail: ['UH1', 'K'],
                },
              ],
              word: 'hook',
            },
          ],
        });

        expect(
          findExactRhymeCandidates(index, {
            anchor: SENSITIVE_LYRIC_TOKEN,
            excludedWords: [SENSITIVE_LYRIC_CONTENT],
          }),
        ).toEqual([
          {
            id: 'rhyme:exact:hook',
            kind: 'exact',
            normalizedWord: 'hook',
            rhymeTailKey: 'UH1 K',
            score: 1,
            slantSimilarity: null,
            word: 'hook',
          },
        ]);

        for (const spy of consoleSpies) {
          expect(spy).not.toHaveBeenCalled();
        }
      } finally {
        restoreGlobals();

        for (const spy of consoleSpies) {
          spy.mockRestore();
        }
      }
    });
  });
});

function listRuntimeSourceFiles(rootPath: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(rootPath)) {
    const entryPath = join(rootPath, entry);
    const relativeEntryPath = relative(rootPath, entryPath);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      if (relativeEntryPath === '__tests__' || relativeEntryPath === '__fixtures__') {
        continue;
      }

      files.push(...listRuntimeSourceFiles(entryPath));
      continue;
    }

    if (entryPath.endsWith('.ts') || entryPath.endsWith('.tsx')) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function extractModuleSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const modulePattern =
    /\b(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]|(?:require|import)\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const match of source.matchAll(modulePattern)) {
    const specifier = match[1] ?? match[2];

    if (specifier) {
      specifiers.push(specifier);
    }
  }

  return specifiers;
}

function classifyForbiddenImport(specifier: string): string | null {
  if (specifier.startsWith(`..${sep}editor`) || specifier.startsWith('../editor')) {
    return 'editor';
  }

  if (
    specifier === 'react' ||
    specifier === 'react-native' ||
    specifier.startsWith('react-native/') ||
    specifier === 'react-native-webview'
  ) {
    return 'native';
  }

  if (
    specifier === 'expo-sqlite' ||
    specifier.startsWith('expo-sqlite/') ||
    specifier.includes('sqlite')
  ) {
    return 'sqlite';
  }

  if (
    specifier === 'fs' ||
    specifier === 'fs/promises' ||
    specifier === 'node:fs' ||
    specifier === 'node:fs/promises'
  ) {
    return 'filesystem';
  }

  if (
    /^(?:node:)?(?:http|https|net|tls)(?:\/|$)/.test(specifier) ||
    specifier === 'http' ||
    specifier === 'https' ||
    specifier === 'net' ||
    specifier === 'tls'
  ) {
    return 'network';
  }

  return null;
}

function mockForbiddenDependency(moduleName: string) {
  jest.doMock(moduleName, () => {
    throw new Error(`rhyme artifact runtime imported ${moduleName}`);
  });
}

function installForbiddenRuntimeGlobals() {
  const descriptors = new Map<string, PropertyDescriptor | undefined>();

  for (const globalName of FORBIDDEN_RUNTIME_GLOBALS) {
    descriptors.set(globalName, Object.getOwnPropertyDescriptor(globalThis, globalName));
    Object.defineProperty(globalThis, globalName, {
      configurable: true,
      get() {
        throw new Error(`rhyme artifact runtime accessed ${globalName}`);
      },
      set() {
        throw new Error(`rhyme artifact runtime assigned ${globalName}`);
      },
    });
  }

  return () => {
    for (const [globalName, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(globalThis, globalName, descriptor);
      } else {
        delete (globalThis as Record<string, unknown>)[globalName];
      }
    }
  };
}

function spyOnConsole() {
  return CONSOLE_METHODS.map((method) =>
    jest.spyOn(console, method).mockImplementation(() => undefined),
  );
}
