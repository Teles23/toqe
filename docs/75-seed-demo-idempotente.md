# 75 — Seed de demonstração idempotente e fonte única

**Status:** Implementado (3 checks da API verdes — sem commit/push)
**Branch:** develop
**Base:** doc 56 (status em_andamento), enum `StatusAgendamento`

## Contexto

Investigação de "agendamentos novos todo dia" no ambiente local. Não era cron
nem uso real do app: era o **seed** criando dados de demonstração. Diagnóstico
pelo banco (`TQE_AGENDAMENTO`): 55 de 60 linhas com status minúsculo (assinatura
do `seed-runner.js` rodado no boot do container `docker-compose.dev.yml`).

Dois bugs reais ficaram evidentes:

1. **Acúmulo a cada execução** — o 3º agendamento de demo usava
   `inicio: addHours(new Date(), -1)`, um horário relativo ao instante da
   execução. O seed deduplica por `(barbeiroId, inicio)`, então cada boot gerava
   um `inicio` inédito → **um agendamento novo por execução**, para sempre.

2. **Dois seeds divergentes** — `seed.ts` (usado por `prisma db seed` /
   `prisma migrate dev`) gravava status em **MAIÚSCULO** e ainda usava
   `EM_ATENDIMENTO`, valor que **não existe** no enum. `seed-runner.js` (usado
   no Docker) gravava em minúsculo. O enum canônico
   `StatusAgendamento` (`apps/api/src/common/constants/agendamento-status.ts`)
   é **minúsculo** (`concluido`, `em_andamento`, …), então o `seed.ts` produzia
   dados fora do contrato.

## Solução

Fonte única dos agendamentos de demo, consumida pelos dois seeds, com `inicio`
determinístico por dia (horários fixos 09h, 10h, 14h) e status batendo com o
enum. Teste sob `src/` importa o módulo real + o enum e trava as duas garantias
(statuses válidos e idempotência).

## Arquivos criados

| Arquivo                                      | Propósito                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `apps/api/prisma/seed-demo-data.js`          | Fonte única (CJS) — `buildAgendamentosDemo(refDate)`, statuses minúsculos, `inicio` fixo por dia |
| `apps/api/prisma/seed-demo-data.d.ts`        | Tipos do módulo para consumo em TS sem `any`                                                     |
| `apps/api/src/prisma/seed-demo-data.spec.ts` | Testa o módulo real: statuses ∈ enum, idempotência, ancoragem no início do dia                   |

## Arquivos modificados

| Arquivo                          | Mudança                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `apps/api/prisma/seed.ts`        | Usa `buildAgendamentosDemo()`; remove array inline com status MAIÚSCULO/`EM_ATENDIMENTO`; imports date-fns enxutos |
| `apps/api/prisma/seed-runner.js` | Usa `buildAgendamentosDemo()`; remove array inline e `addHours(new Date(),-1)`                                     |

## Validação

- `pnpm --filter api lint` — OK
- `cd apps/api && npx tsc --noEmit` — OK
- `pnpm --filter api test` — 47 suites / 431 testes OK (inclui o novo spec)
- `node --check` nos dois seeds — OK

## Observações

- **Não houve limpeza de banco** — as 60 linhas de demo pré-existentes seguem lá
  (decisão do usuário). A correção só impede novo acúmulo daqui pra frente.
- Mudança restrita à API (scripts de seed). Sem alteração de contrato, endpoint
  ou MSW handler — frontend não afetado.
- A divergência só foi possível porque há dois seeds (TS via ts-node e JS puro
  para o Docker sem ts-node). O módulo CJS único elimina a divergência sem exigir
  build extra no container.
