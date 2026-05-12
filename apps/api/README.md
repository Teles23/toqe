# @toqe/api

Backend NestJS 11 do `toqe`.

> Para visão geral do monorepo, ver [`/README.md`](../../README.md). Para arquitetura, ver [`/ARCHITECTURE.md`](../../ARCHITECTURE.md). Para a reorganização em curso, ver [`/docs/10-arquitetura-reorganizacao.md`](../../docs/10-arquitetura-reorganizacao.md).

## Stack

- **NestJS 11** (módulos por feature)
- **Prisma 7** + **PostgreSQL 16**
- **Redis 7** + **Bull** (filas assíncronas)
- **JWT** (Passport) com refresh-token rotativo
- **`nestjs-pino`** (logs JSON em prod, pretty em dev)
- **`@nestjs/swagger`** (OpenAPI em `/docs`)
- **class-validator** + **class-transformer** (DTOs — migrarão para `nestjs-zod` na Fase 2)
- **Sentry** (filtro de exceções 5xx)
- **Resend** (email)

## Como rodar

```bash
# Da raiz do monorepo
docker compose -f docker-compose.dev.yml up -d postgres redis
pnpm dev:api          # http://localhost:3000 — Swagger em /docs
```

Ou diretamente:

```bash
pnpm --filter api start:dev
```

## Estrutura

```
src/
  auth/                 # login, refresh, guards, strategies
  usuario/              # gestão de usuários — endpoint /usuarios/me
  barbearia/            # tenants
  membro/               # vínculo usuário ↔ barbearia
  agendamento/          # criação e gestão de agendamentos
  agenda/               # disponibilidade por barbeiro
  servico/              # catálogo de serviços
  tenant/               # isolamento multi-tenant (header x-tenant-id)
  notificacao/          # push/email queue
  dashboard/            # agregados (em construção)
  relatorio/            # relatórios
  observabilidade/      # Sentry filter, log helpers
  prisma/               # PrismaService
  generated/prisma/     # client gerado (não commitado)
prisma/
  schema.prisma         # tabelas TQE_*
  migrations/           # 4 migrações atuais
  seed.ts
```

Cada módulo segue o padrão NestJS: `Controller → Service → Prisma`. Multi-tenant via header `x-tenant-id`.

## Endpoints principais

- `POST /api/v1/auth/login` — autentica e retorna `access_token` + `refresh_token`.
- `POST /api/v1/auth/refresh` — rotaciona o refresh token.
- `GET /api/v1/usuarios/me` — perfil do usuário autenticado (protegido).
- Swagger completo em `http://localhost:3000/docs`.

## Scripts

```bash
pnpm --filter api start:dev      # nest start --watch
pnpm --filter api build          # nest build
pnpm --filter api start:prod     # node dist/main.js
pnpm --filter api lint
pnpm --filter api test           # Jest unit
pnpm --filter api test:cov       # com coverage
pnpm --filter api test:e2e
pnpm --filter api seed           # popular DB local
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
```

## Variáveis de ambiente

Ver `/.env.example`. Principais:

- `DATABASE_URL` — Postgres.
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — chaves de assinatura.
- `REDIS_URL`, `REDIS_PASSWORD`.
- `RESEND_API_KEY` — envio de email.
- `SENTRY_DSN` — opcional.

## Docker

`Dockerfile` multi-stage (Alpine 20) na raiz deste app. Build:

```bash
docker compose -f docker-compose.dev.yml up --build api
# ou
docker build -f apps/api/Dockerfile -t toqe-api .
```

## Convenções

- DTOs com `class-validator` (migrarão para `nestjs-zod` na Fase 2 — schemas em `@toqe/contracts`).
- Multi-tenant: toda rota protegida exige `x-tenant-id`.
- Logs estruturados via `nestjs-pino`; erros 5xx capturados pelo filtro Sentry em `src/observabilidade/sentry.filter.ts`.
- Conventional Commits e fluxo descrito em [`/CONTRIBUTING.md`](../../CONTRIBUTING.md).
