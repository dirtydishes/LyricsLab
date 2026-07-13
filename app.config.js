const base = require('./app.json').expo;

module.exports = () => {
  const diagnostics = parseDiagnosticsFlag(process.env.LYRICSLAB_DIAGNOSTICS_BUILD);
  return {
    ...base,
    name: diagnostics ? 'LyricsLab Diagnostics' : base.name,
    ios: {
      ...base.ios,
      bundleIdentifier: diagnostics
        ? 'com.dirtydishes.lyricslab-mobile.diagnostics'
        : base.ios.bundleIdentifier,
    },
    extra: {
      ...(base.extra ?? {}),
      rhymeDiagnostics: diagnostics,
      ...(diagnostics ? { buildGitCommit: currentGitCommit() } : {}),
      router: { root: diagnostics ? 'diagnostics/app' : 'app' },
    },
  };
};

function parseDiagnosticsFlag(value) {
  if (value === undefined || value === '0') return false;
  if (value === '1') return true;
  throw new Error('LYRICSLAB_DIAGNOSTICS_BUILD must be exactly 0 or 1');
}

function currentGitCommit() {
  return require('node:child_process')
    .execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
    .trim();
}
