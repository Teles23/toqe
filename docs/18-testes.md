# 18. Fase 6 — Camadas de Testes

> **Status:** concluída · **Branch:** `feature/testes` · **Base:** `develop`
>
> Veja também: [`17-fase-5-docker-deploy.md`](./17-fase-5-docker-deploy.md) — fase anterior.

## Objetivo

Implementar 6 camadas de teste cobrindo os módulos de auth, agendamento, barbearia, serviços, usuário, agenda e tenant isolation. A cobertura vai de testes unitários isolados até load testing, passando por integração real com banco, E2E web e E2E mobile.

---

## Arquivos criados

| Arquivo                                                          | Responsabilidade                                                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/src/test/prisma-mock.factory.ts`                       | Factory `createPrismaMock()` — mock reutilizável de todos os modelos Prisma                                                    |
| `apps/api/src/agendamento/agendamento.service.spec.ts`           | Unit: create (sucesso, conflito, serviço inexistente), findAll, findOne, patchStatus, cancel                                   |
| `apps/api/src/barbearia/barbearia.service.spec.ts`               | Unit: create (sucesso, slug dup), convidarMembro (sucesso, inexistente, já membro), removerMembro (sucesso, inexistente, dono) |
| `apps/api/src/servico/servico.service.spec.ts`                   | Unit: create, findAll, findOne (found/not found), update, remove (soft delete)                                                 |
| `apps/api/src/usuario/usuario.service.spec.ts`                   | Unit: create (sucesso, email dup), findByEmail, findById, me (transform membros→barbearias), update                            |
| `apps/api/test/integration/setup.ts`                             | globalSetup: sobe container PostgreSQL via Testcontainers + `prisma migrate deploy`                                            |
| `apps/api/test/integration/teardown.ts`                          | globalTeardown: destrói container PostgreSQL                                                                                   |
| `apps/api/test/integration/jest-integration.json`                | Jest config separada para integration (testRegex, globalSetup/Teardown, timeout 60s)                                           |
| `apps/api/test/integration/auth.integration.spec.ts`             | Integration: register → login → refresh (rotação real) → logout                                                                |
| `apps/api/test/integration/agendamento.integration.spec.ts`      | Integration: criar barbearia + serviço + agendamento → conflito detectado                                                      |
| `apps/api/test/integration/barbearia.integration.spec.ts`        | Integration: create → convidarMembro → findMembros                                                                             |
| `apps/api/test/integration/tenant-isolation.integration.spec.ts` | Integration: serviços de barbearia A não aparecem em queries de barbearia B                                                    |
| `apps/web/vitest.config.ts`                                      | Config Vitest: environment jsdom, globals true, setupFiles, alias `@` → `/`                                                    |
| `apps/web/src/test/setup.ts`                                     | Setup Vitest: importa `@testing-library/jest-dom`, lifecycle do MSW server                                                     |
| `apps/web/src/test/msw-handlers.ts`                              | Handlers MSW: `POST /auth/login`, `GET /agendamentos`, `GET /servicos`, `GET /barbearia`                                       |
| `apps/web/playwright.config.ts`                                  | Config Playwright: baseURL, projects chromium + firefox, screenshot on failure, retries CI                                     |
| `apps/web/e2e/fixtures/auth.fixture.ts`                          | Fixture Playwright: `authenticatedPage` — faz login via UI e expõe page autenticada                                            |
| `apps/web/e2e/auth.spec.ts`                                      | E2E: login válido → dashboard; login inválido → erro; logout → login                                                           |
| `apps/web/e2e/agendamento.spec.ts`                               | E2E: selecionar barbeiro → data → serviço → confirmar → ver na lista                                                           |
| `apps/web/e2e/configuracoes.spec.ts`                             | E2E: navegar accordion, toggle notificação → feedback imediato                                                                 |
| `apps/web/e2e/servicos.spec.ts`                                  | E2E: listar → criar → editar → desativar                                                                                       |
| `apps/web/e2e/barbeiros.spec.ts`                                 | E2E: listar → convidar → ver métricas                                                                                          |
| `apps/mobile/.maestro/flows/auth/login.yaml`                     | Maestro: launchApp → preencher credenciais → assertVisible "Bem-vindo"                                                         |
| `apps/mobile/.maestro/flows/auth/logout.yaml`                    | Maestro: login → menu → Sair → assertVisible campo email                                                                       |
| `apps/mobile/.maestro/flows/agendamento/novo-agendamento.yaml`   | Maestro: login → Novo Agendamento → barbeiro → data → serviço → Confirmar                                                      |
| `apps/mobile/.maestro/flows/barbeiros/listar-barbeiros.yaml`     | Maestro: login → Barbeiros → assertVisible lista                                                                               |
| `tools/load/k6.config.js`                                        | Thresholds base: `p(95)<500ms`, `rate<1%` + `BASE_URL` configurável                                                            |
| `tools/load/scenarios/auth-load.js`                              | k6: POST `/auth/login` — 100 VUs, 2 minutos                                                                                    |
| `tools/load/scenarios/agendamento-load.js`                       | k6: GET `/agendamentos` — spike test (0→200→0 VUs)                                                                             |
| `tools/load/scenarios/barbearia-load.js`                         | k6: GET `/barbearia/:id` — soak test (20 VUs, 10 minutos)                                                                      |
| `tools/load/utils/auth.js`                                       | Helper k6: obtém access token via login antes do teste                                                                         |
| `tools/load/utils/tenant.js`                                     | Helper k6: monta headers `Authorization` + `x-tenant-id`                                                                       |
| `tools/load/README.md`                                           | Instruções para instalar k6 e rodar cada cenário                                                                               |

---

## Arquivos modificados

| Arquivo                                                             | Mudança                                                                                                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/src/auth/auth.service.spec.ts`                            | Reescrito: cenários reais de login, register, refresh (rotação), logout com mocks bcrypt                                                                                 |
| `apps/api/src/agenda/agenda.service.spec.ts`                        | Corrigido: providers com `PrismaService` mockado                                                                                                                         |
| `apps/api/src/agenda/agenda.controller.spec.ts`                     | Corrigido: `AgendaService` mockado + guard overrides                                                                                                                     |
| `apps/api/src/agendamento/agendamento.controller.spec.ts`           | Corrigido: `AgendamentoService` mockado + guard overrides                                                                                                                |
| `apps/api/src/auth/auth.controller.spec.ts`                         | Corrigido: `AuthService` mockado                                                                                                                                         |
| `apps/api/src/barbearia/barbearia.controller.spec.ts`               | Corrigido: `BarbeariaService` mockado + guard overrides (incluindo `FeatureFlagGuard`)                                                                                   |
| `apps/api/src/servico/servico.controller.spec.ts`                   | Corrigido: `ServicoService` mockado + guard overrides                                                                                                                    |
| `apps/api/src/usuario/usuario.controller.spec.ts`                   | Corrigido: `UsuarioService` mockado                                                                                                                                      |
| `apps/api/src/tenant/tenant-context/tenant-context.service.spec.ts` | Corrigido: `PrismaService` mockado                                                                                                                                       |
| `apps/api/package.json`                                             | Adiciona `@faker-js/faker`, `testcontainers`, `@testcontainers/postgresql`; script `test:integration`                                                                    |
| `apps/web/package.json`                                             | Adiciona `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/*`, `msw`, `@playwright/test`; scripts `test`, `test:watch`, `test:cov`, `test:e2e`, `test:e2e:ui` |
| `apps/mobile/package.json`                                          | Adiciona script `test:e2e` (`maestro test .maestro/flows`)                                                                                                               |
| `turbo.json`                                                        | Adiciona pipelines `test` (`outputs: coverage/**`) e `test:e2e` (`outputs: playwright-report/**`)                                                                        |

---

## Diagrama das 6 camadas

```
┌─────────────────────────────────────────────────────────────┐
│  Camada 6 — Load Testing (k6)         tools/load/           │
├─────────────────────────────────────────────────────────────┤
│  Camada 5 — E2E Mobile (Maestro)      apps/mobile/.maestro/ │
├─────────────────────────────────────────────────────────────┤
│  Camada 4 — E2E Web (Playwright)      apps/web/e2e/         │
├─────────────────────────────────────────────────────────────┤
│  Camada 3 — Integration BE (Testcontainers) apps/api/test/  │
├─────────────────────────────────────────────────────────────┤
│  Camada 2 — Unit FE (Vitest + MSW)    apps/web/src/test/    │
├─────────────────────────────────────────────────────────────┤
│  Camada 1 — Unit BE (Jest)            apps/api/src/         │
└─────────────────────────────────────────────────────────────┘
```

---

## Cobertura por módulo

| Módulo           | Unit BE                                          | Integration                      | E2E Web | E2E Mobile |
| ---------------- | ------------------------------------------------ | -------------------------------- | ------- | ---------- |
| auth             | ✅ login, register, refresh, logout              | ✅ fluxo completo + rotação real | ✅      | ✅         |
| agendamento      | ✅ create, findAll, findOne, patchStatus, cancel | ✅ conflito detectado            | ✅      | ✅         |
| barbearia        | ✅ create, convidar, remover                     | ✅ create + membros              | —       | —          |
| servico          | ✅ CRUD + soft delete                            | —                                | ✅      | —          |
| usuario          | ✅ create, me, update                            | —                                | —       | —          |
| agenda           | ✅ defined                                       | —                                | —       | —          |
| tenant isolation | —                                                | ✅ dados isolados por barbearia  | —       | —          |
| barbeiros        | —                                                | —                                | ✅      | ✅         |
| configurações    | —                                                | —                                | ✅      | —          |

---

## Como rodar cada camada

### Camada 1 — Unit BE

```bash
pnpm --filter api test
pnpm --filter api test:cov
```

### Camada 2 — Unit FE

```bash
pnpm --filter web test
pnpm --filter web test:watch
```

### Camada 3 — Integration BE

> Requer Docker em execução — Testcontainers sobe e destrói o container automaticamente.

```bash
pnpm --filter api test:integration
```

### Camada 4 — E2E Web

> Requer a aplicação web em execução em `http://localhost:3001`.

```bash
pnpm --filter web dev        # em outro terminal
pnpm --filter web test:e2e
pnpm --filter web test:e2e:ui  # modo interativo
```

### Camada 5 — E2E Mobile

> Requer Maestro CLI instalado globalmente e emulador ativo.

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash  # instalar Maestro
maestro test apps/mobile/.maestro/flows
```

### Camada 6 — Load Testing

> Requer k6 instalado globalmente. Veja `tools/load/README.md`.

```bash
k6 run tools/load/scenarios/auth-load.js
k6 run tools/load/scenarios/agendamento-load.js
BASE_URL=https://staging.toqe.com k6 run tools/load/scenarios/barbearia-load.js
```

---

## Thresholds de performance (k6)

| Métrica                   | Threshold |
| ------------------------- | --------- |
| `http_req_duration` p(95) | < 500ms   |
| `http_req_failed` rate    | < 1%      |
