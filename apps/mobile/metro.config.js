// Expo's default config auto-detects the pnpm monorepo (watchFolders + node_modules paths).
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
