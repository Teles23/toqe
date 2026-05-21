# 45 — Super Admin (`/admin/*`)

**Status:** Ativo (Phase 1) | **Branch:** `feat/super-admin` | **Base:** develop

## Contexto

Painel interno exclusivo para o fundador do Toqe controlar os tenants (barbearias clientes do SaaS). Tela separada do dashboard regular — acessada pela mesma app Next.js em `/admin/*` — mas completamente isolada por autenticação (`superAdmin` boolean no `Usuario`) e autorização (`SuperAdminGuard` em todas as rotas `/admin/*` do backend).

O protótipo de referência era `Downloads/toqe (1)/Toqe Super Admin.html`. O design segue o estilo ultra-dark (`#080808`/`#101010`) com accent âmbar (`#F4B400`) e JetBrains Mono para números — fiel ao protótipo.

### Decisão de segurança: menor privilégio

Super admin acessa **exclusivamente** `/admin/*`. Rotas normais de barbearia (tenant data) retornam **403** para super_admin — o bypass `if (user?.perfil === 'super_admin') return true` que existia no `RolesGuard` foi **removido**. Isso evita que uma conta de super_admin comprometida tenha acesso indevido aos dados dos clientes.

## Arquitetura

```
Login (/login) → detecta user.superAdmin === true → router.push('/admin')
                                                         ↓
                                                   (admin)/layout.tsx
                                                   RequireSuperAdmin
                                                         ↓
                                         AdminSidebar + <main> conteúdo
```

### Bootstrap do super admin

Definir a variável de ambiente `SUPER_ADMIN_EMAIL` no `.env` (ver `.env.example`). Na inicialização da API (`onApplicationBootstrap` em `AppService`), o sistema executa:

```ts
prisma.usuario.updateMany({ where: { email }, data: { superAdmin: true } });
```

Idempotente — pode rodar toda vez que a API sobe. O e-mail **nunca é logado**.

## Endpoints adicionados

Todos protegidos por `@UseGuards(JwtAuthGuard, SuperAdminGuard)`. Sem `TenantGuard` nem `RolesGuard`.

| Método  | Rota                                       | Descrição                                             |
| ------- | ------------------------------------------ | ----------------------------------------------------- |
| `GET`   | `/admin/metrics`                           | MRR, ARR, total/ativos tenants, barbeiros, agend./mês |
| `GET`   | `/admin/barbearias?search=&plano=&status=` | Todos os tenants com filtros                          |
| `GET`   | `/admin/barbearias/:id`                    | Detalhe de um tenant                                  |
| `PATCH` | `/admin/barbearias/:id/plano`              | Muda plano (`free\|basic\|pro`)                       |
| `PATCH` | `/admin/barbearias/:id/status`             | Muda status (`ativo\|inativo\|suspenso`)              |
| `GET`   | `/admin/revenue`                           | MRR por mês (últimos 7) + breakdown por plano         |
| `GET`   | `/admin/activity`                          | Feed de atividade recente (signups, upgrades)         |

## Mudanças no schema Prisma

Migration: `20260520000000_add_super_admin_and_planos`

| Tabela             | Campo                 | Tipo            | Default            |
| ------------------ | --------------------- | --------------- | ------------------ |
| `TQE_USUARIO`      | `TQE_USR_SUPER_ADMIN` | `BOOLEAN`       | `false`            |
| `TQE_PLANO_LIMITE` | `TQE_PLI_PRECO`       | `DECIMAL(10,2)` | `0`                |
| `TQE_BARBEARIA`    | `plano`               | comentário      | `free\|basic\|pro` |

Dados seed via migration SQL: `pago → basic`, preços `free=R$0, basic=R$89, pro=R$189`.

## Arquivos modificados / criados

### Backend

| Arquivo                                                                              | Operação                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                                      | Adiciona `superAdmin`, `preco`, comenta enum plano        |
| `apps/api/prisma/migrations/20260520000000_add_super_admin_and_planos/migration.sql` | Nova migration                                            |
| `apps/api/src/admin/admin.module.ts`                                                 | Novo módulo                                               |
| `apps/api/src/admin/admin.controller.ts`                                             | 7 endpoints com `SuperAdminGuard`                         |
| `apps/api/src/admin/admin.service.ts`                                                | Lógica de métricas, receita, atividade                    |
| `apps/api/src/admin/admin.service.spec.ts`                                           | 9 testes unitários                                        |
| `apps/api/src/admin/guards/super-admin.guard.ts`                                     | Guard exclusivo para `/admin/*`                           |
| `apps/api/src/admin/dto/update-plano.dto.ts`                                         | DTO com schema Zod                                        |
| `apps/api/src/admin/dto/update-status.dto.ts`                                        | DTO com schema Zod                                        |
| `apps/api/src/app.module.ts`                                                         | Registra `AdminModule`                                    |
| `apps/api/src/app.service.ts`                                                        | Bootstrap `SUPER_ADMIN_EMAIL` no `onApplicationBootstrap` |
| `apps/api/src/app.controller.spec.ts`                                                | Mock `PrismaService` no test module                       |
| `apps/api/src/auth/strategies/jwt.strategy.ts`                                       | Retorna `superAdmin` no payload JWT                       |
| `apps/api/src/auth/guards/roles.guard.ts`                                            | Remove bypass `super_admin` (menor privilégio)            |
| `apps/api/src/auth/auth.service.spec.ts`                                             | Adiciona `superAdmin: false` nos mocks                    |
| `apps/api/src/common/types/jwt-request.ts`                                           | Adiciona `superAdmin?` ao tipo `TenantRequest.user`       |
| `apps/api/src/usuario/usuario.service.ts`                                            | Inclui `superAdmin` no `SELECT_PERFIL`                    |
| `apps/api/.env.example`                                                              | Adiciona `SUPER_ADMIN_EMAIL` documentado                  |

### Contracts

| Arquivo                                   | Operação                                                                                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts/src/schemas/admin.ts` | Schemas Zod: `updatePlanoSchema`, `updateStatusAdminSchema`, `adminBarbeariaSchema`, `adminMetricsSchema`, `adminRevenueSchema`, `adminActivityItemSchema` |
| `packages/contracts/src/schemas/index.ts` | Re-exporta `admin.ts`                                                                                                                                      |

### Shared

| Arquivo                              | Operação                                       |
| ------------------------------------ | ---------------------------------------------- |
| `packages/shared/src/types/index.ts` | Adiciona `superAdmin?: boolean` em `UsuarioMe` |

### Frontend

| Arquivo                                                              | Operação                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/web/src/shared/providers/auth-provider.tsx`                    | Mapeia `superAdmin`, redireciona para `/admin` pós-login           |
| `apps/web/src/shared/components/RequireSuperAdmin.tsx`               | Guard client-side para `user.superAdmin === true`                  |
| `apps/web/src/test/render-helpers.tsx`                               | Adiciona `superAdmin: false` ao `mockAuthContext.user`             |
| `apps/web/src/app/(admin)/layout.tsx`                                | Layout com `RequireSuperAdmin` + `AdminSidebar`                    |
| `apps/web/src/app/(admin)/admin/page.tsx`                            | Redirect para `/admin/overview`                                    |
| `apps/web/src/app/(admin)/admin/overview/page.tsx`                   | Monta `OverviewView`                                               |
| `apps/web/src/app/(admin)/admin/barbearias/page.tsx`                 | Monta `TenantsList`                                                |
| `apps/web/src/app/(admin)/admin/receita/page.tsx`                    | Monta `RevenueView`                                                |
| `apps/web/src/app/(admin)/admin/health/page.tsx`                     | Monta `HealthView`                                                 |
| `apps/web/src/features/super-admin/types/index.ts`                   | Interfaces TypeScript da feature                                   |
| `apps/web/src/features/super-admin/services/admin.service.ts`        | Funções HTTP (api.get/patch)                                       |
| `apps/web/src/features/super-admin/hooks/use-admin-metrics.ts`       | `useAdminMetrics`, `useAdminActivity`                              |
| `apps/web/src/features/super-admin/hooks/use-admin-tenants.ts`       | `useAdminTenants`, `useUpdateTenantPlano`, `useUpdateTenantStatus` |
| `apps/web/src/features/super-admin/hooks/use-admin-revenue.ts`       | `useAdminRevenue`                                                  |
| `apps/web/src/features/super-admin/components/AdminSidebar.tsx`      | Sidebar ultra-dark com nav 4 itens                                 |
| `apps/web/src/features/super-admin/components/OverviewView.tsx`      | KPIs, atividade global, plan breakdown, top tenants                |
| `apps/web/src/features/super-admin/components/TenantsList.tsx`       | Tabela filtrada + abertura de drawer                               |
| `apps/web/src/features/super-admin/components/TenantDrawer.tsx`      | Drawer: meta, plano, status, zona de risco, footer                 |
| `apps/web/src/features/super-admin/components/RevenueView.tsx`       | KPIs, gráfico de barras MRR/mês, breakdown por plano               |
| `apps/web/src/features/super-admin/components/HealthView.tsx`        | Status API real + endpoint cards estáticos                         |
| `apps/web/src/features/super-admin/components/OverviewView.spec.tsx` | 4 testes                                                           |
| `apps/web/src/features/super-admin/components/TenantsList.spec.tsx`  | 4 testes                                                           |
| `apps/web/src/features/super-admin/components/TenantDrawer.spec.tsx` | 4 testes                                                           |
| `apps/web/src/test/msw-handlers.ts`                                  | Handlers `/admin/*`                                                |
| `apps/web/src/app/globals.css`                                       | ~450 linhas de tokens CSS `.tqe-super-admin`                       |
| `apps/web/eslint.config.js`                                          | Override `no-restricted-syntax` para `super-admin/components/**`   |

## Testes

| Suite                   | Testes | Cobertura                                                                                                   |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| `admin.service.spec.ts` | 9      | getMetrics MRR, getBarbearias filtros, getBarbeariaById 404, updatePlano, updateStatus (suspender/reativar) |
| `OverviewView.spec.tsx` | 4      | KPI labels, valores de métricas, feed de atividade, breakdown por plano                                     |
| `TenantsList.spec.tsx`  | 4      | Render tabela, filtro por plano, campo de busca, abertura do drawer                                         |
| `TenantDrawer.spec.tsx` | 4      | Render dados, PATCH plano ao salvar, PATCH status ao clicar, fechar com ×                                   |

## Phase 2 (pendente)

- **Impersonação de tenant**: gerar JWT temporário com perfil do dono do tenant para acessar `/dashboard` como se fosse o tenant. Botão "Entrar como tenant" está no drawer com TODO.
- **Métricas reais no Health tab**: integração Prometheus/Sentry para latência P95 e erros 5xx reais.
- **Alertas**: feed de atividade com eventos de churn em tempo real via WebSocket.
