const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = projectRoot;

const config = getDefaultConfig(projectRoot);

// Add additional module resolution paths
config.resolver.extraNodeModules = new Proxy({}, {
  get: (target, name) => path.join(projectRoot, `node_modules/${name}`),
});

// 1. Watch all files and folders in the project directory
config.watchFolders = [workspaceRoot];

// 2. Include additional node_modules resolution
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force resolving to platform-specific files
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'android.js', 'android.tsx', 'ios.js', 'ios.tsx'];

module.exports = config;
