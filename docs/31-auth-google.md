# 31 — Autenticação Google (OAuth + DI)

**Status:** ✅ Implementado
**Branch:** `feat/auth-google` → `mobile/base`
**Base:** Sequência canônica do projeto (após `30-fila-walk-in.md`)

---

## Contexto

O mobile já tinha o método `loginWithGoogle(idToken)` no `AuthProvider` mas chamava um endpoint `POST /auth/google` que **não existia** no backend. Esta fase implementa o endpoint real, com:

- Verificação real do ID token via `google-auth-library` em produção
- **Dependency Inversion** (`GoogleTokenVerifier` interface) para que testes de integração possam substituir o verifier por um stub determinístico — sem mockar o sistema sob teste
- Migração Prisma para tornar `senhaHash` nullable (usuários OAuth-only não têm senha local)
- Bootstrap nativo no mobile + botão "Entrar com Google" na tela de login

---

## Arquitetura — Dependency Inversion

O grande problema de testar integração com Google é que verificar um ID token real requer:

- Token válido emitido pelo Google (expira em ~1h, quebra build)
- OU mock da rede externa (frágil, vaza implementação)
- OU service account (overkill para autenticação client-side)

A solução: **inversão de dependência**.

```
┌────────────────────────┐         injetado via Nest DI
│     AuthService        │ ──────────────────────────┐
│  (não conhece o impl)  │                            │
└────────────────────────┘                            ▼
                                  ┌────────────────────────────┐
                                  │ GoogleTokenVerifier (iface)│
                                  └────────────────────────────┘
                                              ▲
                              ┌───────────────┴───────────────┐
                              │                                │
                ┌─────────────┴─────────────┐    ┌────────────┴────────────┐
                │  GoogleAuthLibraryVerifier │    │  Stub (em testes)        │
                │  (prod — google-auth-lib)  │    │  verify: jest.fn()       │
                └────────────────────────────┘    └──────────────────────────┘
```

- **Prod**: `AuthModule` registra `{ provide: GOOGLE_TOKEN_VERIFIER, useClass: GoogleAuthLibraryVerifier }`
- **Teste de integração**: `overrideProvider(GOOGLE_TOKEN_VERIFIER).useValue(stubVerifier)` — todo o resto (controller → service → DB via Testcontainers → generateTokens → refresh tokens) executa **real**

**Isso NÃO é mock do SUT** — é dependência inversa. O `google-auth-library` em si nunca é mockado: ele é o impl real injetado em prod. Em teste, apenas o ponto de extensão (interface) é substituído por uma implementação alternativa.

---

## Mudanças backend

| Arquivo                                                                            | Mudança                                                                           |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                                    | `senhaHash String?` (nullable)                                                    |
| `apps/api/prisma/migrations/20260515000003_make_senha_hash_optional/migration.sql` | `ALTER COLUMN ... DROP NOT NULL`                                                  |
| `apps/api/package.json`                                                            | `+ google-auth-library`                                                           |
| `packages/contracts/src/schemas/auth.ts`                                           | `+ googleAuthSchema`                                                              |
| `packages/contracts/src/types/index.ts`                                            | `+ GoogleAuthInput`                                                               |
| `apps/api/src/auth/google-token-verifier.ts` (novo)                                | Interface + impl real + Symbol de DI                                              |
| `apps/api/src/auth/dto/google-auth.dto.ts` (novo)                                  | `GoogleAuthDto` via `createZodDto`                                                |
| `apps/api/src/auth/auth.service.ts`                                                | `+ googleAuth()` método + checagens null para `senhaHash` (login, changePassword) |
| `apps/api/src/auth/auth.controller.ts`                                             | `+ @Post('google')` endpoint                                                      |
| `apps/api/src/auth/auth.module.ts`                                                 | Registra provider de DI                                                           |
| `apps/api/.env.example`                                                            | `+ GOOGLE_CLIENT_ID`                                                              |
| `apps/api/src/auth/auth.service.spec.ts`                                           | Adiciona stub do `GOOGLE_TOKEN_VERIFIER`                                          |
| `apps/api/test/integration/auth.integration.spec.ts`                               | `+5 cenários` Google (overrideProvider)                                           |

### Endpoint

```http
POST /auth/google
Content-Type: application/json

{ "idToken": "<google-id-token>" }

→ 200
{
  "access_token": "...",
  "refresh_token": "...",
  "user": { "codigo": 77, "nome": "...", "email": "..." }
}

→ 401 (idToken inválido/expirado)
{ "message": "ID token Google inválido" }
```

### Comportamento

1. Recebe `idToken` → `GoogleTokenVerifier.verify(idToken)`:
   - Em prod: `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`
   - Retorna `{ email, nome, avatarUrl }` ou lança `UnauthorizedException`
2. `findUnique({ email })` no Postgres:
   - Se NÃO existe: cria com `senhaHash: null, ativo: true, twoFaEnabled: false`
   - Se existe: reusa o usuário (login transparente)
3. Reusa o método privado `generateTokens(codigo, nome, email)` — mesmo fluxo do login email
4. Retorna `{ access_token, refresh_token, user }`

### Decisões importantes

| Decisão                                                         | Justificativa                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `senhaHash` nullable                                            | Usuário OAuth-only não tem senha local                                        |
| `twoFaEnabled: false` por padrão para usuário Google            | Google já é 2FA externo. 2FA interno é para usuários com senha                |
| Login email/senha em conta Google → 401 com mensagem específica | UX: orienta o usuário a usar o botão correto ("Esta conta usa login Google.") |
| `changePassword` em conta OAuth → 401                           | Não faz sentido alterar senha que não existe                                  |

---

## Mudanças mobile

| Arquivo                                                                         | Mudança                                                                                 |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/mobile/src/_init/google-signin.ts` (novo)                                 | `GoogleSignin.configure({ webClientId })` por efeito colateral                          |
| `apps/mobile/app/_layout.tsx`                                                   | `import "@/src/_init/google-signin"` antes do AuthProvider                              |
| `apps/mobile/app/(auth)/login.tsx`                                              | `+ Button "Entrar com Google"` + handler `onGoogle()`                                   |
| `apps/mobile/src/shared/providers/auth-provider.tsx`                            | Comentário atualizado (sem "placeholder")                                               |
| `apps/mobile/app/(auth)/__tests__/login.test.tsx`                               | `+5 cenários` Google (render, formato antigo/novo do SDK, sem token, 401, cancelamento) |
| `apps/mobile/src/shared/__tests__/auth-flow.google.integration.test.tsx` (novo) | Integração `AuthProvider.loginWithGoogle` real → fetch real do api-client → SecureStore |

### Handler do botão

```typescript
const onGoogle = async () => {
  try {
    const result = await GoogleSignin.signIn();
    // SDK varia entre versões: idToken pode estar no topo ou em `data`
    const idToken = result.idToken ?? result.data?.idToken ?? null;
    if (!idToken) {
      setError("root", { message: "Falha ao obter token Google." });
      return;
    }
    await loginWithGoogle(idToken); // api-client real → POST /auth/google
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setError("root", { message: "Conta Google não autorizada." });
    } else {
      setError("root", { message: "Falha no login Google. Tente novamente." });
    }
  }
};
```

---

## Configuração

### Backend

```bash
# apps/api/.env (e GitHub Secrets para deploy)
GOOGLE_CLIENT_ID=1095847529893-b71gjl8nqpjl5vo0ppd5c5iljfof684m.apps.googleusercontent.com
```

**Mesmo Client ID** que o mobile usa (`apps/mobile/.env` → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` e `app.config.ts` → `extra.googleWebClientId`). O backend valida o token contra esse `audience`.

### Mobile

Já configurado em `app.config.ts` desde a branch de EAS/OTA. O mobile usa o **Development Build** do Expo (Google Sign-In nativo não roda em Expo Go).

---

## Migration ordering

Develop adicionou:

- `20260515000001_add_password_reset_token`
- `20260515000002_add_two_fa_fields`

Esta fase adiciona:

- `20260515000003_make_senha_hash_optional`

Sequência respeitada — `prisma migrate deploy` aplica em ordem.

---

## Testes

```bash
# Mobile
pnpm --filter mobile test                # 24 suites, 120 testes (todos passando)

# API unit + e2e
pnpm --filter api test                   # 28 suites, 153 testes (todos passando)

# API integration (precisa Docker — Testcontainers)
pnpm --filter api test:integration
```

### Matriz Google (cenários novos)

| Suite                                                                            | Cenários                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.integration.spec.ts` (Testcontainers, Postgres real, stub verifier via DI) | (1) email novo → cria user com senhaHash null + tokens; (2) email existente → reusa user; (3) verifier lança → 401; (4) user OAuth NÃO loga via /auth/login (senha) → 401 com mensagem clara; (5) refresh do token Google funciona igual ao login email |
| `auth.service.spec.ts` (unit)                                                    | Stub verifier injetado, garante AuthService instanciável com DI                                                                                                                                                                                         |
| `(auth)/login.test.tsx` (mobile, 5 cenários novos)                               | botão renderiza; idToken formato antigo (topo); idToken formato novo (data.idToken); sem idToken → erro; 401 → mensagem específica; cancelamento → mensagem genérica                                                                                    |
| `auth-flow.google.integration.test.tsx` (mobile)                                 | AuthProvider real + fetch real do api-client: loginWithGoogle → POST /auth/google → tokens salvos no SecureStore → redirect por perfil; 401 → propaga ApiError sem salvar tokens                                                                        |

---

## Segurança / Performance / Escalabilidade

### Segurança

- Verificação real do `audience` (GOOGLE_CLIENT_ID) — impede tokens de outras apps
- `senhaHash: null` para usuários OAuth — impossibilita login por senha (testado)
- Mensagem de erro em login email/senha de conta OAuth: revela apenas o tipo de conta, não enumera (mantém anti-enumeration de develop)
- 2FA interno desabilitado para usuários Google — não há senha para combinar com TOTP
- Rate limit (Throttler) já cobre `/auth/google` via `@Throttle` no controller

### Performance

- `OAuth2Client` é singleton no service (uma instância por processo, não por request)
- Cache de chaves públicas do Google é feito pelo `google-auth-library` internamente
- `findUnique` por email indexado — O(log n)

### Escalabilidade

- DI permite trocar provider Google por outro OAuth (Apple, Microsoft) — só implementar a interface
- Estratégia reusa todo o pipeline existente (`generateTokens`, refresh, logout) — zero divergência
- `googleAuthSchema` em contracts é compartilhado por mobile/web/api (single source)

---

## Verificação manual (antes de release)

- [ ] `GOOGLE_CLIENT_ID` configurado no `.env` do backend (mesmo do mobile)
- [ ] Build Development Android (`eas build --profile development`) → instalar APK
- [ ] Abrir app → tela login → tap "Entrar com Google" → modal nativo aparece → escolher conta
- [ ] Backend recebe POST `/auth/google` no log com `idToken` real → 200
- [ ] App entra autenticado, tokens salvos no SecureStore, redirect por perfil
- [ ] Tentar login email/senha com o mesmo email → 401 com mensagem "Esta conta usa login Google"
