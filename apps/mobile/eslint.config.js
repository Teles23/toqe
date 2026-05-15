// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  // Em arquivos de teste, jest.mock() é hoistado pelo babel-jest antes dos imports,
  // mas o ESLint não sabe disso — relaxamos import/first apenas em specs.
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
    rules: {
      "import/first": "off",
    },
  },
]);
