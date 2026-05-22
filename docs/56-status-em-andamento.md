# 56 — Status EM_ANDAMENTO (iniciar atendimento)

**Status:** Implementado
**Branch:** develop
**Base:** Fase 2 do fluxo barbeiro (slides 07–09 do protótipo "Toqe Fluxo Barbeiro")

## Contexto

O protótipo prevê o ciclo operacional `pendente → confirmado → em_andamento → concluido` (slide 08 "Iniciar" e 09 "Concluir"). O enum só tinha 5 estados (`pendente | confirmado | cancelado | concluido | no_show`) — o mobile mapeava "iniciar" → `confirmado` como gambiarra. Esta fase adiciona o estado **`em_andamento`**.

## Sem migração de banco

`TQE_AGD_STATUS` é `VARCHAR(20)` **sem CHECK constraint** (ver `migrations/20260507012855_init`). `"em_andamento"` (12 chars) cabe — não há mudança de schema Prisma nem migração. A representação canônica é **lowercase** em todas as camadas (enum, contracts, shared, linhas do DB).

## Arquivos modificados

| Arquivo                                                       | Mudança                                                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/types/index.ts`                          | `StatusAgendamento` += `"em_andamento"`                                                                                                               |
| `packages/contracts/src/schemas/agendamento.ts`               | `patchStatusAgendamentoSchema` + `listAgendamentoSchema` aceitam `em_andamento`                                                                       |
| `apps/api/src/common/constants/agendamento-status.ts`         | `StatusAgendamento.EM_ANDAMENTO = 'em_andamento'`; incluído em `STATUSES_BLOQUEANTES`                                                                 |
| `apps/api/src/agendamento/agendamento.service.ts`             | `agendamentoAtual()` passa a considerar `em_andamento` (o que está sendo atendido é o "atual")                                                        |
| `apps/web/.../agenda/constants/agenda.constants.ts`           | `API_STATUS_TO_SLOT.em_andamento → "active"` (web não tem estado próprio de in-progress; reusa "active")                                              |
| `apps/mobile/.../barbeiro/AgendaRow.tsx`                      | `STATUS_DOT_COLORS.em_andamento = "#22c55e"`; `getStatusLabel → "Atendendo"`                                                                          |
| `apps/mobile/app/(barbeiro)/agenda.tsx`                       | `handleDetailAction`: `iniciar → "em_andamento"` (era `confirmado`)                                                                                   |
| `apps/mobile/.../barbeiro/FilaSection.tsx`                    | "Atender" agora seta `em_andamento` (protótipo slide 11: "Atender → EM_ANDAMENTO")                                                                    |
| `apps/mobile/.../barbeiro/FilaCard.tsx`                       | label de `em_andamento` = "Em atendimento"; `confirmado` → "Confirmado"                                                                               |
| `apps/mobile/app/(cliente)/agendamentos/{index,[codigo]}.tsx` | mapas `Record<StatusAgendamento,…>` ganham `em_andamento` (label + cor verde)                                                                         |
| `apps/api/prisma/seed-runner.js`                              | statuses corrigidos para **lowercase** (`concluido`, `em_andamento`) — antes usava `'CONCLUIDO'`/`'EM_ATENDIMENTO'` (uppercase, não batia com o enum) |

`AppointmentDetailSheet.tsx` já tratava `em_andamento` (confirmado → Iniciar; em_andamento → No-show + Concluir) — nenhuma mudança necessária ali.

## Cor / label

- **Cor:** `#22c55e` (verde) — "atendendo agora", consistente com o protótipo.
- **Label:** "Atendendo" (agenda) / "Em atendimento" (fila e cliente).

## Fluxo operacional resultante

1. Cliente toca em PENDENTE → Aceitar → `confirmado`.
2. Cliente chega → Iniciar → `em_andamento` (dot verde, "Atendendo").
3. Termina → Concluir → `concluido`. Ou No-show → `no_show`.
4. Fila: "Atender →" move o walk-in direto para `em_andamento`.

## Testes

- **api** `agendamento.service.spec.ts`: `patchStatus` aceita `em_andamento`; `agendamentoAtual` inclui `em_andamento` no filtro.
- **web** `use-agenda.spec.ts`: mapeia `em_andamento → active`.
- **mobile**: `AgendaRow.test` (cor + label "Atendendo"), `AppointmentDetailSheet.test` (ações No-show/Concluir), `agenda.test` (ação iniciar → `em_andamento`), `FilaSection.test` (Atender → `em_andamento`).

## Decisões / limitações

- Web não ganhou um `SlotStatus` próprio de in-progress (reusa `active`, igual a `concluido`) — o foco da fase é o fluxo do barbeiro no mobile. Refinar o web (estado visual distinto) é follow-up.
- `em_andamento` **não** entra em `STATUSES_ATIVOS`/`STATUSES_ENCERRADOS` (métricas de faturamento/volume contam só `concluido`/encerrados) — correto, pois ainda não há desfecho.
- "Some da fila" ao atender (slide 11) não foi alterado aqui — `FilaSection` ainda lista todos os walk-ins do dia; refinamento de filtro fica como follow-up.
