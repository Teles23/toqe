# 76 — Agenda por dia ancorada em America/Sao_Paulo (fix off-by-one)

**Status:** Implementado e commitado (3 checks da API verdes)
**Branch:** develop
**Base:** doc 75 (seed idempotente), enum `StatusAgendamento`

## Contexto

No app, a agenda de **hoje** exibia os agendamentos de **ontem**. Diagnóstico:
não era bug do app (o cliente manda `data=YYYY-MM-DD` corretamente) — era a API.

Em `agendamento.service.ts` (listagem) e `agenda.service.ts` (slots), o código
fazia:

```ts
const dia = new Date(filtros.data); // "2026-05-26"
where.inicio = { gte: startOfDay(dia), lte: endOfDay(dia) };
```

`new Date("2026-05-26")` segue o padrão ISO e é interpretado como **meia-noite
UTC**, enquanto `startOfDay`/`endOfDay` do date-fns operam no **fuso do
processo**. Num servidor em offset negativo (Brasil, −0300) as duas referências
ficam defasadas em 3h e o range "anda" um dia para trás → pedir o dia 26
retornava o dia 25.

## Solução (robusta, independente do fuso do servidor)

Helper único que converte a data-calendário nos instantes UTC de início/fim do
dia **fixando `America/Sao_Paulo`** via `date-fns-tz` (`fromZonedTime`). Vale em
qualquer servidor (dev em −0300, prod em UTC). Em `getAvailableSlots`, também
ancoramos o dia-da-semana, os horários de trabalho e a exibição dos slots no
mesmo fuso.

## Arquivos modificados

| Arquivo                                           | Mudança                                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/package.json`                           | Adiciona `date-fns-tz` `^3.2.0` (mesma versão do mobile)                                                                                   |
| `apps/api/src/common/utils/date.utils.ts`         | Novo `rangeDoDia(dateStr, tz)` + const `TIMEZONE_BARBEARIA`                                                                                |
| `apps/api/src/agendamento/agendamento.service.ts` | `findAll` usa `rangeDoDia`; remove `new Date`+`startOfDay/endOfDay`                                                                        |
| `apps/api/src/agenda/agenda.service.ts`           | `getAvailableSlots`: range via `rangeDoDia`, weekday via `formatInTimeZone`, horários via `fromZonedTime`, exibição via `formatInTimeZone` |

## Testes (no mesmo commit)

| Arquivo                                       | Cobre                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/common/utils/date.utils.spec.ts`         | `rangeDoDia`: limites em UTC, exclui dia anterior / inclui o próprio dia, ignora hora do ISO |
| `src/agendamento/agendamento.service.spec.ts` | `findAll` com `data` date-only usa o range correto (off-by-one)                              |
| `src/agenda/agenda.service.spec.ts`           | `getAvailableSlots` date-only: weekday e range do dia certos                                 |

As asserções usam ISO em UTC, então são determinísticas em qualquer fuso de CI.

## Validação

- `pnpm --filter api lint` — OK
- `cd apps/api && npx tsc --noEmit` — OK
- `pnpm --filter api test` — 47 suites / 436 testes OK (+5 novos)

## Observações / escopo

- **Contrato inalterado**: a API continua recebendo `?data=YYYY-MM-DD`. Web e
  mobile não mudam.
- **Pontos tz-naive remanescentes** (fora do escopo deste fix, ainda assumem
  servidor = horário da barbearia): `agenda.service.getProximosSlots`,
  `relatorio.service`, `dashboard.service`, `lembrete.service`. Para consistência
  total em produção, recomenda-se **rodar o container da API com
  `TZ=America/Sao_Paulo`** — aí todo o código baseado em `new Date()` local
  também fica correto. Tratar num PR dedicado se desejado.
- Premissa do helper: a parte de data da entrada (`YYYY-MM-DD`) é o dia-calendário
  pretendido. Brasil não tem horário de verão desde 2019, então o offset é estável.
