# 73 — Fila de encaixe: filtragem por compatibilidade de serviço

**Status:** Em andamento
**Branch:** develop
**Base:** doc 72 (correções Clientes + senha)

## Decisão de produto

A **fila de encaixe (walk-in) não tem escolha de barbeiro** — qualquer barbeiro
disponível pode atender. Mas nem todo barbeiro faz todo serviço. Então:

1. A **fila visual** de cada barbeiro mostra **apenas** encaixes compatíveis com
   os serviços que ele realiza.
2. Ao tocar **"Atender →"**, o backend **valida** que o barbeiro realiza o
   serviço do encaixe. Se não realiza, retorna **403** com mensagem clara.

## Regra de negócio (BarbeiroServico / `TQE_BARBEIRO_SERVICO`)

A compatibilidade vem de `BarbeiroServico` (`@@unique([barbeiroId, srvCodigo])`,
campo `ativo` default `true`):

| Estado do registro                    | Pode atender?                      |
| ------------------------------------- | ---------------------------------- |
| **Sem registro** (nunca configurou)   | ✅ sim (usa o padrão da barbearia) |
| `ativo = true`                        | ✅ sim                             |
| `ativo = false` (desativou o serviço) | ❌ não → 403                       |

Ou seja, só um registro **explícito** com `ativo=false` bloqueia. Encaixes com
múltiplos serviços: basta **um** serviço desativado para bloquear/filtrar.

## Itens

| Item   | Mudança                                                                                                                                     | Commit |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Item 1 | Guard no `patchStatus`: `WALK_IN` → `em_andamento` valida `BarbeiroServico.ativo` do executor (`req.user.sub`); incompatível → 403. + specs | —      |

## Detalhes técnicos

### Item 1 — Guard ao iniciar encaixe (`agendamento.service.ts` / `.controller.ts`)

- `patchStatus(codigo, dto, barCodigo, executorId?)` ganha o `executorId` (vem do
  JWT via `req.user.sub`, passado pelo controller).
- Quando `dto.status === 'em_andamento'` **e** `agendamento.tipo === 'WALK_IN'`
  **e** há `executorId`: busca `BarbeiroServico` do executor com
  `srvCodigo IN (itens.srvCodigo)` e `ativo=false`. Se achar → `ForbiddenException`
  com "Você não realiza este serviço. Outro barbeiro deve atender."
- Demais transições (NORMAL, ou status ≠ em_andamento) **não** consultam
  `BarbeiroServico`.
- Specs (`agendamento.service.spec.ts`): sem registro → ok; ativo (sem inativo) →
  ok; `ativo=false` → 403 (sem `update`); NORMAL em_andamento → ok sem consulta;
  `confirmado` em WALK_IN → ok sem consulta. Controller spec passa `req.user.sub`.

## Endpoints afetados

- `PATCH /agendamentos/:codigo/status` — passa a validar compatibilidade ao
  iniciar um encaixe (403 quando incompatível).

## Comportamento no mobile

- A fila (`FilaSection`) só lista encaixes compatíveis (filtro no backend, item 3).
- Se ainda assim um encaixe incompatível for atendido, o toast mostra a mensagem
  real do backend (item 4).

## Checks

api: `pnpm --filter api test -- agendamento` (45 verdes), `tsc` + `lint` limpos.
