# 59 — Notas privadas do barbeiro sobre o cliente (Fase 4-B)

**Status:** Implementado
**Branch:** develop
**Base:** Fase 4 do fluxo barbeiro (slide 13)

## Contexto

Slide 13: o barbeiro mantém **notas privadas** sobre o cliente
(ex.: "máquina 2 nas laterais"). A UI já existia no `ClienteDetalhe` mas era
**local-only** (não persistia). Esta entrega cria o modelo, os endpoints e liga
a tela à API.

## Migração Prisma

Modelo novo `ClienteNota` (`TQE_CLIENTE_NOTA`): uma nota por
**(barbearia, barbeiro, cliente)** — `@@unique([barCodigo, barbeiroId, clienteId])`,
atualizada via upsert. FKs para `TQE_BARBEARIA` e `TQE_USUARIO` (barbeiro e
cliente). Migração `20260522133343_add_cliente_nota` criada e aplicada via
`prisma migrate dev` (Postgres do `docker-compose.dev.yml`).

> A migração `migrate dev` também reconciliou drift pré-existente de nomes de
> FK/índices (AVALIACAO, CONVITE, PUSH_TOKEN) — renomeações inofensivas para
> alinhar o banco ao schema. Sem impacto funcional.

## Mudanças

| Arquivo                                                              | Mudança                                                  |
| -------------------------------------------------------------------- | -------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                      | modelo `ClienteNota` + relações em `Usuario`/`Barbearia` |
| `apps/api/prisma/migrations/20260522133343_add_cliente_nota/`        | migração SQL                                             |
| `packages/contracts/src/schemas/cliente.ts` _(novo)_                 | `salvarNotaClienteSchema` (`conteudo` max 2000)          |
| `apps/api/src/cliente-nota/` _(novo)_                                | service + controller + module + DTO                      |
| `apps/api/src/app.module.ts`                                         | registra `ClienteNotaModule`                             |
| `apps/api/src/test/prisma-mock.factory.ts`                           | mock ganha `clienteNota`                                 |
| `apps/mobile/src/shared/hooks/barbeiro/use-cliente-nota.ts` _(novo)_ | `useClienteNota` (GET) + `useSalvarNotaCliente` (PUT)    |
| `apps/mobile/src/features/barbeiro/ClienteDetalhe.tsx`               | notas agora persistem (busca + salva ao tocar "Salvar")  |

## Endpoints

```http
GET /clientes/:clienteId/nota      → { conteudo, atualizadoEm }   (vazio se não há)
PUT /clientes/:clienteId/nota      body { conteudo }              (upsert; vazio remove)
```

Guards: `JwtAuthGuard + TenantGuard + RolesGuard` (`dono/gerente/barbeiro/recepcionista`).
**O barbeiro é sempre `req.user.sub`** (nunca um parâmetro) — ninguém lê/edita
nota de outro barbeiro. Escopo de barbearia via `x-tenant-id`.

## Testes

- **api** `cliente-nota.service.spec.ts`: obter (com/sem nota), salvar (upsert com
  trim; conteúdo vazio → deleteMany).
- **mobile** `ClienteDetalhe.test.tsx`: editar + "Salvar" persiste via mutation.
- Integração (Testcontainers) e aplicação da migração em outros ambientes ficam
  para rodar com Docker disponível (`prisma migrate deploy`).

## seed-runner

`ClienteNota` não é populado no seed (sem compound-key afetada nos fluxos
existentes). Nenhuma mudança necessária no `seed-runner.js`.
