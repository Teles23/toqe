# 61 — Jornada semanal transacional (Fase 5)

**Status:** Implementado
**Branch:** develop
**Base:** Fase 5 do fluxo barbeiro (slide 15)

## Contexto

Slide 15: o editor de jornada salva os **7 dias** de uma vez. Antes, o mobile
fazia **um POST por dia ativo** (`POST /agenda/jornada/:barbeiroId`) — N
requisições, sem atomicidade: se uma falhasse, a semana ficava meio-salva. E não
havia como marcar **folga** (dia inativo só era omitido).

## Mudança

Novo `PUT /agenda/jornada/:barbeiroId` recebe os 7 dias e salva **numa única
transação**: dias `ativo` criam/atualizam o registro; dias inativos (folga)
**removem** o registro do dia. Se qualquer passo falha, nada é persistido.

| Arquivo                                                          | Mudança                                                                                                                    |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts/src/schemas/agenda.ts`                       | `configJornadaSemanalSchema` (`{ dias: [{ diaSemana, ativo, inicio, fim, almocoIni, almocoFim }] }`) + refinements por dia |
| `apps/api/src/agenda/dto/config-jornada-semanal.dto.ts` _(novo)_ | DTO                                                                                                                        |
| `apps/api/src/agenda/agenda.service.ts`                          | `upsertJornadaSemanal()` — `$transaction` (upsert ativos + deleteMany folgas)                                              |
| `apps/api/src/agenda/agenda.controller.ts`                       | `PUT jornada/:barbeiroId` (reusa a checagem de ownership: barbeiro só edita a própria)                                     |
| `apps/mobile/src/shared/hooks/barbeiro/use-salvar-jornada.ts`    | uma chamada `PUT` com `{ dias: [...] }` (todos os dias, com `ativo`)                                                       |

O `POST /agenda/jornada/:barbeiroId` (um dia) continua existindo (ex.: dono/gerente
ajustando um dia avulso de outro barbeiro).

```http
PUT /agenda/jornada/:barbeiroId
Header: x-tenant-id: 7
{ "dias": [
  { "diaSemana": 1, "ativo": true,  "inicio": "09:00", "fim": "18:00", "almocoIni": "12:00", "almocoFim": "13:00" },
  { "diaSemana": 0, "ativo": false, "inicio": "09:00", "fim": "18:00", "almocoIni": "12:00", "almocoFim": "13:00" }
]}
→ 200  [JornadaTrabalho...]  (dias ativos, ordenados por diaSemana)
```

> **Não afeta agendamentos já confirmados** — a jornada só baliza disponibilidade
> futura; mudar a jornada não mexe em `TQE_AGENDAMENTO` existentes.

## Testes

- **api** `agenda.service.spec.ts`: `upsertJornadaSemanal` roda em transação,
  cria/atualiza ativos, remove folgas, não vaza `ativo` nos dados gravados.
  `agenda.controller.spec.ts`: delega + ownership (barbeiro só a própria).
- **mobile** `use-salvar-jornada.test.tsx`: um único PUT com `{ dias: [...] }`
  (inclui dias inativos); invalida `['jornada']`.

## Observações

- Almoço: a tela ainda não coleta — o hook envia placeholder `12:00`/`13:00`
  (substituir quando a UI expandir).
- Sem migração (o modelo `JornadaTrabalho` já existia).
