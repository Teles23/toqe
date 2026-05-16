// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  // React Native usa Metro bundler para resolução de módulos — o resolver Node.js
  // do ESLint não consegue resolver pacotes nativos (.native.js, platform-specific,
  // etc.). Desabilitar import/no-unresolved é o padrão correto para projetos RN/Expo.
  {
    rules: {
      "import/no-unresolved": "off",
    },
  },
  // Em arquivos de teste:
  // - jest.mock() é hoistado pelo babel-jest antes dos imports
  //   → import/first não pode entender essa ordem
  // - jest.mock factories hoistadas só podem referenciar módulos via require()
  //   ou jest.requireActual() — top-level imports não estão disponíveis ainda
  //   → @typescript-eslint/no-require-imports vira false-positive nesse contexto
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
    rules: {
      "import/first": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
