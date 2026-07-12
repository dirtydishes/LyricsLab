/// <reference types="jest" />

import fs from 'node:fs';
import path from 'node:path';

const CORE_FILES = [
  'RhymeEngine.ts',
  'createRhymeEngine.ts',
  'productionPhonology.ts',
  'public.ts',
] as const;

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

    for (const file of CORE_FILES) {
      const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/gu)].map(
        ([, moduleName]) => moduleName?.toLocaleLowerCase() ?? '',
      );

      for (const forbiddenImport of forbiddenImports) {
        expect(imports).not.toContainEqual(
          expect.stringContaining(forbiddenImport.toLocaleLowerCase()),
        );
      }
    }
  });
});
