// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow uppercase .MP3 files to be treated as audio assets
config.resolver.assetExts.push('MP3');

module.exports = config;
