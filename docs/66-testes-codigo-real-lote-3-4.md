# 66 — Testes que exercitam o código real (Fase 2 · lotes 3 e 4)

**Status:** Implementado
**Branch:** develop
**Base:** auditoria pós-sprint — seção 1 (reescrita de specs mockados)

## Contexto

Continuação dos lotes 1-2 (docs 64-65). Reescreve specs de **telas do barbeiro/
cliente** e de **modais de feature** que mockavam hooks de negócio, passando a
exercitar hooks/telas/componentes reais com mock só do boundary HTTP
(`global.fetch`). Sessão (`useAuth`) e infra seguem mockadas.

## Lote 3 — telas

| Spec                                             | Hook real exercitado                         | Endpoint                        |
| ------------------------------------------------ | -------------------------------------------- | ------------------------------- |
| `app/(barbeiro)/__tests__/clientes.test.tsx`     | `useClientesDaBarbearia`                     | GET `/barbearias/:cod/clientes` |
| `app/(barbeiro)/perfil/__tests__/index.test.tsx` | `useBarbeiroStats` (pendente — não asserido) | GET `/me/stats`                 |
| `app/(cliente)/perfil/__tests__/index.test.tsx`  | `useAgendamentosMeus`                        | GET `/agendamentos/meus`        |

## Lote 4 — modais de feature

| Spec                                                            | Hooks reais                      | Endpoint(s)                                   |
| --------------------------------------------------------------- | -------------------------------- | --------------------------------------------- |
| `src/features/cliente/__tests__/AvaliacaoSheet.test.tsx`        | `useAvaliarAgendamento`          | POST `/agendamentos/:cod/avaliacao`           |
| `src/features/barbeiro/__tests__/AdicionarWalkInModal.test.tsx` | `useServicos` + `useCriarWalkIn` | GET `/servicos`, POST `/agendamentos/walk-in` |
| `src/features/barbeiro/__tests__/CriarServicoModal.test.tsx`    | `useCriarServico`                | POST `/servicos`                              |

Os testes de submit agora verificam a **requisição HTTP real** (método+URL+body)
em vez de só checar `mutateAsync`. Ex.: AvaliacaoSheet → POST com `{nota,comentario}`;
AdicionarWalkInModal → POST com `{barbeiroId, servicosIds, cliente:{nome,email}}`.

## Estabilidade de testes (flake fix)

Sob carga (os ~92 suites rodando em paralelo), o timeout default de 1000ms dos
utilitários async do testing-library (`findBy*`/`waitFor`) era apertado e causava
flakes intermitentes em telas que carregam dados via React Query. Subi para
**5000ms** em `apps/mobile/jest.setup.js` (`configure({ asyncUtilTimeout: 5000 })`).
Não mascara travas reais — o timeout do Jest por teste continua maior.

## Checks

mobile: tsc limpo, lint 0 erros, suíte completa verde.

## Pendente (lote final)

- `ClienteDetalhe` (histórico + nota), `FilaSection` (fila + atender),
  `convite/[token]` (aceitar/rejeitar) — últimos specs que mockam hooks de negócio.
