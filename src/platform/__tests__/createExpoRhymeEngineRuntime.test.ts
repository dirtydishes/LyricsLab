/// <reference types="jest" />

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const mockFromModule = jest.fn();
const mockFile = jest.fn();
const mockDigest = jest.fn(async (_algorithm: string, data: ArrayBuffer) =>
  Uint8Array.from(createHash('sha256').update(new Uint8Array(data)).digest()).buffer,
);

jest.mock('expo-asset', () => ({
  Asset: { fromModule: mockFromModule },
}));
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digest: mockDigest,
}));
jest.mock('expo-file-system', () => ({
  File: mockFile,
  FileMode: { ReadOnly: 'r' },
}));

import { createExpoRhymeEngineRuntime } from '../createExpoRhymeEngineRuntime';

const artifact = readFileSync(
  path.join(process.cwd(), 'assets/rhyme/fixture.rhymebin'),
);
const manifestHash = artifact.subarray(24, 56).toString('hex');

describe('Expo rhyme data adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installTimerGlobals();
  });

  it('resolves only a bundled module and closes its read-only handle after loading', async () => {
    let offset = 0;
    const handle = {
      size: artifact.length,
      close: jest.fn(),
      readBytes: jest.fn((length: number) => {
        const chunk = artifact.subarray(offset, offset + length);
        offset += chunk.length;
        return chunk;
      }),
    };
    const downloadAsync = jest.fn(async () => undefined);
    mockFromModule.mockReturnValue({ downloadAsync, localUri: 'file:///fixture.rhymebin' });
    mockFile.mockImplementation(() => ({ open: jest.fn(() => handle) }));
    const runtime = createExpoRhymeEngineRuntime({
      artifactModuleId: 42,
      expectedManifestSha256: manifestHash,
      initialVersion: 'pending',
    });

    await runtime.retry();

    expect(mockFromModule).toHaveBeenCalledWith(42);
    expect(downloadAsync).toHaveBeenCalledTimes(1);
    expect(mockFile).toHaveBeenCalledWith('file:///fixture.rhymebin');
    expect(handle.readBytes).toHaveBeenCalledWith(artifact.length);
    expect(handle.close).toHaveBeenCalledTimes(1);
    expect(runtime.getSnapshot()).toMatchObject({
      state: 'ready',
      version: 'fixture-1',
    });
  });

  it('closes the file handle when size inspection fails', async () => {
    const close = jest.fn();
    const handle = {
      get size(): number {
        throw new Error('size failed');
      },
      close,
      readBytes: jest.fn(),
    };
    mockFromModule.mockReturnValue({
      downloadAsync: jest.fn(async () => undefined),
      localUri: 'file:///fixture.rhymebin',
    });
    mockFile.mockImplementation(() => ({ open: jest.fn(() => handle) }));
    const runtime = createExpoRhymeEngineRuntime({
      artifactModuleId: 42,
      expectedManifestSha256: manifestHash,
      initialVersion: 'pending',
    });

    await runtime.retry();

    expect(close).toHaveBeenCalledTimes(1);
    expect(runtime.getSnapshot()).toMatchObject({
      errorMessage: 'size failed',
      state: 'error',
    });
  });
});

function installTimerGlobals() {
  Object.assign(globalThis, {
    cancelAnimationFrame: jest.fn(),
    cancelIdleCallback: jest.fn(),
    requestAnimationFrame: jest.fn(() => 1),
    requestIdleCallback: jest.fn(() => 1),
  });
}
