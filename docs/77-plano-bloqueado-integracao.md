# 77 — Plano bloqueado bloqueia endpoint protegido (cobertura de integração)

**Status:** Implementado e commitado (4 checks da API verdes — lint, tipos, unit, integration)
**Branch:** develop
**Base:** doc 76 (fuso agenda), `PlanoAtivoGuard` global (`app.module.ts`), enum de `planoStatus`

## Contexto (gap do mapa de cobertura)

O `PlanoAtivoGuard` é registrado como **guard global** em
`apps/api/src/app.module.ts` (`{ provide: APP_GUARD, useClass: PlanoAtivoGuard }`).
Ele lê `x-tenant-id`, busca `barbearia.planoStatus` e, se o status **não** estiver
em `STATUS_LIVRES = { 'ativo', 'trial' }`, lança `ForbiddenException`
(**HTTP 403**) com a mensagem `Acesso suspenso. Plano: ${planoStatus}. Regularize...`.

Até aqui, a única cobertura desse comportamento era um **unit com Prisma mockado**.
Faltava prova end-to-end de que, com **HTTP real + Postgres real**, uma barbearia
com plano bloqueado realmente recebe 403 num endpoint protegido — e de que esse
bloqueio é **por tenant** (não vaza para outra barbearia do mesmo dono).

## Solução

Estende `tenant-isolation.integration.spec.ts` com um `describe` próprio
(`Plano bloqueado bloqueia endpoint protegido`) que tem **setup independente**
(dono dedicado + 2 barbearias próprias), para não interferir no teste de
isolamento já existente. O endpoint protegido escolhido é `GET /servicos`
(sem `SkipPlanoCheck`, depende de `x-tenant-id`). O status é forçado direto no
banco via `prisma.barbearia.update`, garantindo determinismo
(o default ao criar barbearia é `'trial'`, que é livre).

## Arquivos modificados

| Arquivo                                                          | Mudança                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/api/test/integration/tenant-isolation.integration.spec.ts` | Novo `describe('Plano bloqueado bloqueia endpoint protegido')` com 4 cenários |
| `docs/77-plano-bloqueado-integracao.md`                          | Esta documentação                                                             |

## Cenários cobertos (HTTP real + Postgres real)

| #   | `planoStatus` setado via Prisma                    | Requisição                                    | Esperado                                                     |
| --- | -------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| 1   | `inadimplente`                                     | `GET /servicos` (Authorization + x-tenant-id) | **403**, mensagem contém `inadimplente`                      |
| 2   | `cancelado`                                        | `GET /servicos`                               | **403**, mensagem contém `cancelado`                         |
| 3   | `ativo`                                            | `GET /servicos`                               | **200**                                                      |
| 4   | bloqueada `cancelado` + livre `ativo` (mesmo dono) | `GET /servicos` em cada uma                   | bloqueada → **403**; livre → **200** (isolamento por tenant) |

Confirmado pelo log do teste que o status HTTP é **403** (não 402).

## Validação

- `pnpm --filter api lint` — OK
- `cd apps/api && npx tsc --noEmit` — OK
- `pnpm --filter api test` — 47 suites / 436 testes OK (sem regressão)
- `pnpm --filter api test:integration` — 6 suites / 36 testes OK
  (`tenant-isolation`: 5 testes = 1 original + 4 novos; total +4 vs. doc 76)
  - Env exigido (igual ao CI): `JWT_SECRET`, `JWT_REFRESH_SECRET`, e Redis
    acessível (`REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`); Postgres é
    provisionado via Testcontainers (`postgres:16-alpine`).

## Observações / escopo

- **Sem mudança de código de produção**: o guard já existia e está correto;
  esta entrega só fecha o gap de cobertura de integração.
- Nenhum bug encontrado — o comportamento real (403, mensagem, isolamento por
  tenant) bate com o esperado.
