# 10. Arquitetura — Reorganização do Monorepo `toqe`

> **Status:** em execução · **Branch-mãe:** `feature/arquitetura-reorganizacao` (a partir de `feature/frontend-web`) · **Documento-mãe** desta reorganização.

## 1. Contexto

O monorepo `toqe` (Turbo + pnpm 9) tem três apps (`api` NestJS, `web` Next.js 16, `mobile` Expo) e cinco packages compartilhados. Está funcional, mas apresenta sintomas que ameaçam manutenção, escalabilidade e velocidade de deploy:

- **Frontend lento para subir** e suspeita de stack mal dimensionada.
- **Componentes monolíticos** (`apps/web/app/(dashboard)/dashboard/page.tsx` com 628 linhas misturando UI, estado, animações e dados mockados).
- **Estilos inline duplicados** (`style={{ color: "var(--status-success)" }}` em 100+ pontos do `apps/web`).
- **Validação duplicada**: `class-validator` no back + `zod` no front, sem sincronia.
- **Sem camada de services no FE** — `fetch` direto em páginas; sem TanStack Query/SWR; zero cache.
- **`proxy.ts` sem RBAC** apesar de `perfil` existir no `AuthContext`.
- **Zero testes em `web` e `mobile`**; API tem Jest + 16 specs.
- **Sem CI/CD** (GitHub Actions), Husky, lint-staged, commitlint.
- **Sem geração automática de tipos** a partir do Swagger.
- **Sem `ARCHITECTURE.md` / `CONTRIBUTING.md`**.

**Objetivo:** organizar a casa antes dos testes, com entrega **incremental por camada**, mantendo a stack (Next/Nest/Expo) e padronizando o frontend em **feature-based pragmático** com **Zod como source of truth**.

## 2. Decisões arquiteturais

| Tema             | Decisão                                                                                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Padrão FE        | **Feature-based pragmático**: `src/features/<feature>/{components,hooks,services,types,schemas}`, com `src/shared/{ui,lib,api,config,types}` para o que cruza features. `app/` continua sendo rotas Next. |
| Padrão BE        | **Manter NestJS modular** + evolução leve para camadas internas por módulo (`controller → service → repository`). Sem Clean Architecture pura agora.                                                      |
| Stack            | **Manter** Next.js 16 + NestJS 11 + Expo 54. Otimizar dev experience antes de cogitar troca.                                                                                                              |
| Contratos        | **Zod = source of truth** em `packages/contracts`. Backend usa `nestjs-zod` para gerar DTOs + Swagger. Frontend importa schemas direto.                                                                   |
| Data fetching FE | **TanStack Query** com hooks por entidade (`useUsuarioMe`, `useAgenda`).                                                                                                                                  |
| Styling          | **Design tokens** centralizados em `apps/web/src/shared/ui/tokens.css` + Tailwind theme. Variantes via **CVA**. Banir `style={{}}` para cores/spacing.                                                    |
| Estado global    | Manter Context API para auth/theme; **adicionar Zustand** apenas para estado de UI complexo.                                                                                                              |
| RBAC             | Adicionar checagem de `perfil` em `proxy.ts` e helper `<RequireRole roles={[...]}>` no FE.                                                                                                                |
| Observabilidade  | Manter Pino + Sentry filter no back; **adicionar Sentry SDK no FE**; OpenTelemetry como segunda fase.                                                                                                     |

## 3. Estratégia de branches

- **Branch-mãe:** `feature/arquitetura-reorganizacao` (a partir de `feature/frontend-web`).
- **Sub-branches por fase**, com PR contra a branch-mãe:
  - `arch/fase-1-tooling-ci`
  - `arch/fase-2-contracts`
  - `arch/fase-3-frontend-piloto`
  - `arch/fase-4-replicacao-perf`
  - `arch/fase-5-docker-deploy`
- PR final `feature/arquitetura-reorganizacao` → `main` após as 5 fases.

## 4. Estratégia de documentação

Cada fase produz um doc em `docs/` com numeração contínua:

| Doc                                    | Conteúdo                                                                |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `docs/10-arquitetura-reorganizacao.md` | Este doc-mãe (visão geral, decisões, status).                           |
| `docs/11-fase-1-tooling-ci.md`         | Entregas da Fase 1 (Husky, CI, lint, ARCHITECTURE.md, CONTRIBUTING.md). |
| `docs/12-fase-2-contracts.md`          | `packages/contracts` + `nestjs-zod`.                                    |
| `docs/13-fase-3-frontend-piloto.md`    | Nova estrutura `src/`, design tokens, piloto auth, RBAC.                |
| `docs/14-fase-4-replicacao-perf.md`    | Replicação para demais features + otimização de dev.                    |
| `docs/15-fase-5-docker-deploy.md`      | Docker, healthchecks, pipelines de release.                             |

## 5. Roadmap das 5 fases

### Fase 1 — Fundação de tooling e qualidade (1–2 dias)

> Branch `arch/fase-1-tooling-ci` · Doc `docs/11-fase-1-tooling-ci.md`

- Husky + lint-staged + commitlint.
- GitHub Actions: `ci.yml`, `docker.yml`.
- `gitleaks` no CI; Dependabot configurado.
- `ARCHITECTURE.md` + `CONTRIBUTING.md` na raiz.
- READMEs atualizados.

**Aceite:** PR roda CI verde; commit fora do Conventional Commits é bloqueado.

### Fase 2 — Packages compartilhados (2–3 dias)

> Branch `arch/fase-2-contracts` · Doc `docs/12-fase-2-contracts.md`

- `packages/validators` → `packages/contracts` (schemas Zod + tipos + erros).
- Backend adota `nestjs-zod` (módulo piloto `auth`).
- (Opcional) `packages/ui` para primitivos compartilhados.
- Cliente HTTP tipado a partir dos schemas.

**Aceite:** 1 módulo backend Zod-first; tipos compartilhados front/back compilando.

### Fase 3 — Reorganização do frontend (3–5 dias)

> Branch `arch/fase-3-frontend-piloto` · Doc `docs/13-fase-3-frontend-piloto.md`

Nova estrutura `apps/web/src/`:

```
app/                 # rotas Next (page/layout)
features/<feat>/     # components, hooks, services, schemas, types
shared/ui/           # primitivos shadcn + tokens.css
shared/api/          # api-client.ts, query-client.ts
shared/lib/          # cn, formatters, date-utils
shared/config/       # env, routes, constants, roles
shared/hooks/        # custom hooks transversais
shared/providers/    # AuthProvider, ThemeProvider, QueryProvider
shared/types/
```

Tarefas:

- Mover `app/` atual para `src/app/`.
- Criar `QueryProvider` (TanStack Query).
- Migrar `auth` (piloto) para o novo layout.
- Definir design tokens em `tokens.css` + Tailwind theme; banir `style={{}}` via ESLint.
- Quebrar `dashboard/page.tsx` em componentes pequenos com dados via `useDashboardOverview()`.
- Adicionar RBAC em `proxy.ts` + `<RequireRole>`.
- Integrar `@sentry/nextjs`.

**Aceite:** `/login` e `/dashboard` no novo layout, com TanStack Query, design tokens e RBAC.

### Fase 4 — Replicação e otimização de dev (2–3 dias)

> Branch `arch/fase-4-replicacao-perf` · Doc `docs/14-fase-4-replicacao-perf.md`

- Migrar `agenda`, `servicos`, `barbeiros`, `clientes`, `relatorios`, `configuracoes`.
- Performance: avaliar Turbopack com `NODE_OPTIONS=--max-old-space-size=4096`; lazy-load de `framer-motion`; tree-shake de Radix; `experimental.optimizePackageImports`.
- `@next/bundle-analyzer` + script `pnpm web:analyze`.
- Replicar estrutura em `apps/mobile`.

**Aceite:** todas as rotas migradas; cold start ≥30% mais rápido.

### Fase 5 — Docker, deploy e observabilidade (1–2 dias)

> Branch `arch/fase-5-docker-deploy` · Doc `docs/15-fase-5-docker-deploy.md`

- Dockerfiles com `pnpm fetch` + cache mounts.
- `docker-compose.dev.yml` com hot reload via bind mount.
- Healthchecks (`@nestjs/terminus`) em `/health/live` e `/health/ready`.
- Workflow `release.yml` (build + push imagens em push para `main`).
- `@nestjs/throttler` em rotas auth; Helmet; CSP no Next.

**Aceite:** `docker compose up --build` <90s; pipeline publica imagem em push para `main`.

## 6. Estratégia de testes (após reorganização)

| Camada        | Ferramenta                     | Onde                           |
| ------------- | ------------------------------ | ------------------------------ |
| Unit FE       | Vitest + Testing Library       | `apps/web/src/**/*.test.ts(x)` |
| Unit BE       | Jest (já existe)               | `apps/api/src/**/*.spec.ts`    |
| Integração BE | Jest + Testcontainers          | `apps/api/test/integration/`   |
| E2E web       | Playwright + MSW               | `apps/web/e2e/`                |
| E2E mobile    | Maestro                        | `apps/mobile/.maestro/`        |
| Carga         | k6                             | `tools/load/`                  |
| Contract      | `nestjs-zod` + Pact (opcional) | CI                             |

## 7. Métricas de acompanhamento

| Métrica                   | Baseline          | Meta                       |
| ------------------------- | ----------------- | -------------------------- |
| Cold start `pnpm dev:web` | a medir na Fase 4 | -30%                       |
| Bundle size FE (gz)       | a medir na Fase 4 | -20%                       |
| Cobertura unit BE         | a medir           | >70%                       |
| Cobertura unit FE         | 0%                | >60% (após Fase 6, testes) |
| Tempo do CI               | n/a               | <8 min em paralelo         |

## 8. Status

| Fase | Estado      | PR  | Doc           |
| ---- | ----------- | --- | ------------- |
| 1    | em execução | —   | em construção |
| 2    | pendente    | —   | —             |
| 3    | pendente    | —   | —             |
| 4    | pendente    | —   | —             |
| 5    | pendente    | —   | —             |

Última atualização: 2026-05-11.
