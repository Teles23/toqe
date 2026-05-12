# 14. Fase 4 — Replicação e otimização de dev

> **Status:** em execução · **Branch-mãe:** `feature/arquitetura-reorganizacao` · **Documento-mãe:** [`10-arquitetura-reorganizacao.md`](./10-arquitetura-reorganizacao.md).

## Objetivo

Replicar o padrão estabelecido na Fase 3 (feature `auth` + feature `dashboard`) para o resto das telas privadas (`agenda`, `servicos`, `barbeiros`, `clientes`, `relatorios`, `configuracoes`) e atacar a **lentidão do dev** reportada pelo usuário.

Dividida em sub-PRs sequenciais, cada um em uma branch própria a partir de `feature/arquitetura-reorganizacao`:

| Sub-PR | Branch                             | Escopo                                                                                  | Status       |
| ------ | ---------------------------------- | --------------------------------------------------------------------------------------- | ------------ |
| **4a** | `arch/fase-4a-dev-perf`            | Otimizações de dev: `optimizePackageImports`, bundle analyzer, `dev:turbopack`, medição | **entregue** |
| 4b     | `arch/fase-4b-feature-agenda`      | Feature `agenda` migrada para `src/features/agenda/`                                    | pendente     |
| 4c     | `arch/fase-4c-features-cadastro`   | Features `servicos`, `barbeiros`, `clientes` (similares — list/form/detail)             | pendente     |
| 4d     | `arch/fase-4d-features-rel-config` | Features `relatorios` + `configuracoes`                                                 | pendente     |
| 4e     | `arch/fase-4e-mobile-structure`    | Replicar estrutura `src/{app,features,shared}/` em `apps/mobile/`                       | pendente     |

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

## Próximos sub-PRs

- **4b**: migrar `agenda/page.tsx` → `src/features/agenda/`. Inspecionar tamanho da página e arrastar lógica de calendário/horários pra `components/`, dados pra `services/`/`hooks/` (TanStack Query).
- **4c**: três features de cadastro juntas (similares — list table + modal de form + delete confirm). Padrão CRUD pode ser compartilhado em `shared/components/crud-list-page.tsx` se valer a pena.
- **4d**: `relatorios` (charts pesados, similar dashboard) + `configuracoes` (form de perfil + tema).
- **4e**: mobile estrutura — replicar `src/features/`, `src/shared/`, consumir `@toqe/contracts`.
