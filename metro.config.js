// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for Firebase v9 compatibility with React Native
config.resolver.alias = {
  ...config.resolver.alias,
  'idb': path.resolve(__dirname, 'node_modules/idb/build/index.cjs'),
};

config.resolver.unstable_enableSymlinks = false;

// Add platform extensions for better resolution
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Ensure proper module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
