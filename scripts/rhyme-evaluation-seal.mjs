import { createHash } from 'node:crypto';
import { chmod, readFile, stat } from 'node:fs/promises';

export async function setupGoldSeal(options) {
  const verified = await verifyContent(options);
  await chmod(options.goldPath, 0o444);
  return checkGoldSeal(options, verified);
}

export async function checkGoldSeal(options, content = undefined) {
  const verified = content ?? await verifyContent(options);
  const mode = (await stat(options.goldPath)).mode & 0o777;
  if (mode !== 0o444) {
    throw new Error(`Sealed gold must be read-only, got mode ${mode.toString(8).padStart(4, '0')}`);
  }
  return { ...verified, mode: '0444' };
}

async function verifyContent({ goldPath, manifestPath }) {
  const [goldBytes, manifestBytes] = await Promise.all([
    readFile(goldPath),
    readFile(manifestPath),
  ]);
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString('utf8'));
  } catch {
    throw new Error('Invalid evaluation seal manifest');
  }
  const sha256 = createHash('sha256').update(goldBytes).digest('hex');
  if (
    manifest.schema_version !== 1 ||
    manifest.sealed_mode !== '0444' ||
    manifest.gold_sha256 !== sha256
  ) {
    throw new Error(`Sealed gold hash mismatch: ${sha256}`);
  }
  return { sha256 };
}
