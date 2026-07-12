/// <reference types="jest" />

import { readFileSync } from 'node:fs';
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
    expect(adapter).not.toMatch(/fetch\s*\(|expo-sqlite/u);
  });
});
