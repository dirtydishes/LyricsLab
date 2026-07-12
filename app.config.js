const base = require('./app.json').expo;

module.exports = () => {
  const diagnostics = process.env.LYRICSLAB_DIAGNOSTICS_BUILD === '1';
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
      router: { root: diagnostics ? 'diagnostics/app' : 'app' },
    },
  };
};
