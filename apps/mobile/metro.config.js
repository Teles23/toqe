const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Adiciona os packages do monorepo sem sobrescrever os defaults do Expo.
// O blockList exclui pastas pesadas não relacionadas ao mobile, evitando
// lentidão no Metro no Windows quando o watchFolder abrange a raiz do monorepo.
const extraWatchFolders = [
  path.resolve(monorepoRoot, "packages/shared"),
  path.resolve(monorepoRoot, "packages/contracts"),
  path.resolve(monorepoRoot, "packages/config"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.watchFolders = [...(config.watchFolders ?? []), ...extraWatchFolders];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
  "@toqe/shared": path.resolve(monorepoRoot, "packages/shared/src"),
  "@toqe/contracts": path.resolve(monorepoRoot, "packages/contracts/src"),
  "@toqe/config": path.resolve(monorepoRoot, "packages/config/src"),
};

const defaultBlockList = config.resolver.blockList;
const customBlockList = [
  /.*\/apps\/api\/.*/,
  /.*\/apps\/web\/.*/,
  /.*\/\.git\/.*/,
  /.*\/\.turbo\/.*/,
];

if (Array.isArray(defaultBlockList)) {
  config.resolver.blockList = [...defaultBlockList, ...customBlockList];
} else if (defaultBlockList instanceof RegExp) {
  config.resolver.blockList = [defaultBlockList, ...customBlockList];
} else {
  config.resolver.blockList = customBlockList;
}

module.exports = config;
