import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // Globals do Node.js para arquivos de configuração e instrumentation
    // (next.config.js, instrumentation*.ts, sentry.*.config.ts). Esses
    // arquivos rodam em runtime Node ou Edge — sem 'window' mas com 'process'.
    files: [
      "*.js",
      "*.mjs",
      "*.cjs",
      "instrumentation.ts",
      "instrumentation-client.ts",
      "sentry.*.config.ts",
    ],
    languageOptions: {
      globals: {
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        global: "readonly",
      },
    },
  },
  {
    rules: {
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // Convenção: variáveis/args/vars com prefixo "_" são intencionalmente
      // não utilizados (stubs, callbacks com assinatura imposta, etc.).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];
