# 14. Fase 4 — Replicação e otimização de dev

> **Status:** em execução · **Branch-mãe:** `feature/arquitetura-reorganizacao` · **Documento-mãe:** [`10-arquitetura-reorganizacao.md`](./10-arquitetura-reorganizacao.md).
>
> Veja também: [`15-fase-4-ci-lint-fixes.md`](./15-fase-4-ci-lint-fixes.md) — registro completo dos 7 commits de correção do CI/ESLint (`arch/fix-lint-ci`).

## Objetivo

Replicar o padrão estabelecido na Fase 3 (feature `auth` + feature `dashboard`) para o resto das telas privadas (`agenda`, `servicos`, `barbeiros`, `clientes`, `relatorios`, `configuracoes`) e atacar a **lentidão do dev** reportada pelo usuário.

Dividida em sub-PRs sequenciais, cada um em uma branch própria a partir de `feature/arquitetura-reorganizacao`:

| Sub-PR       | Branch                             | Escopo                                                                                  | Status               |
| ------------ | ---------------------------------- | --------------------------------------------------------------------------------------- | -------------------- |
| **4a**       | `arch/fase-4a-dev-perf`            | Otimizações de dev: `optimizePackageImports`, bundle analyzer, `dev:turbopack`, medição | **mergeado** ✅      |
| **fix-lint** | `arch/fix-lint-ci`                 | CI verde: Gitleaks, ESLint web+api, Prisma generate, NestJS spec stubs                  | **mergeado** ✅      |
| **4b**       | `arch/fase-4b-agenda`              | Feature `agenda` migrada para `src/features/agenda/`                                    | **mergeado** ✅      |
| **4c**       | `arch/fase-4c-servicos-barbeiros`  | Features `servicos` e `barbeiros` com TanStack Query                                    | **mergeado** ✅      |
| **4d**       | `arch/fase-4d-clientes-relatorios` | Features `clientes` e `relatorios` com 5 endpoints de relatório                         | **PR #14 aberto** 🔄 |
| 4e           | `arch/fase-4e-configuracoes`       | Feature `configuracoes` (form de perfil + tema, ~1014 linhas)                           | pendente             |

## Entregue na sub-PR 4a — otimizações de dev

Foco em ganhos rápidos no fluxo de desenvolvimento, sem mexer em código de feature.

### 1. `experimental.optimizePackageImports`

Adicionado em `apps/web/next.config.js` com a lista de pacotes "barrel-heavy" que mais pesam no compile do dev:

```js
experimental: {
  optimizePackageImports: [
    "lucide-react",
    "framer-motion",
    "recharts",
    "date-fns",
    "@tanstack/react-query",
    "@tanstack/react-query-devtools",
    "@radix-ui/react-accordion", "@radix-ui/react-alert-dialog",
    "@radix-ui/react-avatar", "@radix-ui/react-checkbox",
    "@radix-ui/react-collapsible", "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu", "@radix-ui/react-label",
    "@radix-ui/react-popover", "@radix-ui/react-scroll-area",
    "@radix-ui/react-select", "@radix-ui/react-separator",
    "@radix-ui/react-slot", "@radix-ui/react-switch",
    "@radix-ui/react-tabs", "@radix-ui/react-toast",
    "@radix-ui/react-tooltip",
  ],
},
```

Next reescreve imports `from "lucide-react"` como `from "lucide-react/dist/esm/icons/<icon>"` em tempo de compile — corta drasticamente o tempo de tipagem/transformação dos barrels.

### 2. `@next/bundle-analyzer` + script `analyze`

- Dep `-D`: `@next/bundle-analyzer@^16`, `cross-env@^10`.
- Wrapping em `next.config.js`: `withBundleAnalyzer(nextConfig)` ativado quando `ANALYZE=true`.
- Script em `apps/web/package.json`:
  ```json
  "analyze": "cross-env ANALYZE=true next build"
  ```
- Para rodar:
  ```bash
  pnpm --filter web analyze
  ```
  Abre 3 HTMLs interativos (`client.html`, `nodejs.html`, `edge.html`) com o treemap dos chunks. Útil pra caçar dependências obesas e medir efeito das otimizações.

### 3. `dev:turbopack` opcional

Adicionado script alternativo:

```json
"dev:turbopack": "next dev --hostname 0.0.0.0 --port 3001 --turbopack"
```

O default continua webpack (mais estável com este conjunto de deps), mas se um dia o Turbopack ficar mais robusto, é só usar `pnpm --filter web dev:turbopack`.

### 4. `turbo.json` — variável `ANALYZE`

Adicionado `ANALYZE` ao `globalEnv` do `turbo.json` para que Turbo não invalide cache nem reclame de env não declarada.

### 5. Medição

Baseline (sem `optimizePackageImports`):

| Métrica                       |  Valor |
| ----------------------------- | -----: |
| `next build` (clean)          |  41.7s |
| Chunks `.next/static/chunks/` | 2.6 MB |
| `Ready in` (dev)              |  ~2.1s |
| `GET /` 1ª compilação         |    63s |

Após 4a:

| Métrica                        |  Valor |                Δ |
| ------------------------------ | -----: | ---------------: |
| `next build` (clean)           |  55.9s | **+34% pior** ⚠️ |
| Chunks `.next/static/chunks/`  | 2.6 MB |            igual |
| `Ready in` (dev)               |   0.8s |      **-62%** ✅ |
| `GET /` 1ª compilação          |  35.6s |      **-43%** ✅ |
| `GET /dashboard` 1ª compilação |  10.4s |   (sem baseline) |
| `GET /login` 1ª compilação     |  12.0s |        (similar) |

**Trade-off:** `optimizePackageImports` adiciona transformação durante o build prod inicial (daí o `next build` ~14s mais lento), mas o dev fica bem mais rápido, que é onde o desenvolvedor passa o tempo. O bundle de prod final fica do mesmo tamanho (2.6 MB).

> Atenção: medições feitas em Windows + WSL Docker. Cold-start no Linux puro tende a ser mais rápido.

### 6. Próximas otimizações sob avaliação (não nesta sub-PR)

- **Lazy-load do `framer-motion`** via `dynamic(...)` em componentes decorativos (ex.: `AuthBrandingPanel`, `AcoesRapidas`). Adicionaria complexidade; deixar como follow-up se 4a não bastar.
- **`webpackBuildWorker: true`** experimental — paraleliza Webpack em múltiplos workers (Next 14+, ainda experimental).
- **Substituir `framer-motion` por `motion.dev`** (sucessor mais leve) — refactor grande.
- **Remover `recharts`** se não estiver indo pra produção — pesado, ~200KB.

### Validações da sub-PR 4a

| Checagem                                | Resultado                           |
| --------------------------------------- | ----------------------------------- |
| `pnpm --filter web build`               | ✅ (14 rotas, com Proxy middleware) |
| `pnpm --filter web exec tsc --noEmit`   | ✅                                  |
| `pnpm --filter web lint`                | ✅                                  |
| `pnpm --filter web dev` cold start      | ✅ Ready in 0.8s                    |
| `Test-NetConnection 192.168.0.134:3001` | ✅ (com portproxy do host)          |

### Critérios de aceite (sub-PR 4a)

- [x] `optimizePackageImports` configurado para Radix/lucide/framer-motion/recharts/etc.
- [x] `@next/bundle-analyzer` + script `analyze`.
- [x] Script alternativo `dev:turbopack`.
- [x] Medição antes/depois documentada.
- [x] Build/lint/types verdes.
- [ ] PR aberto e mergeado.

## Sub-PR 4d — clientes e relatorios (PR #14)

Branch: `arch/fase-4d-clientes-relatorios` → base `feature/arquitetura-reorganizacao`.

### Escopo

| Feature      | Linhas removidas da page | Estrutura criada                                                                 |
| ------------ | ------------------------ | -------------------------------------------------------------------------------- |
| `clientes`   | 901 → 4                  | types, constants, service, hook, `ClienteCard`, `ClienteDetalhe`, `ClientesView` |
| `relatorios` | 755 → 4                  | types, constants, service (5 métodos), 5 hooks, `RelatoriosView`                 |

### API — endpoints de relatórios

Todos em `/barbearias/:barCodigo/relatorios/<endpoint>?periodo=<30d>`:

| Hook                       | Endpoint        | Retorno                                                                        |
| -------------------------- | --------------- | ------------------------------------------------------------------------------ |
| `useFaturamento`           | `faturamento`   | `FaturamentoItem[]` `{ data, total }`                                          |
| `useAgendamentosRelatorio` | `agendamentos`  | `AgendamentosItem[]` `{ data, concluido, cancelado, no_show }`                 |
| `useServicosRelatorio`     | `servicos`      | `ServicoItem[]` `{ nome, quantidade, total }`                                  |
| `useBarbeirosRelatorio`    | `barbeiros`     | `BarbeiroItem[]` `{ nome, faturamento, atendimentos, ticketMedio, avaliacao }` |
| `useHorariosPico`          | `horarios-pico` | `HorarioPicoItem[]` `{ hora, quantidade }`                                     |

### Tipo `Periodo`

```ts
type Periodo = "7d" | "30d" | "3m" | "6m" | "12m";
```

Selecionável via toggle no header da `RelatoriosView`. Todas as queries invalidam e refazem quando `periodo` muda.

### `toCliente()` — derivação de status

O status do cliente (`ativo | inativo | novo`) é derivado no frontend a partir dos dados brutos da API:

- `novo` → `totalVisitas === 0`
- `ativo` → `ultimaVisita` nos últimos 30 dias
- `inativo` → demais casos

### Shared components extraídos (refactor pós-revisão SOLID)

Após revisão de qualidade, 3 componentes reutilizáveis foram extraídos para `src/shared/components/`:

| Arquivo                  | Responsabilidade                                                           | Usado por                           |
| ------------------------ | -------------------------------------------------------------------------- | ----------------------------------- |
| `chart-utils.tsx`        | `ClientOnlyChart` (SSR guard) + `ChartTooltip` (tooltip recharts genérico) | 5 charts de relatórios              |
| `detail-panel.tsx`       | Motion wrapper do painel lateral: animação, header com X, slot de footer   | `BarbeiroDetalhe`, `ClienteDetalhe` |
| `detail-metric-grid.tsx` | Grid 2×2 de métricas com label/value/suffix padronizado                    | `BarbeiroDetalhe`, `ClienteDetalhe` |

`RelatoriosView` (~400 linhas) dividido em 5 componentes SRP:
`FaturamentoChart`, `AgendamentosChart`, `ServicosMixChart`, `HorariosPicoChart`, `BarbeirosRanking` — `RelatoriosView` vira orquestrador de ~120 linhas.

Outras correções: `Users2` SVG inline → `Users` do lucide-react; `crescimento = 12` hardcoded removido.

### Validações

| Checagem                                                                                                             | Resultado |
| -------------------------------------------------------------------------------------------------------------------- | --------- |
| `pnpm --filter web exec tsc --noEmit`                                                                                | ✅        |
| `pnpm --filter web exec eslint src/features/clientes src/features/relatorios src/shared/components --max-warnings 0` | ✅        |

## Sub-PR fix-lint-ci — CI verde (mergeado)

Branch `arch/fix-lint-ci` — 7 commits, PR #13 mergeado. Detalhes completos em [`15-fase-4-ci-lint-fixes.md`](./15-fase-4-ci-lint-fixes.md).

Resumo das correções:

- Gitleaks: `pull-requests: read` em `.github/workflows/gitleaks.yml`
- `prisma generate` com `DATABASE_URL` dummy em `ci.yml` (Prisma 7 valida env em load time)
- `src/generated/**` adicionado aos `ignores` do `eslint.config.mjs` da API
- 12 NestJS spec stubs corrigidos com `useValue: {}` e `.overrideGuard()`
- `/* eslint-disable no-restricted-syntax */` nos componentes com CSS vars dinâmicos
- `no-unsafe-*` downgraded para `warn` na API (padrões legítimos do NestJS/Passport)

## Próximos sub-PRs

- **4e** `arch/fase-4e-configuracoes`: migrar `configuracoes/page.tsx` (~1014 linhas) → `src/features/configuracoes/`. Contém form de perfil da barbearia, upload de logo, preferências de tema — provável split em `PefilBarbeariaForm`, `TemaSelector`, `ConfiguracoesView`.
- **Fase 5**: rate limiting (NestJS throttler), Helmet + CSP, healthchecks `/health`, release pipeline.
- **Merge final**: `feature/arquitetura-reorganizacao` → `develop` após 4e.
