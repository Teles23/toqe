# 25 — Correções de Deprecations do Sentry (Next.js)

**Status:** Concluído
**Branch:** fix/sentry-nextjs-deprecations
**Base:** develop

---

## Resumo

Eliminados dois warnings emitidos pelo `@sentry/nextjs` em `pnpm web:dev`:

1. `disableLogger is deprecated and will be removed in a future version.`
2. `Could not find onRequestError hook in instrumentation file.`

---

## Problemas e Correções

### 1 — `disableLogger` deprecado

**Arquivo:** `apps/web/next.config.js`

**Problema:** A opção `disableLogger: true` no `withSentryConfig` foi marcada como deprecada nas versões mais recentes do `@sentry/nextjs`. A mensagem aponta para `webpack.treeshake.removeDebugLogging`, mas a API estável equivalente do plugin é `bundleSizeOptimizations.excludeDebugStatements`.

**Correção:** Substituído por:

```js
bundleSizeOptimizations: {
  excludeDebugStatements: true,
},
```

Mantém o mesmo efeito: remove `console.log` de debug do SDK do bundle de produção via tree-shaking.

---

### 2 — Hook `onRequestError` ausente

**Arquivo:** `apps/web/instrumentation.ts`

**Problema:** A partir do Next 15+, o `@sentry/nextjs` exige o export `onRequestError` no arquivo de instrumentação para capturar erros lançados em **nested React Server Components**. Sem ele, o SDK emitia o warning ao subir o servidor.

**Correção:** Adicionado export do hook recomendado pela doc oficial:

```ts
import * as Sentry from "@sentry/nextjs";

export const onRequestError = Sentry.captureRequestError;
```

Doc: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#errors-from-nested-react-server-components

---

## Arquivos Modificados

| Arquivo                                 | Mudança                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| `apps/web/next.config.js`               | `disableLogger` → `bundleSizeOptimizations.excludeDebugStatements` |
| `apps/web/instrumentation.ts`           | Adiciona `import * as Sentry` + export `onRequestError`            |
| `docs/25-sentry-nextjs-deprecations.md` | Esta documentação                                                  |

---

## Validação

```bash
pnpm --filter web lint           # ok
cd apps/web && npx tsc --noEmit  # ok
pnpm --filter web test           # 81/81 passed
```

Após o restart do dev server, nenhum warning do `@sentry/nextjs` é emitido no boot.
