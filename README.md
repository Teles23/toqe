# toqe

SaaS multi-tenant para gestão de barbearias — agendamento, agenda, serviços, dashboards e notificações.

Monorepo gerenciado por **Turborepo** sobre **pnpm 9 workspaces**.

## Apps

| Caminho                        | Stack                                             | Porta dev |
| ------------------------------ | ------------------------------------------------- | --------- |
| [`apps/api`](./apps/api)       | NestJS 11 + Prisma 7 + Postgres 16 + Redis + Bull | 3000      |
| [`apps/web`](./apps/web)       | Next.js 16 + React 19 + Tailwind 4 + shadcn/ui    | 3001      |
| [`apps/mobile`](./apps/mobile) | Expo 54 + React Native 0.81 + Expo Router 6       | 19000+    |

## Packages

| Caminho                                                      | Propósito                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| [`packages/contracts`](./packages/contracts)                 | Schemas Zod, tipos e erros compartilhados. Source of truth. |
| [`packages/shared`](./packages/shared)                       | Tipos, DTOs e enums compartilhados.                         |
| [`packages/config`](./packages/config)                       | Configurações base.                                         |
| [`packages/eslint-config`](./packages/eslint-config)         | Preset ESLint.                                              |
| [`packages/typescript-config`](./packages/typescript-config) | Preset `tsconfig`.                                          |

## Quickstart

```bash
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d postgres redis
pnpm dev          # api + web + mobile em paralelo
```

Subir um app só:

```bash
pnpm dev:api      # http://localhost:3000  (Swagger em /docs)
pnpm dev:web      # http://localhost:3001
pnpm --filter mobile dev
```

## Comandos úteis

```bash
pnpm lint              # ESLint em todos os workspaces
pnpm check-types       # tsc --noEmit
pnpm format            # Prettier
pnpm --filter api test
pnpm --filter api test:cov
pnpm --filter api test:e2e
pnpm build             # build de produção
```

## Documentação

- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — visão arquitetural do monorepo.
- **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** — fluxo de branches, Conventional Commits, padrões de PR.
- **[`docs/10-arquitetura-reorganizacao.md`](./docs/10-arquitetura-reorganizacao.md)** — plano vigente de reorganização (5 fases).
- **[`docs/`](./docs/)** — histórico de evolução (setup, sprints, decisões).
- **API**: Swagger em `http://localhost:3000/docs` quando o `apps/api` está rodando.

## Status da reorganização arquitetural

A reorganização está em andamento. Acompanhe em [`docs/10-arquitetura-reorganizacao.md`](./docs/10-arquitetura-reorganizacao.md).

| Fase                                                    | Status      |
| ------------------------------------------------------- | ----------- |
| 1 — Tooling & CI                                        | em execução |
| 2 — Packages compartilhados (`contracts`, `nestjs-zod`) | pendente    |
| 3 — Reorganização do frontend + design tokens + RBAC    | pendente    |
| 4 — Replicação + otimização de dev                      | pendente    |
| 5 — Docker, deploy, observabilidade                     | pendente    |

## Licença

Privado. Todos os direitos reservados.
