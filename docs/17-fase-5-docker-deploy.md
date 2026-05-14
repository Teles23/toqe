# 17. Fase 5 — Docker, Deploy e Observabilidade

> **Status:** concluída · **Branch:** `arch/fase-5-docker-deploy` · **Base:** `feature/arquitetura-reorganizacao`
>
> Veja também: [`10-arquitetura-reorganizacao.md`](./10-arquitetura-reorganizacao.md) — plano original das 5 fases.

## Objetivo

Fechar o ciclo de reorganização arquitetural com melhorias de infraestrutura: healthchecks com check de DB, Dockerfiles otimizados com BuildKit cache, headers de segurança (Helmet + CSP), rate limiting e pipeline de release automatizado.

---

## Arquivos criados

| Arquivo                                    | Responsabilidade                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| `apps/api/src/health/health.controller.ts` | Endpoints `GET /health/live` (liveness) e `GET /health/ready` (readiness + DB) |
| `apps/api/src/health/health.module.ts`     | Módulo NestJS que registra o HealthController com PrismaModule                 |
| `.github/workflows/release.yml`            | Pipeline de build + push de imagens Docker para GHCR no push para `develop`    |

---

## Arquivos modificados

| Arquivo                                | Mudança                                                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/app.module.ts`           | Adiciona `ThrottlerModule` (60 req/min global), `ThrottlerGuard` como APP_GUARD, e importa `HealthModule`                          |
| `apps/api/src/main.ts`                 | Adiciona `helmet()` antes do CORS — headers de segurança HTTP                                                                      |
| `apps/api/src/auth/auth.controller.ts` | `@Throttle` no controller: limite de 10 req/min por IP (brute-force)                                                               |
| `apps/api/Dockerfile`                  | Cache mount pnpm: `--mount=type=cache,id=pnpm,...`; HEALTHCHECK aponta para `/health/ready`                                        |
| `apps/web/Dockerfile`                  | Reescrita: multi-stage correto com pnpm cache mount + `output: standalone`                                                         |
| `apps/web/next.config.js`              | Adiciona `output: "standalone"`, headers de segurança (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, CSP básico) |
| `docker-compose.yml`                   | healthcheck da API aponta para `/api/v1/health/ready`                                                                              |

---

## Endpoints de health

| Endpoint                   | Tipo                           | Resposta                            |
| -------------------------- | ------------------------------ | ----------------------------------- |
| `GET /api/v1/health`       | Simples (AppController legado) | `{ status, uptime, timestamp }`     |
| `GET /api/v1/health/live`  | Liveness                       | `{ status: "ok" }`                  |
| `GET /api/v1/health/ready` | Readiness + DB                 | `{ status: "ok", db: "connected" }` |

Dockerfiles e docker-compose usam `/health/ready` para healthchecks — falha se o banco estiver inacessível.

---

## Rate limiting (ThrottlerModule)

| Escopo                      | TTL | Limite    | Configurado em                  |
| --------------------------- | --- | --------- | ------------------------------- |
| Global (todos os endpoints) | 60s | 60 req/IP | `AppModule` via `APP_GUARD`     |
| Auth (`/auth/*`)            | 60s | 10 req/IP | `@Throttle` no `AuthController` |

---

## Segurança HTTP

**Helmet** (`main.ts`): aplica automaticamente os headers:

- `X-DNS-Prefetch-Control`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- E outros padrões OWASP

**CSP** (`next.config.js`): Content-Security-Policy básico para o frontend:

- `default-src 'self'`
- `connect-src 'self' https://*.sentry.io`
- `frame-ancestors 'none'`

---

## Pipeline de release (`.github/workflows/release.yml`)

- **Trigger:** push para branch `develop`
- **Matrix build:** `api` e `web` em paralelo
- **Registry:** GHCR (`ghcr.io/<owner>/toqe-api` e `toqe-web`)
- **Tags:** `sha-<short_sha>` + `latest`
- **Cache:** GitHub Actions cache (`type=gha`) para builds incrementais

---

## Packages instalados

```bash
# API
pnpm --filter api add @nestjs/throttler helmet
```

---

## Checklist de aceite

- [x] `tsc -p tsconfig.build.json --noEmit` na API: zero erros
- [x] `GET /health/live` → 200 `{ status: "ok" }`
- [x] `GET /health/ready` → 200 `{ status: "ok", db: "connected" }` com DB conectado
- [x] Helmet aplicado em `main.ts`
- [x] CSP e security headers em `next.config.js`
- [x] `@Throttle` no `AuthController` (10 req/min)
- [x] `ThrottlerGuard` global (60 req/min)
- [x] `release.yml` dispara no push para `develop`
- [x] Dockerfiles com `--mount=type=cache` para pnpm store
- [x] Web Dockerfile: multi-stage com `output: standalone`
- [x] Documentação criada (`docs/17-fase-5-docker-deploy.md`)
