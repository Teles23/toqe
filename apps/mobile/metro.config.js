const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
const disableKeepAwake = process.env.TOQE_DISABLE_KEEP_AWAKE === "1";
const keepAwakeShim = path.resolve(
  projectRoot,
  "shims/expo-keep-awake/index.js",
);

// Escapa barras do Windows em regex
const escape = (p) => p.replace(/[/\\]/g, "[\\\\/]").replace(/\./g, "\\.");

config.resolver.blockList = [
  new RegExp(`^${escape(path.resolve(monorepoRoot, "apps/web"))}[\\/].*$`),
  new RegExp(`^${escape(path.resolve(monorepoRoot, "apps/api"))}[\\/].*$`),
  /.*[/\\]__tests__[/\\].*/,
  /.*\.test\.[jt]sx?$/,
  /.*\.spec\.[jt]sx?$/,
];
// watchFolders: apenas os packages que mudam durante o desenvolvimento.
//
// NÃO inclui monorepoRoot — causaria scan de apps/api, apps/web e de todo o
// node_modules do monorepo pelo watcher do Metro (Watchman/chokidar), o que
// provoca lentidão de vários minutos no Windows antes do primeiro bundle.
//
// NÃO inclui node_modules em watchFolders — o Metro resolve node_modules via
// nodeModulesPaths (leitura sob demanda), sem precisar vigiar mudanças neles.
// blockList não resolve o problema de performance pois só afeta o bundle,
// não o watcher do filesystem.
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(monorepoRoot, "packages/shared"),
  path.resolve(monorepoRoot, "packages/contracts"),
  path.resolve(monorepoRoot, "packages/config"),
];

// nodeModulesPaths: onde o Metro encontra os pacotes para resolução.
// Funciona sem watcher — é uma busca sob demanda no momento do import.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Aliases explícitos para os packages do workspace (resolve antes do nodeModulesPaths).
config.resolver.extraNodeModules = {
  "@toqe/shared": path.resolve(monorepoRoot, "packages/shared/src"),
  "@toqe/contracts": path.resolve(monorepoRoot, "packages/contracts/src"),
  "@toqe/config": path.resolve(monorepoRoot, "packages/config/src"),
  ...(disableKeepAwake
    ? {
        "expo-keep-awake": path.dirname(keepAwakeShim),
      }
    : {}),
};

if (disableKeepAwake) {
  const defaultResolveRequest = config.resolver.resolveRequest;

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "expo-keep-awake") {
      return { type: "sourceFile", filePath: keepAwakeShim };
    }

    if (defaultResolveRequest) {
      return defaultResolveRequest(context, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
