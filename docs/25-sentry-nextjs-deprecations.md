# 25 — Correções de Warnings no Boot do Web (Sentry + Next + Recharts)

**Status:** Concluído
**Branch:** fix/sentry-nextjs-deprecations
**Base:** develop

---

## Resumo

Eliminados seis warnings emitidos em `pnpm dev`:

1. `disableLogger is deprecated and will be removed in a future version.` (@sentry/nextjs)
2. `Could not find onRequestError hook in instrumentation file.` (@sentry/nextjs)
3. `Detected scroll-behavior: smooth on the <html> element.` (Next.js)
4. `The width(-1) and height(-0.4) of chart should be greater than 0` (recharts, dashboard)
5. `The width(-1) and height(-1) of chart should be greater than 0` (recharts, todos os charts via measurement do pai)
6. `Unsupported route path: "/api/v1/*"` do `LegacyRouteConverter` (Nest 11 + path-to-regexp 6+)

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

### 5 — Recharts: `width(-1) height(-1)` em todos os charts (dashboard + relatórios)

**Arquivo:** `apps/web/src/shared/components/chart-utils.tsx` (`ClientOnlyChart`)

**Problema:** A versão anterior do `ClientOnlyChart` montava o chart logo após o `mount` do client, sem checar se o container pai já tinha dimensões. Em layouts com `grid 1fr`, `motion.div` (com opacity 0 inicial) ou Suspense, o pai tinha `clientWidth/Height = 0` na primeira measurement do `ResponsiveContainer` — recharts subtraía 1 e logava `width(-1) height(-1)` repetidamente. O sintoma aparecia em `/dashboard`, `/relatorios` e em qualquer página que use os charts.

**Correção:** Reescrevemos o `ClientOnlyChart` para:

1. Renderizar um `<div>` wrapper com `width: 100%; height: 100%;` ligado a um `ref`.
2. Observar esse wrapper com `ResizeObserver`.
3. Só montar `children` quando `width > 0 AND height > 0`.

Isso ataca a raiz do warning para **todos** os charts de uma vez, sem precisar tocar em cada `ResponsiveContainer` individualmente.

---

### 6 — Nest 11: warning `Unsupported route path: "/api/v1/*"`

**Arquivo:** `apps/api/src/main.ts`

**Problema:** Nest 11 + `path-to-regexp` 6+ deprecam a sintaxe wildcard antiga (`/api/v1/*`) em favor de parâmetros nomeados (`/api/v1/*splat`). O `setGlobalPrefix('api/v1')` registra internamente o wildcard antigo e o `LegacyRouteConverter` loga um warn auto-convertendo. É ruído sem ação possível pelo usuário até o Nest atualizar o registro interno.

**Correção:** Adicionado wrapper `createFilteredLogger` em `main.ts` que delega para o Pino mas suprime warns cujo contexto é `LegacyRouteConverter`. Todos os outros warns continuam intactos.

---

## Arquivos Modificados

| Arquivo                                                           | Mudança                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/web/next.config.js`                                         | `disableLogger` → `bundleSizeOptimizations.excludeDebugStatements` |
| `apps/web/instrumentation.ts`                                     | Adiciona `import * as Sentry` + export `onRequestError`            |
| `apps/web/src/app/layout.tsx`                                     | `<html>` ganha `data-scroll-behavior="smooth"`                     |
| `apps/web/src/features/dashboard/components/FaturamentoChart.tsx` | Wrapper com `height: 260` + `ResponsiveContainer height="100%"`    |
| `apps/web/src/shared/components/chart-utils.tsx`                  | `ClientOnlyChart` aguarda dimensões positivas via `ResizeObserver` |
| `apps/api/src/main.ts`                                            | `createFilteredLogger` suprime warns do `LegacyRouteConverter`     |
| `docs/25-sentry-nextjs-deprecations.md`                           | Esta documentação                                                  |

---

## Validação

```bash
pnpm --filter web lint           # ok
pnpm --filter api lint           # ok
cd apps/web && npx tsc --noEmit  # ok
cd apps/api && npx tsc --noEmit  # ok
pnpm --filter web test           # 81/81 passed
pnpm --filter api test           # 135/135 passed
```

Após o restart do `pnpm dev`, nenhum dos seis warnings é emitido no boot ou em navegação por `/dashboard` e `/relatorios`.
