# 65 — Testes que exercitam o código real (Fase 2 · lote 2)

**Status:** Implementado
**Branch:** develop
**Base:** auditoria pós-sprint — seção 1 (reescrita de specs mockados)

## Contexto

Continuação do lote 1 (doc 64). Reescreve specs das **telas do cliente** que
mockavam hooks de negócio, passando a exercitar os hooks/telas reais com mock
apenas do boundary HTTP (`global.fetch`). Sessão (`useAuth`) e infra
(`expo-*`, `expo-router`) seguem mockadas.

## Specs reescritos

| Spec                                                     | Antes                                                                     | Depois                                                                                                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(cliente)/__tests__/home.test.tsx`                  | mockava `useProximoAgendamento`/`useProximosSlots`/`useAgendamentosMeus`  | hooks reais via `fetch` roteado (`/agendamentos/proximo`, `/agenda/proximos`, `/agendamentos/meus`); cobre header/sem-barbearia/quick-book vazio·idle·slots·confirmar/next-apt (10) |
| `app/(cliente)/__tests__/buscar.test.tsx`                | mockava `useBarbeariasPublico`                                            | hook real via `fetch` (`/barbearias/publico`); loading/lista/vazio/navegação/input/header (6)                                                                                       |
| `app/(cliente)/agendamentos/__tests__/[codigo].test.tsx` | mockava `useAgendamento`/`useCancelarAgendamento`/`useAvaliarAgendamento` | hooks reais via `fetch` roteado por método (GET/DELETE `/agendamentos/42`); loading/erro 500/status/detalhe/cancelar (faz DELETE) (7)                                               |

## Sem reescrita (já conforme)

- `app/(cliente)/agendar/__tests__/index.test.tsx` — **já** mockava só o
  `api-client` (`api.get`/`api.post`), não os hooks. Exercita a tela e os hooks
  reais; mantido como está.

## Detalhes

- `useProximosSlots` engole erros (retorna `null`) → a view de erro do quick-book
  não é acionável via falha de rede; coberto via slots vazios/null → estado vazio.
- Detalhe: o cancelamento passa pelo `useCancelarAgendamento` real → o teste
  verifica o **DELETE** `/agendamentos/42` (antes só checava o `mutateAsync`).
- Timers: a home usa um `setTimeout` client-side no "confirmar" (sem endpoint);
  o teste usa timers reais e espera o estado `confirmed`.

## Checks

mobile: tsc limpo, lint 0 erros, suíte completa verde. API/web inalterados.

## Pendente (próximos lotes)

- Specs do barbeiro que mockam hooks de negócio (ex.: `clientes.test`,
  `perfil/index.test`) e demais telas/hosts do cliente.
