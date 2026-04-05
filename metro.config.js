const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable modern package resolution which helps with many libraries
config.resolver.unstable_enablePackageExports = true;

// Force tslib resolution to avoid interop issues with framer-motion/moti
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'tslib': path.resolve(__dirname, 'node_modules/tslib/tslib.js'),
};

// Standard extensions for modern React Native and Expo
config.resolver.sourceExts = [...new Set([...config.resolver.sourceExts, 'mjs', 'cjs', 'json'])];

module.exports = config;
