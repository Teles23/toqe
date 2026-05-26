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

## Próximos chunks

- **Chunk 2 (mobile):** tela de convite no app (dono/gerente) consumindo
  `gerarConviteSchema`/`GerarConviteResponse`; MSW handlers + specs.
- **Chunk 3 (web):** mesma frente no painel web; MSW handlers + specs.
