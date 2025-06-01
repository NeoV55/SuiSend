const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': './src',
};

config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;