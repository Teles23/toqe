# Estado Atual do Develop

**Data:** 2026-05-20
**Branch base:** develop (após merge das branches 41-44 + feat/super-admin)

---

## O que está funcionando

### Backend (NestJS + Prisma)

| Módulo             | Endpoints principais                                                      | Status      |
| ------------------ | ------------------------------------------------------------------------- | ----------- |
| `auth`             | POST /auth/login, /refresh, /logout, /register, /google, /2fa/\*          | ✅ completo |
| `barbearia`        | CRUD + validações multi-tenant                                            | ✅ completo |
| `agendamento`      | CRUD + /meus, /proximo, /atual                                            | ✅ completo |
| `servico`          | CRUD + `GET /servicos/metricas`                                           | ✅ completo |
| `usuario`          | Perfil, avatar upload, `GET /usuarios/me` (inclui `superAdmin`)           | ✅ completo |
| `agenda` (walk-in) | Fila de espera                                                            | ✅ completo |
| `relatorio`        | Métricas de barbearia                                                     | ✅ completo |
| `notificacao`      | WebSocket em tempo real                                                   | ✅ completo |
| `push-token`       | POST/DELETE /push-tokens                                                  | ✅ completo |
| `publico`          | GET /publico/:slug, /servicos, /barbeiros, /slots · POST /agendamentos    | ✅ completo |
| `admin`            | GET /admin/metrics, /barbearias, /activity, /revenue · PATCH plano/status | ✅ completo |
| `tenant`           | Guard multi-tenant via `x-tenant-id`                                      | ✅ completo |
| `health`           | GET /health                                                               | ✅ completo |

**Auth — flags de segurança:**

- `Usuario.superAdmin` (Boolean) — setado via `SUPER_ADMIN_EMAIL` no `.env` na inicialização
- `SuperAdminGuard` — proteção exclusiva das rotas `/admin/*`; super_admin **não** bypassa rotas de tenant (princípio do menor privilégio)
- `Barbearia.plano` — aceita `"free" | "basic" | "pro"` (migrado de `"free" | "pago"`)
- `PlanoLimite.preco` — campo `Decimal` com preços: free=R$0, basic=R$89, pro=R$189

### Frontend Web (Next.js + Tailwind)

| Feature                                              | Status      |
| ---------------------------------------------------- | ----------- |
| Dashboard (stats, agenda do dia)                     | ✅ completo |
| Serviços (CRUD + métricas reais)                     | ✅ completo |
| Agenda (agendamentos + status)                       | ✅ completo |
| Clientes                                             | ✅ completo |
| Barbeiros (incluindo modal Add Barbeiro redesenhado) | ✅ completo |
| Relatórios (ranking barbeiros, receita)              | ✅ completo |
| Configurações (perfil barbearia, tema)               | ✅ completo |
| Auth (login redesenhado, Google OAuth, 2FA)          | ✅ completo |
| Onboarding (fluxo redesenhado)                       | ✅ completo |
| Booking público (`/b/[slug]`)                        | ✅ completo |
| **Super Admin** (`/admin/*`)                         | ✅ completo |

**Super Admin — rotas:**

- `/admin` → redireciona para `/admin/overview`
- `/admin/overview` — KPIs globais (MRR, ARR, Barbearias, Atend./mês), atividade live, top tenants por MRR, breakdown por plano
- `/admin/barbearias` — tabela de todos os tenants com filtros de plano/status/busca + drawer de edição
- `/admin/receita` — MRR por mês (barras), breakdown por plano com % do total
- `/admin/health` — status da API (GET /health real) + cards de endpoints

**Auth — fluxo super admin:**

- Login em `/login` detecta `user.superAdmin === true` → redireciona para `/admin`
- `RequireSuperAdmin` no layout `/admin` bloqueia usuários não super_admin
- Acesso por URL direta; sem link no sidebar regular

### Mobile (Expo SDK 54 + React Native)

| Tela                      | Role     | Status                                    |
| ------------------------- | -------- | ----------------------------------------- |
| `/(cliente)/home`         | cliente  | ✅ hero card próximo agendamento real     |
| `/(cliente)/agendamentos` | cliente  | ✅ lista real via GET /agendamentos/meus  |
| `/(cliente)/buscar`       | cliente  | ✅ busca real via GET /barbearias/publico |
| `/(cliente)/perfil`       | cliente  | ✅ completo                               |
| `/(barbeiro)/agenda`      | barbeiro | ✅ agenda do dia + card "em atendimento"  |
| `/(barbeiro)/fila`        | barbeiro | ✅ fila walk-in                           |
| `/(barbeiro)/clientes`    | barbeiro | ✅ completo                               |
| `/(barbeiro)/perfil`      | barbeiro | ✅ completo                               |
| Push notifications        | todos    | ✅ registro de token Expo no login        |

### Infraestrutura

- CI/CD: GitHub Actions com lint + types + tests + build + audit + deploy
- Docker: Dockerfile API + docker-compose para desenvolvimento
- Sentry: filtro de exceções 5xx alinhado com `ApiErrorPayload`
- Observabilidade: `nestjs-pino` (logs JSON em prod)
- Prisma migration: `20260520000000_add_super_admin_and_planos`

---

## Débitos técnicos conhecidos

| #   | Descrição                                                                    | Branch                                |
| --- | ---------------------------------------------------------------------------- | ------------------------------------- |
| 4   | `packages/config` tinha `env.ts` provisório — implementado com conteúdo real | `chore/packages-config`               |
| 5   | Docs desatualizados (fases marcadas como pendentes já foram concluídas)      | `docs/atualizar-status`               |
| 6   | Baseline de métricas nunca foi medido formalmente                            | `chore/metricas-baseline`             |
| 7   | `style={{}}` legados no web (`BarbeirosRanking` e outros)                    | `refactor/remover-style-inline`       |
| 8   | `sentry.filter.ts` emitia payload diferente do `ApiErrorPayload`             | `fix/sentry-filter-api-error-payload` |
| 9   | Super Admin Phase 2: impersonação real (JWT temporário como tenant)          | fase 2                                |
| 10  | Super Admin Phase 2: integração Prometheus/Sentry no Health tab              | fase 2                                |

---

## Qualidade

| Frente | Testes      | Lint | Types |
| ------ | ----------- | ---- | ----- |
| API    | 213 passing | ✅   | ✅    |
| Web    | 170 passing | ✅   | ✅    |
| Mobile | 256 passing | ✅   | ✅    |

---

## Próximas features planejadas

Consultar `docs/toqe_plano_estrategico.md` para o roadmap completo. Itens de médio prazo ainda abertos:

- Testes de integração com Testcontainers (BD real)
- Testes E2E web (Playwright)
- Testes E2E mobile (Maestro)
- Testes de carga (k6)
- Medição formal de baseline de performance (cold start, bundle size)
- Super Admin Phase 2: impersonação de tenant, métricas Prometheus, alertas Sentry
