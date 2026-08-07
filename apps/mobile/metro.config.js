const { getDefaultConfig } = require("expo/metro-config");

// Expo SDK 52+ auto-configures monorepo watchFolders / resolution.
// Keep this file minimal so @splitshot/shared resolves correctly.
const config = getDefaultConfig(__dirname);

module.exports = config;
