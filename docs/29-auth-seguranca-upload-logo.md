# 29 — Auth: Alterar Senha, Sessões Ativas, 2FA e Upload de Logo

**Status:** Concluído
**Branch:** feature/novo-agendamento
**Base:** develop

---

## Contexto

Quatro funcionalidades de segurança/configuração que existiam como scaffold no frontend (botões e UI sem lógica) foram completadas com backend real, BFF proxies e hooks conectados.

---

## Arquivos criados / modificados

### Backend (API)

| Arquivo                                                                     | Ação                                                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                             | Campos `twoFaSecret`, `twoFaEnabled` em `Usuario`                                                                                     |
| `apps/api/prisma/migrations/20260515000002_add_two_fa_fields/migration.sql` | Criado — ALTER TABLE para campos 2FA                                                                                                  |
| `apps/api/src/auth/auth.service.ts`                                         | Métodos: `changePassword`, `listSessions`, `revokeSession`, `revokeAllSessions`, `setup2Fa`, `enable2Fa`, `disable2Fa`, `verifyTwoFa` |
| `apps/api/src/auth/auth.controller.ts`                                      | 8 novos endpoints (change-password, sessions, 2fa/\*)                                                                                 |
| `apps/api/src/auth/dto/change-password.dto.ts`                              | Criado                                                                                                                                |
| `apps/api/src/auth/dto/two-fa-setup.dto.ts`                                 | Criado                                                                                                                                |
| `apps/api/src/auth/dto/two-fa-verify.dto.ts`                                | Criado                                                                                                                                |
| `apps/api/src/barbearia/barbearia.controller.ts`                            | `POST :barCodigo/logo` com multer                                                                                                     |
| `apps/api/src/app.module.ts`                                                | `ServeStaticModule` para `/uploads`                                                                                                   |
| `apps/api/src/__mocks__/otplib.js`                                          | Mock manual Jest para ESM otplib v13                                                                                                  |
| `apps/api/package.json`                                                     | `moduleNameMapper` para otplib mock                                                                                                   |
| `apps/api/src/auth/auth.service.spec.ts`                                    | Testes para os novos métodos                                                                                                          |
| `packages/contracts/src/schemas/auth.ts`                                    | Schemas `changePassword`, `twoFaSetup`, `twoFaVerify`                                                                                 |

### Frontend (Web)

| Arquivo                                                                | Ação                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------- |
| `apps/web/src/app/api/auth/change-password/route.ts`                   | Criado — BFF proxy                                |
| `apps/web/src/app/api/auth/sessions/route.ts`                          | Criado — GET + DELETE                             |
| `apps/web/src/app/api/auth/sessions/[id]/route.ts`                     | Criado — DELETE individual                        |
| `apps/web/src/app/api/auth/2fa/setup/route.ts`                         | Criado                                            |
| `apps/web/src/app/api/auth/2fa/enable/route.ts`                        | Criado                                            |
| `apps/web/src/app/api/auth/2fa/disable/route.ts`                       | Criado                                            |
| `apps/web/src/app/api/auth/2fa/verify/route.ts`                        | Criado                                            |
| `apps/web/src/app/api/configuracoes/logo/[barCodigo]/route.ts`         | Criado — proxy FormData                           |
| `apps/web/src/features/auth/services/auth.service.ts`                  | Novas funções: changePassword, sessions, 2FA      |
| `apps/web/src/features/auth/hooks/use-change-password.ts`              | Criado                                            |
| `apps/web/src/features/auth/hooks/use-sessions.ts`                     | Criado — query + revokeOne + revokeAll            |
| `apps/web/src/features/auth/hooks/use-two-fa.ts`                       | Criado — setup, enable, disable                   |
| `apps/web/src/features/auth/components/TwoFaModal.tsx`                 | Criado — QR code + input                          |
| `apps/web/src/features/auth/components/TwoFaDisableModal.tsx`          | Criado — confirmação desativar                    |
| `apps/web/src/features/configuracoes/components/SecaoSeguranca.tsx`    | Reescrito — formulário real                       |
| `apps/web/src/features/configuracoes/components/SecaoBarbearia.tsx`    | Upload de logo via fileInput                      |
| `apps/web/src/features/configuracoes/hooks/use-configuracao.ts`        | Mutation `uploadLogo`                             |
| `apps/web/src/features/configuracoes/services/configuracao.service.ts` | Método `uploadLogo`                               |
| `apps/web/src/features/configuracoes/types/configuracao.types.ts`      | `logoUrl` em `BarbeariaConfig`                    |
| `apps/web/src/test/msw-handlers.ts`                                    | Handlers: change-password, sessions, 2fa/\*, logo |

---

## Arquitetura do fluxo 2FA

```
Login → API retorna { requiresTwoFa: true, tempToken } (JWT 5min, type='2fa')
     → Frontend redireciona para tela de verificação
     → POST /api/auth/2fa/verify com { tempToken, code }
     → API valida TOTP e retorna tokens reais
```

**Setup (ativar):**

```
POST /api/auth/2fa/setup → { qrCode: base64PNG, secret }
QR code exibido no modal → usuário escaneia com app autenticador
POST /api/auth/2fa/enable com código de 6 dígitos → ativa no banco
```

---

## Nota técnica: otplib v13 + Jest

`otplib` v13 é pure ESM — incompatível com Jest CJS por padrão.
Solução: mock manual em `apps/api/src/__mocks__/otplib.js` + `moduleNameMapper` no Jest config.
API v13 usa funções nomeadas: `generateSecret`, `generateURI`, `verify` (async, retorna `{ valid: boolean }`).

---

## Verificação

```bash
pnpm --filter api lint && pnpm --filter web lint
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
pnpm --filter api test   # 153 testes
pnpm --filter web test   # 109 testes
```
