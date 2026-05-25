# 74 — Separação TQE_CONTATO / PessoaAPI unificada

**Status:** Concluído  
**Branch:** `claude/header-refresh-standardize-opHyl`  
**Base:** `develop`

## Objetivo

Separar "contato operacional" (walk-in) de "usuário autenticável" na camada de dados e de API.
Walk-ins deixam de criar registros sintéticos `TQE_USR` com e-mails `encaixe-…@toqe.internal` e
passam a usar a nova entidade leve `TQE_CONTATO` (nome + telefone, sem login).

---

## Arquivos criados

| Arquivo                                                               | Descrição                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `apps/api/prisma/migrations/20260524000000_add_contato/migration.sql` | Criação `TQE_CONTATO`, FK nullable `TQE_AGD_CLI_CODIGO`, FK nova `TQE_AGD_CNT_CODIGO`, CHECK XOR |
| `apps/api/src/contato/contato.module.ts`                              | Módulo NestJS para ContatoService                                                                |
| `apps/api/src/contato/contato.service.ts`                             | `findOrCreate` (dedup por telefone) + `findById`                                                 |
| `apps/api/src/contato/contato.service.spec.ts`                        | 8 testes cobrindo todos os cenários                                                              |
| `apps/mobile/src/shared/hooks/barbeiro/use-pessoas-da-barbearia.ts`   | Hook React Query para `/barbearias/:id/pessoas`                                                  |

## Arquivos modificados

| Arquivo                                                      | Mudança                                                                             |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                              | Modelo `Contato`, nullable `clienteId` em `Agendamento`, `contatoId`                |
| `apps/api/src/agendamento/agendamento.service.ts`            | `createWalkIn` usa `ContatoService`; `INCLUDE_COMPLETO` inclui `contato`            |
| `apps/api/src/agendamento/serialize-agendamento.ts`          | `mapCliente` unifica `usuario`/`contato` → campo `cliente` com `tipo` discriminador |
| `apps/api/src/agendamento/serialize-agendamento.spec.ts`     | Fixture `rawWalkIn()`, testes para `tipo:'contato'`, sem `contato` no output        |
| `apps/api/src/app.module.ts`                                 | Importa `ContatoModule`                                                             |
| `apps/api/src/agendamento/agendamento.module.ts`             | Importa `ContatoModule`                                                             |
| `apps/api/src/barbearia/membro-barbearia.service.ts`         | `findPessoas`: combina `/clientes` + `contato.findMany`, retorna `PessoaAPI[]`      |
| `apps/api/src/barbearia/barbearia.controller.ts`             | `GET /barbearias/:barCodigo/pessoas`                                                |
| `apps/api/src/test/prisma-mock.factory.ts`                   | Adiciona `contato: makeMethods()`                                                   |
| `apps/api/src/barbearia/membro-barbearia.service.spec.ts`    | Testes para `findPessoas` (3 casos)                                                 |
| `packages/contracts/src/schemas/agendamento.ts`              | `createWalkInSchema` v2 com XOR refine                                              |
| `packages/contracts/src/schemas/auth.ts`                     | `criarContatoSchema` + `CriarContatoInput`                                          |
| `packages/contracts/src/types/api-responses.ts`              | `AgendamentoAPI.cliente` com `tipo`/`email`; nova `PessoaAPI`                       |
| `packages/contracts/src/types/index.ts`                      | Re-exporta `PessoaAPI`                                                              |
| `packages/shared/src/types/index.ts`                         | `AgendamentoResponse.cliente` com `tipo`/`email`                                    |
| `apps/mobile/src/shared/hooks/barbeiro/use-criar-walk-in.ts` | Aceita `contato/contatoId/clienteId` (XOR)                                          |
| `apps/mobile/src/features/barbeiro/ClienteCard.tsx`          | Aceita `PessoaAPI`; badge âmbar WALK-IN para `tipo='contato'`                       |
| `apps/mobile/src/features/barbeiro/ClienteDetalhe.tsx`       | Aceita `PessoaAPI`; Agendar desabilitado para contatos                              |
| `apps/mobile/app/(barbeiro)/clientes.tsx`                    | Usa `usePessoasDaBarbearia` + `PessoaAPI`                                           |
| `apps/mobile/app/(barbeiro)/agenda.tsx`                      | Estado `clienteDetalhe` migra para `PessoaAPI`                                      |
| Vários componentes de agenda mobile                          | Null-safe `agendamento.cliente?.nome ?? 'Encaixe'`                                  |
| Vários arquivos de teste mobile                              | Fixtures atualizados com `tipo: "usuario"` + `email`                                |

---

## Arquitetura — discriminador `tipo`

```
TQE_AGD (Agendamento)
  ├─ clienteId  (nullable FK → TQE_USR)   tipo = 'usuario'
  └─ contatoId  (nullable FK → TQE_CONTATO) tipo = 'contato'
       CHECK: (clienteId IS NULL) != (contatoId IS NULL)   ← XOR
```

`serializeAgendamento` absorve ambos em `cliente: { tipo, usrCodigo, nome, telefone, email }`.

`PessoaAPI` é o tipo unificado no endpoint `/pessoas`, combinando:

- `TQE_USR` com stats calculadas (via `findClientes`)
- `TQE_CONTATO` com stats zeradas

---

## Commit history

| #   | Hash | Descrição                                                                                      |
| --- | ---- | ---------------------------------------------------------------------------------------------- |
| C1  | —    | schema: modelo Contato, FK nullable, migração SQL                                              |
| C2  | —    | feat(api): ContatoService + ContatoModule                                                      |
| C3  | —    | feat(api): createWalkIn delega para ContatoService                                             |
| C4  | —    | test(api): ContatoService spec (8 testes)                                                      |
| C5  | —    | feat(api): serialize-agendamento unifica cliente/contato                                       |
| C6  | —    | feat(shared): AgendamentoResponse.cliente com tipo+email                                       |
| C7  | —    | feat(mobile): use-criar-walk-in v2 (XOR contato/contatoId/clienteId)                           |
| C8  | —    | fix(mobile): null-safe cliente em componentes de agenda                                        |
| C9  | —    | test(api): serialize-agendamento.spec + membro-barbearia.spec findPessoas                      |
| C10 | —    | feat(contracts): PessoaAPI + AgendamentoAPI.cliente atualizado                                 |
| C11 | —    | feat(api): GET /barbearias/:id/pessoas                                                         |
| C12 | —    | feat(mobile,contracts): PessoaAPI unificada, badge WALK-IN, Agendar desabilitado para contatos |

---

## Invariantes preservados

- `apps/api/src/publico/publico.service.ts` — **não tocado**
- `criarClienteRapidoSchema` em contracts — **não alterado**
- `findOrCreateCliente` em `membro-barbearia.service.ts` — **não alterado**
- Fluxo de convite de barbeiro — **não alterado**
- `ClienteNota` model/lógica — **não alterado**
- `AvaliacaoAgendamento` — **não alterado**

---

## Validação

```bash
pnpm --filter api test    # todos os testes da API passam
pnpm --filter mobile test # 592 testes passam
cd apps/api && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
pnpm --filter mobile lint
```
