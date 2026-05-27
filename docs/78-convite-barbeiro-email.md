# 78 — Convite de barbeiro por e-mail (chunk 1/3 — BACKEND)

**Status:** Implementado e commitado (4 checks da API verdes — lint, tipos, unit, integration)
**Branch:** develop
**Base:** modelo Prisma `ConviteBarbearia` já existente, fluxo de aceite (doc do convite),
`NotificacaoService`/`NotificacaoProducer`/`NotificacaoConsumer` (Bull/Resend), guards `TenantGuard`/`RolesGuard`

> **Escopo desta entrega:** apenas o **backend** (geração de convite + e-mail via fila).
> O **chunk 2 (mobile)** e o **chunk 3 (web)** consumirão o contrato descrito abaixo
> em entregas seguintes. O fluxo de **aceite** já existia e **não foi alterado**.

## Contexto

Antes, convidar um membro só funcionava para usuário **já registrado**
(`POST /barbearias/:id/membros` → `MembroBarbeariaService.convidarMembro`, que
lança 404 se o e-mail não existe). Esse fluxo **continua intacto**.

Faltava o fluxo de **convite por e-mail**: o dono/gerente informa um e-mail
(novo ou existente), o sistema cria um `ConviteBarbearia` com token seguro e
dispara um e-mail com link de aceite. O aceite (`GET /convite/:token`,
`POST /convite/:token/aceitar`) já existia e funciona ponta a ponta com o token
gerado aqui.

## Endpoint

`POST /barbearias/:barCodigo/convite` (prefixo global `api/v1`)

- **AuthZ:** `JwtAuthGuard` + `TenantGuard` + `RolesGuard` com `@Roles('dono', 'gerente')`
  — o **mesmo** padrão de `POST /barbearias/:barCodigo/membros`.
- **Body:** `{ email: string; perfil?: 'gerente' | 'barbeiro' | 'recepcionista' }`
  — `perfil` default `'barbeiro'` (via `.default()` no schema Zod).
- **Idempotência:** se já há convite **não usado e não expirado** para o mesmo
  `email + barbearia`, ele é **renovado** (novo token, nova validade `+7d`,
  perfil atualizado) em vez de duplicar a linha.
- **Validade:** `expiresAt = agora + 7 dias`.
- **Token:** `randomBytes(16).toString('hex')` (32 chars, 128 bits de entropia,
  cabe em `VARCHAR(36)`).
- **Envio:** enfileira job Bull `send_convite` → `NotificacaoConsumer.handleSendConvite`
  → `NotificacaoService.enviarConviteEmail({ email, conviteLink, barbeariaNome, perfil })`.
  Sem `RESEND_API_KEY`, é **no-op com warn** (igual aos outros e-mails).
- **Retorno (201):** `{ codigo, email, perfil, expiresAt, reaproveitado }` —
  **sem vazar o token** (o token só viaja pelo e-mail).

### Link e env

- Base configurável via **`FRONTEND_URL`** (env **já existente**, reusada do fluxo
  de reset de senha em `auth.service.ts`). Fallback: `http://localhost:4001`.
- Formato final: **`${FRONTEND_URL}/convite?token=${token}`**.
- Documentada em `apps/api/.env.example`.

## Contrato compartilhado (`@toqe/contracts`) — para mobile/web (chunks 2 e 3)

Em `packages/contracts/src/schemas/convite.ts`:

```ts
export const conviteEmailPerfilSchema = z
  .enum(["gerente", "barbeiro", "recepcionista"])
  .default("barbeiro");

export const gerarConviteSchema = z.object({
  email: z.string().email("E-mail inválido"),
  perfil: conviteEmailPerfilSchema,
});
export type GerarConviteInput = z.infer<typeof gerarConviteSchema>;

export interface GerarConviteResponse {
  codigo: number;
  email: string;
  perfil: string;
  expiresAt: string; // ISO
  reaproveitado: boolean;
}
```

## Arquivos criados

| Arquivo                                                 | Conteúdo                                          |
| ------------------------------------------------------- | ------------------------------------------------- |
| `apps/api/src/convite/dto/gerar-convite.dto.ts`         | DTO via `createZodDto(gerarConviteSchema)`        |
| `apps/api/test/integration/convite.integration.spec.ts` | Integração (Postgres real + aceite ponta a ponta) |
| `docs/78-convite-barbeiro-email.md`                     | Esta documentação                                 |

## Arquivos modificados

| Arquivo                                                 | Mudança                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `packages/contracts/src/schemas/convite.ts`             | `gerarConviteSchema`, `conviteEmailPerfilSchema`, `GerarConviteResponse` |
| `apps/api/src/convite/convite.service.ts`               | Novo método `gerarConvite()` (cria/renova + dispara producer)            |
| `apps/api/src/convite/convite.module.ts`                | Importa `NotificacaoModule`                                              |
| `apps/api/src/barbearia/barbearia.controller.ts`        | Rota `POST :barCodigo/convite` (injeta `ConviteService`)                 |
| `apps/api/src/barbearia/barbearia.module.ts`            | Importa `ConviteModule`                                                  |
| `apps/api/src/notificacao/notificacao.types.ts`         | Interface `ConviteEmailJob`                                              |
| `apps/api/src/notificacao/notificacao.producer.ts`      | `SEND_CONVITE` + método `enviarConvite()`                                |
| `apps/api/src/notificacao/notificacao.consumer.ts`      | Handler `handleSendConvite()`                                            |
| `apps/api/src/notificacao/notificacao.service.ts`       | `enviarConviteEmail()` + template HTML estilizado                        |
| `apps/api/.env.example`                                 | Documenta `FRONTEND_URL`                                                 |
| `apps/api/src/convite/convite.service.spec.ts`          | +6 testes (`gerarConvite`)                                               |
| `apps/api/src/barbearia/barbearia.controller.spec.ts`   | +1 teste (delegação `gerarConvite`)                                      |
| `apps/api/src/notificacao/notificacao.producer.spec.ts` | +2 testes (`enviarConvite`)                                              |
| `apps/api/src/notificacao/notificacao.consumer.spec.ts` | +1 teste (`handleSendConvite`)                                           |
| `apps/api/src/notificacao/notificacao.service.spec.ts`  | +3 testes (`enviarConviteEmail` no-op / HTML / retry)                    |
| `apps/api/test/security/security.spec.ts`               | +4 testes (401 / 403 estranho / 403 perfil / 201 dono)                   |

> **Sem migration:** o modelo `ConviteBarbearia` e a tabela `TQE_CONVITE_BARBEARIA`
> já existem (migration `20260521000000_add_avaliacao_convite`). Nenhuma mudança
> de schema Prisma.

## Fluxo

```
POST /barbearias/:id/convite (dono/gerente)
        │  TenantGuard (membro?) + RolesGuard (dono|gerente)
        ▼
ConviteService.gerarConvite
        │  barbearia existe? ──não──▶ 404
        │  convite ativo p/ email? ──sim──▶ UPDATE (renova)  reaproveitado=true
        │                          ──não──▶ CREATE            reaproveitado=false
        ▼
NotificacaoProducer.enviarConvite  ──Bull(send_convite)──▶  NotificacaoConsumer.handleSendConvite
        │                                                          │
        ▼                                                          ▼
   201 { codigo, email, perfil, expiresAt, reaproveitado }   NotificacaoService.enviarConviteEmail
                                                              (no-op se RESEND_API_KEY ausente)
                                                              link: ${FRONTEND_URL}/convite?token=...
        │
        ▼  (já existente, inalterado)
GET /convite/:token  →  POST /convite/:token/aceitar  →  cria/vincula usuário + auto-login
```

## Cenários cobertos

### Unit (Jest)

- `gerarConvite`: cria novo (reaproveitado=false), normaliza e-mail (lowercase/trim),
  renova convite ativo (reaproveitado=true, sem duplicar), fallback de URL sem
  `FRONTEND_URL`, 404 barbearia inexistente, não vaza token, dispara o producer
  com o link no formato esperado.
- `enviarConviteEmail`: no-op sem `RESEND_API_KEY`; com key monta destinatário/HTML
  (nome da barbearia, perfil, link de aceite); relança erro para retry do Bull.
- producer/consumer/controller: delegação correta dos novos métodos.

### Integração (Postgres real + Testcontainers)

- POST com tenant real → **201** e cria a linha `ConviteBarbearia` no Postgres
  (`usadoEm` nulo, `expiresAt` ~7d).
- `perfil` default = `barbeiro` quando omitido.
- Idempotência: 2º POST renova (reaproveitado=true), sem duplicar linha ativa.
- **Ponta a ponta:** o token gerado é aceitável por `GET /convite/:token` +
  `POST /convite/:token/aceitar` (cria usuário, vincula como membro `barbeiro`,
  marca `usadoEm`).
- `RESEND_API_KEY` ausente → e-mail no-op; asserta-se a criação/aceite, não o e-mail.

### Segurança (supertest)

| Caso                                          | Esperado |
| --------------------------------------------- | -------- |
| sem `Authorization`                           | **401**  |
| autenticado, **não membro** da barbearia      | **403**  |
| membro com perfil **barbeiro** (insuficiente) | **403**  |
| **dono** da barbearia                         | **201**  |

## Validação

- `pnpm --filter api lint` — OK (0 erros, 0 warnings)
- `cd apps/api && npx tsc --noEmit` — OK (API e `@toqe/contracts`)
- `pnpm --filter api test` — 47 suites / 448 testes OK (+12 vs. baseline 436)
- `pnpm --filter api test:integration` — 7 suites / 40 testes OK (+1 suite / +4 vs. 6/36)
- `pnpm --filter api test:security` — 1 suite / 9 testes OK (+4)
  - Env exigido (igual ao CI): `JWT_SECRET`, `JWT_REFRESH_SECRET`,
    `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`; Postgres via Testcontainers
    (`postgres:16-alpine`). `RESEND_API_KEY` ausente nos testes → e-mail no-op.

## Chunk 2/3 — MOBILE (onboarding do convite, slides 2-4)

**Status:** Implementado e commitado (3 checks do mobile verdes — lint, tipos, unit)
**Branch:** develop
**Base:** tela de aceite `apps/mobile/app/convite/[token].tsx` (fluxo de auto-login do
doc 57) + design system Urban Flow Native (`AmberButton`/`GhostButton`/`FormInput`,
`useTheme()`).

> **Escopo desta entrega:** redesign editorial da jornada de **aceite** do barbeiro
> convidado — os slides 02 (landing), 03 (form) e 04 (boas-vindas) e os estados de
> erro. O contrato HTTP (`GET /convite/:token`, `POST /convite/:token/aceitar`,
> `DELETE /convite/:token`) e os hooks (`useConvite`/`useAceitarConvite`/
> `useRejeitarConvite`) **não mudaram** — só a camada de apresentação.

### Estados da tela (`ConviteView`)

| Estado           | testID              | Conteúdo                                                                                                                                                                                               |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `loading`        | —                   | `ActivityIndicator` âmbar centralizado                                                                                                                                                                 |
| `landing` (s.02) | `convite-landing`   | Ícone Feather `mail`, eyebrow "Convite · barbeiro", headline Sora "{barbeariaNome} quer você na equipe.", e-mail + função no parágrafo, CTA `AmberButton` "Aceitar convite" + `GhostButton` "Rejeitar" |
| `form` (s.03)    | —                   | "Criar sua conta" / "Confirmar acesso"; campos nome (`user`), e-mail **readonly** (`mail`, vem do convite), senha (`shield`, hint "mín. 8 chars")                                                      |
| `accepting`      | `convite-accepting` | Spinner + "Vinculando à barbearia…"                                                                                                                                                                    |
| `welcome` (s.04) | `convite-success`   | Círculo âmbar com Feather `scissors`, "Bem-vindo, {nome}.", CTA "Ver minha agenda" (ícones `calendar` + `arrow-right`)                                                                                 |
| `expired`        | `convite-expirado`  | Ícone `x-circle` (danger), "Link inválido"                                                                                                                                                             |
| `already_member` | `convite-ja-membro` | Ícone `check-circle` (success), "Você já é membro"                                                                                                                                                     |

- Usuário novo (`isNew=true`) vê nome + senha; usuário existente (`isNew=false`)
  vê só o campo de senha. O e-mail é sempre **readonly** (origem: o convite).
- Ícones Feather: `mail`, `arrow-right`, `arrow-left`, `user`, `shield`,
  `scissors`, `calendar`, `x-circle`, `check-circle`. Cores 100% via `useTheme()`
  (sem hex hardcoded; emojis e estilos órfãos removidos).

### Arquivos modificados

| Arquivo                                              | Mudança                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/mobile/app/convite/[token].tsx`                | Redesign editorial dos 5 estados (slides 2-4 + erro/já-membro); testIDs preservados             |
| `apps/mobile/app/convite/__tests__/[token].test.tsx` | Teste 5 alinhado: nome agora vive na headline "{nome} quer você na equipe." (matcher por regex) |

### Cenários cobertos (Jest + RTL — `[token].test.tsx`, 13 testes)

Exercitam os **hooks reais** (`useConvite`/`useAceitarConvite`/`useRejeitarConvite`)

- `api-client` real; só `global.fetch` e `useAuth.establishSession` são mockados.

* loading enquanto a query está pendente; `convite-expirado` em 500 e 404.
* `convite-landing` quando válido; headline editorial com o nome da barbearia
  (regex "{nome} quer você na equipe."); e-mail do convite visível.
* "Aceitar convite" → form com nome + senha (novo) ou só senha (existente).
* `btn-aceitar` → `convite-accepting`; sucesso faz `establishSession(acc, ref)`
  e mostra `convite-success` com "Bem-vindo".
* "Ver minha agenda" navega para `/(barbeiro)/agenda`.
* `btn-voltar-convite` chama `router.back()`; "Rejeitar" faz `DELETE /convite/:token` e volta.

### Validação

- `pnpm --filter mobile lint` — OK
- `pnpm --filter mobile type-check` — OK
- `pnpm --filter mobile test` — OK (suite `[token].test.tsx`: 13/13)

## Chunk 3/3 — WEB (página pública de aceite)

**Status:** Implementado (3 checks do web verdes — lint, tipos, unit)
**Branch:** develop
**Base:** padrão de página pública por token do reset de senha
(`app/(auth)/reset-password/`), BFF de login (`app/api/auth/login/route.ts`
seta cookies httpOnly), `AuthProvider`/`useAuth`, `api-client`, design system
do web (tokens CSS `var(--*)`, classes `tqe-*`, `AuthErrorBanner`,
`AuthBrandingPanel`). Test harness Vitest + RTL + MSW (`src/test/*`).

> **Escopo desta entrega:** apenas o **web**. A página pública
> `FRONTEND_URL/convite?token=...` (destino do e-mail do chunk 1), espelhando a
> jornada do mobile (chunk 2). O contrato HTTP da API **não mudou** — os 3
> endpoints (`GET /convite/:token`, `POST /convite/:token/aceitar`,
> `DELETE /convite/:token`) são públicos e já existiam.

### Auto-login via BFF (mesmo mecanismo do login)

O aceite é um **auto-login**: a posse do link prova a identidade. O backend
retorna `access_token`/`refresh_token`; o web os transforma em cookies do mesmo
jeito que o login do web — via **route handler BFF**:

```
POST /api/convite/:token/aceitar  (BFF, Next.js route handler)
   │  proxy → NestJS POST /convite/:token/aceitar
   │  sucesso → seta cookies:
   │     access_token  : não-httpOnly, sameSite=strict, 15 min, path=/
   │     refresh_token : httpOnly,     sameSite=strict, 30 dias, path=/api/auth
   ▼
useAceitarConvite → establishSession() (AuthProvider recarrega /usuarios/me,
                    SEM redirecionar — a tela controla a navegação)
```

`GET` e `DELETE` também passam por BFF (`app/api/convite/[token]/route.ts`),
mantendo o mesmo padrão de proxy/erros do `reset-password/route.ts` (sem auth,
pois os endpoints são públicos).

### Estados da tela (`ConviteView`, `ConviteForm`)

| Estado      | testID              | Conteúdo                                                                                                                                                                   |
| ----------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loading`   | `convite-loading`   | Spinner `Loader2` âmbar                                                                                                                                                    |
| `landing`   | `convite-landing`   | Ícone `Mail`, eyebrow "Convite · barbeiro", headline "{barbeariaNome} quer você na equipe.", e-mail + função, CTAs aceitar/rejeitar (`btn-aceitar-convite`/`btn-rejeitar`) |
| `form`      | —                   | "Criar sua conta" (novo) / "Confirmar acesso" (existente); nome (`isNew`), e-mail **readonly** (do convite), senha (mín. 8); botão `btn-aceitar`; "← Voltar" → landing     |
| `accepting` | `convite-accepting` | Spinner + "Vinculando à barbearia…"                                                                                                                                        |
| `welcome`   | `convite-success`   | Círculo âmbar `Scissors`, "Bem-vindo, {nome}.", CTA "Ver minha agenda" (`btn-ver-agenda`) → `/agenda`                                                                      |
| `expired`   | `convite-expirado`  | Ícone `XCircle`, "Link inválido", link "Ir para o login"                                                                                                                   |

- Usuário novo (`isNew=true`) → nome + senha; existente (`isNew=false`) → só
  senha. E-mail sempre **readonly** (origem: o convite).
- Mapeamento de erros do aceite (espelha o mobile): 409 "Convite já utilizado.",
  404 "Convite expirado ou não encontrado.", 401 "Senha incorreta.", 400
  "Senha de ao menos 8 caracteres.". Em erro, volta ao `form` com a mensagem
  via `AuthErrorBanner`.
- `/convite` adicionada às `PUBLIC_ROUTES` (`shared/config/routes.ts`) para o
  proxy não redirecionar visitantes anônimos ao login.

### Arquivos criados

| Arquivo                                                            | Conteúdo                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `apps/web/src/app/(auth)/convite/page.tsx`                         | Server component: lê `?token=`, redireciona ao login se ausente                             |
| `apps/web/src/app/(auth)/convite/convite-client.tsx`               | Client wrapper que monta `ConviteForm`                                                      |
| `apps/web/src/app/api/convite/[token]/route.ts`                    | BFF GET (dados do convite) + DELETE (rejeitar), proxy público                               |
| `apps/web/src/app/api/convite/[token]/aceitar/route.ts`            | BFF POST aceitar — proxy + seta cookies (auto-login, igual ao login)                        |
| `apps/web/src/features/convite/services/convite.service.ts`        | `fetchConvite` / `requestAceitarConvite` / `requestRejeitarConvite` + `ConviteServiceError` |
| `apps/web/src/features/convite/hooks/use-convite.ts`               | Query do convite (404/401 → `null`)                                                         |
| `apps/web/src/features/convite/hooks/use-aceitar-convite.ts`       | Mutation de aceite + `establishSession()`                                                   |
| `apps/web/src/features/convite/hooks/use-rejeitar-convite.ts`      | Mutation de rejeição (DELETE)                                                               |
| `apps/web/src/features/convite/components/ConviteForm.tsx`         | Componente com todos os estados (espelha o mobile)                                          |
| `apps/web/src/features/convite/components/ConviteForm.spec.tsx`    | Spec RTL + MSW da jornada (13 testes)                                                       |
| `apps/web/src/features/convite/hooks/use-convite.spec.ts`          | Spec do hook de query (5 testes)                                                            |
| `apps/web/src/features/convite/hooks/use-aceitar-convite.spec.ts`  | Spec do hook de aceite (2 testes)                                                           |
| `apps/web/src/features/convite/hooks/use-rejeitar-convite.spec.ts` | Spec do hook de rejeição (2 testes)                                                         |
| `apps/web/src/features/convite/services/convite.service.spec.ts`   | Spec do service (fetch real contra MSW, 8 testes)                                           |

### Arquivos modificados

| Arquivo                                                | Mudança                                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/shared/providers/auth-provider.tsx`      | Nova ação `establishSession()` (auto-login: recarrega `/usuarios/me` sem redirecionar); `loadMe` refatorado para reusar `loadMeState` |
| `apps/web/src/shared/providers/auth-provider.spec.tsx` | +1 teste (`establishSession` popula estado sem `router.push`)                                                                         |
| `apps/web/src/test/render-helpers.tsx`                 | `mockAuthContext` ganhou `establishSession: vi.fn()`                                                                                  |
| `apps/web/src/test/msw-handlers.ts`                    | Handlers padrão dos 3 endpoints BFF de convite                                                                                        |
| `apps/web/src/shared/config/routes.ts`                 | `ROUTES.CONVITE` + entrada em `PUBLIC_ROUTES`                                                                                         |
| `apps/web/eslint.config.js`                            | `convite` adicionado à allowlist de `no-restricted-syntax` (tokens CSS dinâmicos, igual a `auth`/`barbeiros`)                         |

### Cenários cobertos (Vitest + RTL + MSW)

Os specs exercitam os **hooks e services reais** (sem duplicar lógica); apenas
`useAuth` e `next/navigation` são mockados (concerns externos). O service é
testado fazendo fetch real contra o MSW.

- **ConviteForm** (13): loading; expired em 404 e 500; landing com nome da
  barbearia + e-mail; form de usuário novo (nome+senha) vs. existente (só
  senha) com e-mail readonly; aceite com sucesso → `establishSession` +
  welcome "Bem-vindo, {nome}."; "Ver minha agenda" → `/agenda`; erros 409/401/400
  voltam ao form com a mensagem (e 409 **não** estabelece sessão); rejeitar →
  `DELETE /api/convite/:token` + `router.push('/login')`; "Voltar" → landing.
- **useConvite** (5): query desabilitada sem token; sucesso; 404/401 → `null`;
  500 → `isError`.
- **useAceitarConvite** (2): aceite chama service + `establishSession`; falha
  não estabelece sessão e propaga `ConviteServiceError` com `status`.
- **useRejeitarConvite** (2): sucesso e erro.
- **convite.service** (8): `fetchConvite` (sucesso, 404, encode do token),
  `requestAceitarConvite` (sucesso, 409, 401), `requestRejeitarConvite`
  (sucesso idempotente, 503).
- **AuthProvider** (+1): `establishSession` popula estado sem redirecionar.

### Validação

- `pnpm --filter web lint` — OK (0 erros, 0 warnings)
- `cd apps/web && npx tsc --noEmit` — OK
- `pnpm --filter web test` — 35 suites / 236 testes OK (+5 suites / +31 testes
  vs. baseline 30/205: 30 testes em 5 suites novas + 1 teste de
  `establishSession` na suite existente do `AuthProvider`)
