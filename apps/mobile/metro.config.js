const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: observar packages compartilhados
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Resolver path aliases do tsconfig (@toqe/*)
config.resolver.extraNodeModules = {
  "@toqe/shared": path.resolve(monorepoRoot, "packages/shared/src"),
  "@toqe/contracts": path.resolve(monorepoRoot, "packages/contracts/src"),
  "@toqe/config": path.resolve(monorepoRoot, "packages/config/src"),
};

module.exports = config;
