const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('rhymebin')) {
  config.resolver.assetExts.push('rhymebin');
}

module.exports = config;
