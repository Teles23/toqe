import { nextJsConfig } from "@repo/eslint-config/next-js";

/**
 * Mensagem usada nas regras `no-restricted-syntax` que banem `style={{}}`
 * inline para cores/spacing/tipografia. Centralizada para facilitar tweaks.
 */
const NO_INLINE_STYLE_MESSAGE =
  "Evite `style={{ ... }}` inline. Use classes Tailwind ou variantes via " +
  "class-variance-authority. Tokens em src/shared/ui/tokens.css. " +
  "Para casos legítimos (valores dinâmicos, animações), adicione `// eslint-disable-next-line no-restricted-syntax`.";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // Globals do Node.js para arquivos de configuração e instrumentation
    // (next.config.js, instrumentation*.ts, sentry.*.config.ts).
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
  /**
   * Regra de design tokens: banir `style={{ ... }}` em código novo.
   *
   * Estratégia gradual:
   * - Em código NOVO (features novas em `src/features/<x>/` que NÃO sejam
   *   `auth` ainda), a regra é error — não passa no CI.
   * - Em código LEGADO (lista abaixo), a regra é off para não bloquear o
   *   build enquanto migramos. Cada PR de migração remove uma entrada
   *   da lista. Sub-PR 3e vai pagar `dashboard/page.tsx`; Fase 4 vai
   *   pagar as demais pages e components.
   *
   * Quando todos os arquivos da `legacy list` estiverem migrados, a
   * regra fica como error global e a lista some.
   */
  {
    files: ["src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='style']",
          message: NO_INLINE_STYLE_MESSAGE,
        },
      ],
    },
  },
  // Override: arquivos legados com `style={{}}` ainda permitido.
  // Removível à medida que cada arquivo é migrado.
  {
    files: [
      // App pages (todas migrarão na Fase 4; dashboard especificamente na 3e)
      "src/app/page.tsx",
      "src/app/not-found.tsx",
      "src/app/(auth)/login/page.tsx",
      "src/app/(dashboard)/**/*.tsx",
      "src/app/onboarding/page.tsx",
      // Componentes "shared" legados (cross-feature, anteriores à reorganização)
      "src/shared/components/page-layout.tsx",
      "src/shared/components/sidebar.tsx",
      "src/shared/components/stat-card.tsx",
      "src/shared/components/topbar.tsx",
      // Primitives shadcn — alguns precisam de style props para variantes
      // dinâmicas (chart/progress/slider). Permitidos.
      "src/shared/ui/**/*.tsx",
      // Feature auth — componentes criados na 3b com inline styles
      // (migrar quando estabilizar; baixa prioridade)
      "src/features/auth/components/**/*.tsx",
      // Feature dashboard — componentes extraídos na 3e mantendo os
      // inline styles existentes para limitar o escopo do PR.
      // Migrar para classes Tailwind / CVA em PR dedicado da Fase 4.
      "src/features/dashboard/components/**/*.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
];
