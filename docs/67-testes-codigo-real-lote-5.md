# 67 — Testes que exercitam o código real (Fase 2 · lote 5, final)

**Status:** Implementado
**Branch:** develop
**Base:** auditoria pós-sprint — seção 1 (reescrita de specs mockados)

## Contexto

Lote final da Fase 2. Reescreve os últimos specs que mockavam hooks de negócio,
fechando o objetivo: **nenhum spec de tela/componente mocka mais a lógica de
negócio do app** — todos exercitam hooks/componentes reais com mock só do
boundary HTTP (`global.fetch`). Sessão (`useAuth`) e infra seguem mockadas.

## Specs reescritos

| Spec                                                      | Hooks reais                                                     | Endpoint(s)                                                                  |
| --------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/features/barbeiro/__tests__/FilaSection.test.tsx`    | `useFilaDia` + `useUpdateStatus`                                | GET `/agendamentos?…&tipo=WALK_IN`, PATCH `/agendamentos/:id/status`         |
| `src/features/barbeiro/__tests__/ClienteDetalhe.test.tsx` | `useHistoricoCliente`, `useClienteNota`, `useSalvarNotaCliente` | GET `/agendamentos?status=concluido&clienteId`, GET/PUT `/clientes/:id/nota` |
| `app/convite/__tests__/[token].test.tsx`                  | `useConvite`, `useAceitarConvite`, `useRejeitarConvite`         | GET/POST(`/aceitar`)/DELETE `/convite/:token`                                |

## Detalhes

- **FilaSection**: o banner colapsável (doc 63) carrega a fila via `useFilaDia`
  real; o atalho "Atender" agora verifica o **PATCH** real com `em_andamento`.
- **ClienteDetalhe**: histórico e nota carregam via API; salvar a nota verifica
  o **PUT** `/clientes/:id/nota` com o conteúdo.
- **convite**: o fluxo de aceite roda o `useAceitarConvite` real → `onSuccess`
  dispara `establishSession` (sessão, mockada) → boas-vindas. Rejeitar verifica
  o **DELETE**. Removidos os fake timers (a tela não usa `setTimeout`).

## Checks

mobile: tsc limpo, lint 0 erros, suíte completa verde.

## Resumo da Fase 2 (lotes 1-5)

Reescritos para "código real" (mock só do boundary HTTP):

- **Mobile (telas):** agenda barbeiro, clientes barbeiro, perfis barbeiro/cliente,
  cliente home/buscar/agendamentos(lista+detalhe).
- **Mobile (componentes):** FilaSection, ClienteDetalhe, AvaliacaoSheet,
  AdicionarWalkInModal, CriarServicoModal, convite [token].
- **Web:** AgendamentoModal (via MSW real).
- **Já conformes (sem mudança):** agendar/index (mockava só `api-client`),
  AppointmentDetailSheet (presentacional via prop), e os specs de hooks `use-*`
  (já mockavam só `api-client`).

Pendência conhecida (fora do escopo desta auditoria): testes de integração da
API (Testcontainers) não rodam no host Windows.
