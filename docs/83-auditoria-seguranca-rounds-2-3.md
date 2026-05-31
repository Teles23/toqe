# 83 — Auditoria de Segurança Rounds 2 e 3

**Status:** Implementado
**Branch:** `fix/security-audit-round3`
**Base:** develop
**PR:** #111

---

## Contexto

Continuação da auditoria sistêmica de segurança (doc 82). Três rodadas de análise e correção cobrindo Backend Fase 1 (Round 2, já mergeado), Backend Fase 2 (Round 3 — primeira passada) e Frontend (Fase 3).

---

## Round 2 — Backend (mergeado em develop via PR anterior)

### Achados corrigidos

| #   | Severidade | Descrição                                                                                        | Arquivo                                                                      |
| --- | ---------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1   | 🔴 Crítico | `tokenHash` O(1): lookup por hash SHA-256 de refresh token — elimina full table scan             | `auth.service.ts`, `refresh-token` migration                                 |
| 2   | 🔴 Crítico | Webhook Asaas: convertido de interface para class-validator DTO com `@IsEnum`, `@ValidateNested` | `asaas-webhook.dto.ts`, `asaas.controller.ts`                                |
| 3   | 🟠 Alto    | PII em Redis: jobs da fila passaram a armazenar apenas IDs numéricos; consumer busca dados no DB | `notificacao.types.ts`, `notificacao.consumer.ts`, `notificacao.producer.ts` |
| 4   | 🟠 Alto    | Open redirect: parâmetro `?redirect=` validado com regex `/^\/(?!\/)/.test()` + sem `://`        | `auth-provider.tsx`                                                          |
| 5   | 🟠 Alto    | Body size limit: `express.json({ limit: '1mb' })` + `urlencoded`                                 | `main.ts`                                                                    |

---

## Round 3 — Backend Fase 1

### Achados corrigidos

| #   | Severidade | Descrição                                                                                                               | Arquivo                                               |
| --- | ---------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | 🟠 Alto    | Cross-tenant slot isolation: `barCodigo` ausente nas queries de `agendamento` e `bloqueioAgenda` em `getAvailableSlots` | `agenda.service.ts:193-210`                           |
| 2   | 🟠 Alto    | JWT tokenVersion: novo campo `TQE_USR_TOKEN_VERSION`; access tokens invalidados automaticamente na troca de senha       | `schema.prisma`, `auth.service.ts`, `jwt.strategy.ts` |
| 3   | 🟠 Alto    | 2FA secret exposto: `setup2Fa` retornava o segredo TOTP bruto na resposta HTTP                                          | `auth.service.ts`, web + mobile                       |

#### Detalhes — JWT tokenVersion

```sql
-- migration 20260530000004_token_version
ALTER TABLE "TQE_USUARIO" ADD COLUMN "TQE_USR_TOKEN_VERSION" INTEGER NOT NULL DEFAULT 1;
```

```ts
// generateTokens agora embute tokenVersion no payload JWT
const payload = { sub: codigo, jti: randomUUID(), tokenVersion: user.tokenVersion };

// JwtStrategy.validate() rejeita tokens com versão desatualizada
if (payload.tokenVersion !== dbVersion) {
  throw new UnauthorizedException('Token inválido — senha alterada');
}

// changePassword e resetPassword incrementam atomicamente
data: { senhaHash, tokenVersion: { increment: 1 } }
```

#### Detalhes — 2FA secret removal

Camadas atualizadas: API (`auth.service.ts`), web (`TwoFaModal.tsx`, `SecaoSeguranca.tsx`, `auth.service.ts`, `msw-handlers.ts`), mobile (`use-2fa.ts`, `2fa.tsx`, `use-2fa.test.tsx`).

---

## Round 3 — Backend Fase 2

### Achados corrigidos (auditoria externa)

| #   | Severidade | Descrição                                                                      | Arquivo                                                                |
| --- | ---------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | 🔴 Crítico | `$executeRawUnsafe` → `$executeRaw` tagged template                            | `tenant-context.service.ts`                                            |
| 2   | 🔴 Crítico | `ValidationPipe` sem `forbidNonWhitelisted` + `forbidUnknownValues`            | `main.ts`                                                              |
| 3   | 🟠 Alto    | `TenantInterceptor` lia `req.body?.barCodigo` (parameter tampering) — removido | `tenant.interceptor.ts`                                                |
| 4   | 🟠 Alto    | `$transaction` sem `timeout`/`maxWait`                                         | `tenant-context.service.ts`                                            |
| 5   | 🟠 Alto    | Swagger `persistAuthorization: true`                                           | `main.ts`                                                              |
| 6   | 🟡 Médio   | `Prisma.TransactionClient` tipo manual — substituído pelo oficial              | `tenant-context.service.ts`, `tenant.interceptor.ts`, `jwt-request.ts` |

#### Falsos positivos identificados

| #   | Achado original                | Por quê é falso                                                  |
| --- | ------------------------------ | ---------------------------------------------------------------- |
| –   | Swagger exposto em produção    | Já estava atrás de `NODE_ENV !== 'production'`                   |
| –   | CORS depende totalmente de env | Já lança erro em produção se `CORS_ORIGINS` não estiver definido |

#### Detalhes — transaction hardening

```ts
return this.prisma.$transaction(
  async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant', ${barCodigo.toString()}, true)`;
    return fn(tx);
  },
  { timeout: 10_000, maxWait: 5_000 },
);
```

---

## Round 3 — Correções do Codex Review (PR #111)

Após criação da PR, o Codex identificou dois bugs reais:

| #   | Severidade | Descrição                                                                                        | Arquivo                                              |
| --- | ---------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 1   | 🟠 Alto    | Status uppercase: `['CONCLUIDO', 'CANCELADO', 'NO_SHOW']` hardcoded não batia com enum lowercase | `agendamento.service.ts:617,590,643`                 |
| 2   | 🟡 Médio   | change-password BFF não enviava `refreshTokenAtual` → usuário deslogado após trocar senha        | `apps/web/src/app/api/auth/change-password/route.ts` |

#### Correção status

```ts
// Antes (bug)
const statusFinais = ['CONCLUIDO', 'CANCELADO', 'NO_SHOW'];

// Depois (usa constante do enum — lowercase)
if ((STATUSES_ENCERRADOS as readonly string[]).includes(agendamento.status)) { ... }

// SQL raw também corrigido
AND "TQE_AGD_STATUS" NOT IN ('cancelado', 'no_show')
```

---

## Fase 3 — Frontend Next.js

### Auditoria completa — resultado

| Área                                          | Status             |
| --------------------------------------------- | ------------------ |
| Tokens httpOnly cookies (`sameSite: strict`)  | ✅ OK              |
| Refresh race condition (`_refreshPromise`)    | ✅ OK              |
| Logout com revogação servidor                 | ✅ OK              |
| Open redirect após login                      | ✅ OK              |
| `dangerouslySetInnerHTML` em dados de usuário | ✅ OK — não existe |
| CSS sanitizado em charts                      | ✅ OK              |
| `NEXT_PUBLIC_*` sem segredos                  | ✅ OK              |
| CSRF (`sameSite: strict`)                     | ✅ OK              |
| Middleware Next.js bloqueando rotas privadas  | ✅ OK              |
| SSR sem dados sensíveis no HTML               | ✅ OK              |

### Achados corrigidos

| #   | Severidade | Descrição                                                                    | Arquivo                                            |
| --- | ---------- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | 🟠 Alto    | `INTERNAL_API_URL` com fallback silencioso para `localhost:3000` em produção | `apps/web/src/app/api/_lib/internal-api.ts` (novo) |
| 2   | 🟠 Alto    | `/admin/*` marcada como rota pública no proxy                                | `apps/web/src/shared/config/routes.ts`             |

#### INTERNAL_API helper centralizado

```ts
// apps/web/src/app/api/_lib/internal-api.ts
function resolveInternalApi(): string {
  const url =
    process.env.INTERNAL_API_URL ??
    (process.env.NODE_ENV !== "production"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1")
      : null);

  if (!url) {
    throw new Error(
      "INTERNAL_API_URL is required in production but is not set.",
    );
  }
  return url;
}
export const INTERNAL_API = resolveInternalApi();
```

17 BFF route handlers migrados para importar desse helper.

#### /admin privada

```ts
// Antes — admin marcada como pública (bug)
if (pathname.startsWith("/admin")) return true;

// Depois — removida; proxy exige access_token cookie
// RequireSuperAdmin continua como segunda camada no componente
```

---

## Arquivos criados/modificados (Round 3 completo)

| Arquivo                                                                 | Tipo       | Descrição                                                                                                          |
| ----------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `apps/api/prisma/schema.prisma`                                         | Modificado | `tokenVersion Int @default(1)` em `Usuario`                                                                        |
| `apps/api/prisma/migrations/20260530000004_token_version/migration.sql` | Criado     | `ALTER TABLE TQE_USUARIO ADD COLUMN TQE_USR_TOKEN_VERSION`                                                         |
| `apps/api/src/agenda/agenda.service.ts`                                 | Modificado | `barCodigo` em queries de slot + import `STATUSES_ENCERRADOS` + status lowercase                                   |
| `apps/api/src/agendamento/agendamento.service.ts`                       | Modificado | Status uppercase → `STATUSES_ENCERRADOS` + SQL raw lowercase                                                       |
| `apps/api/src/auth/auth.service.ts`                                     | Modificado | `tokenVersion` em `generateTokens`; increment em `changePassword`/`resetPassword`; `secret` removido de `setup2Fa` |
| `apps/api/src/auth/strategies/jwt.strategy.ts`                          | Modificado | Validação de `tokenVersion` em `validate()`                                                                        |
| `apps/api/src/auth/auth.service.spec.ts`                                | Modificado | `tokenVersion: 1` em `mockUsuario`; mock `prisma.usuario.findUnique`                                               |
| `apps/api/src/tenant/tenant-context/tenant-context.service.ts`          | Modificado | `$executeRaw` tagged template; `Prisma.TransactionClient`; `timeout`/`maxWait`                                     |
| `apps/api/src/tenant/tenant/tenant.interceptor.ts`                      | Modificado | Remove `req.body?.barCodigo`; `Prisma.TransactionClient`                                                           |
| `apps/api/src/common/types/jwt-request.ts`                              | Modificado | `Prisma.TransactionClient` em `runInTenant`                                                                        |
| `apps/api/src/main.ts`                                                  | Modificado | `forbidNonWhitelisted`; `forbidUnknownValues`; `persistAuthorization: false`; body limits                          |
| `apps/api/src/notificacao/notificacao.types.ts`                         | Modificado | `AgendamentoConfirmadoJob` apenas com IDs (sem PII)                                                                |
| `apps/api/src/notificacao/notificacao.consumer.ts`                      | Modificado | Busca dados do DB via `PrismaService`                                                                              |
| `apps/api/src/asaas/asaas-webhook.dto.ts`                               | Modificado | class-validator DTO com `@IsEnum`, `@ValidateNested`                                                               |
| `apps/web/src/app/api/_lib/internal-api.ts`                             | Criado     | Helper centralizado com validação obrigatória em produção                                                          |
| `apps/web/src/app/api/auth/*/route.ts` (17 arquivos)                    | Modificado | Import do helper centralizado                                                                                      |
| `apps/web/src/app/api/auth/change-password/route.ts`                    | Modificado | Passa `refreshTokenAtual` para preservar sessão atual                                                              |
| `apps/web/src/shared/config/routes.ts`                                  | Modificado | `/admin` deixou de ser rota pública                                                                                |
| `apps/web/src/features/auth/components/TwoFaModal.tsx`                  | Modificado | Prop `secret` removida                                                                                             |
| `apps/web/src/features/configuracoes/components/SecaoSeguranca.tsx`     | Modificado | Estado `secret` removido                                                                                           |
| `apps/mobile/src/shared/hooks/perfil/use-2fa.ts`                        | Modificado | `TwoFaSetupResponse.secret` removido                                                                               |
| `apps/mobile/app/(barbeiro)/perfil/2fa.tsx`                             | Modificado | Seção de chave manual removida                                                                                     |
