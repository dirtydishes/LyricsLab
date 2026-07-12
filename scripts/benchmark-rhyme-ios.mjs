import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  process.stdout.write('Usage: npm run benchmark:rhyme:ios -- --device DEVICE --app RELEASE.app --evidence FILE\nRequires macOS, Xcode xcrun, a connected physical iPhone, a signed Release app, and complete evidence.\n');
  process.exit(0);
}
const value = (flag) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
const device = value('--device');
if (!device) throw new Error('Missing required --device DEVICE');
if (process.platform !== 'darwin') throw new Error('Physical iPhone benchmark requires macOS with Xcode/xcrun; this host is not eligible');
try { execFileSync('xcrun', ['--find', 'devicectl'], { stdio: 'pipe' }); } catch { throw new Error('Missing xcrun/Xcode devicectl'); }
const listing = execFileSync('xcrun', ['xctrace', 'list', 'devices'], { encoding: 'utf8' });
const line = listing.split('\n').find((entry) => entry.includes(device));
if (!line || /Simulator/u.test(line)) throw new Error(`Selected device is absent or not a physical iPhone: ${device}`);
const app = value('--app');
if (!app || !app.endsWith('.app') || !existsSync(app)) throw new Error('Missing signed Release --app PATH.app');
const evidence = value('--evidence');
if (!evidence) throw new Error('Missing --evidence FILE from the diagnostics release run');
execFileSync(process.execPath, ['scripts/rhyme-ios-evidence.mjs', '--validate', evidence], { stdio: 'inherit' });
process.stdout.write(`physical iPhone benchmark evidence accepted for ${device}\n`);
