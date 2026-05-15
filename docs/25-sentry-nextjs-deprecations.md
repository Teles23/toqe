# 25 — Correções de Warnings no Boot do Web (Sentry + Next + Recharts)

**Status:** Concluído
**Branch:** fix/sentry-nextjs-deprecations
**Base:** develop

---

## Resumo

Eliminados quatro warnings emitidos em `pnpm web:dev`:

1. `disableLogger is deprecated and will be removed in a future version.` (@sentry/nextjs)
2. `Could not find onRequestError hook in instrumentation file.` (@sentry/nextjs)
3. `Detected scroll-behavior: smooth on the <html> element.` (Next.js)
4. `The width(-1) and height(-0.4) of chart should be greater than 0` (recharts, no `/dashboard`)

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

### 3 — `scroll-behavior: smooth` no `<html>` sem opt-in

**Arquivo:** `apps/web/src/app/layout.tsx`

**Problema:** O `globals.css` aplica `scroll-behavior: smooth` no seletor `html`. A partir do Next 15, isso emite warning porque o smooth scroll interfere em transições de rota se não for explicitamente assumido pelo desenvolvedor.

**Correção:** Adicionado `data-scroll-behavior="smooth"` no `<html>`, sinalizando ao Next que o comportamento é intencional.

Doc: https://nextjs.org/docs/messages/missing-data-scroll-behavior

---

### 4 — Recharts: `width(-1) height(-0.4)` no FaturamentoChart do dashboard

**Arquivo:** `apps/web/src/features/dashboard/components/FaturamentoChart.tsx`

**Problema:** O chart usava `<ResponsiveContainer width="100%" aspect={2.5} />` dentro de um item de grid `1fr`. Na primeira paint, o pai ainda não foi medido (clientWidth ≈ 0) e o recharts calcula `width = -1`, e como `aspect = 2.5`, deriva `height = -0.4` — disparando o warning a cada render.

**Correção:** Trocado o cálculo via `aspect` por altura fixa no wrapper + `height="100%"` no `ResponsiveContainer` (mesmo padrão usado no `relatorios/FaturamentoChart`):

```tsx
<div className="px-4 py-4" style={{ minWidth: 0, height: 260 }}>
  <ClientOnlyChart>
    <ResponsiveContainer width="100%" height="100%">
      ...
```

Garante dimensões positivas desde a primeira measurement.

---

## Arquivos Modificados

| Arquivo                                                           | Mudança                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/web/next.config.js`                                         | `disableLogger` → `bundleSizeOptimizations.excludeDebugStatements` |
| `apps/web/instrumentation.ts`                                     | Adiciona `import * as Sentry` + export `onRequestError`            |
| `apps/web/src/app/layout.tsx`                                     | `<html>` ganha `data-scroll-behavior="smooth"`                     |
| `apps/web/src/features/dashboard/components/FaturamentoChart.tsx` | Wrapper com `height: 260` + `ResponsiveContainer height="100%"`    |
| `docs/25-sentry-nextjs-deprecations.md`                           | Esta documentação                                                  |

---

## Validação

```bash
pnpm --filter web lint           # ok
cd apps/web && npx tsc --noEmit  # ok
pnpm --filter web test           # 81/81 passed
```

Após o restart do dev server, nenhum warning do `@sentry/nextjs` é emitido no boot.
