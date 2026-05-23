# 69 — Auditoria pós-sprint (segunda rodada): UX do barbeiro

**Status:** Implementado (validação visual no device pendente — só o usuário)
**Branch:** develop

## Contexto

Segunda auditoria do app barbeiro (8 itens). Itens 1, 3c e 8 já estavam
concluídos em rodadas anteriores (fila invalida `["fila"]`; "no-show"→"Não
compareceu"; `AgendamentoModal.spec` só mocka infra). Os demais foram corrigidos,
um commit por item.

## Itens corrigidos

| Item                          | Mudança                                                                                                                                                                                   | Arquivos-chave                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 3 — termos técnicos           | removido "Será inserido como WALK_IN…"; empty da agenda "walk-in"→"encaixe"                                                                                                               | `AdicionarWalkInModal.tsx`, `agenda.tsx`                                                                          |
| 4 — "Não compareceu"          | sai de `em_andamento` (cliente já veio) e vai p/ `confirmado`; em_andamento mostra só "Concluir"                                                                                          | `AppointmentDetailSheet.tsx`                                                                                      |
| 7 — tab inativa               | token `tabInactive` (#888888 dark, ≈5.3:1 — passa WCAG AA) substitui `textDisabled` (#333)                                                                                                | `theme/tokens.ts`, `ui/tab-bar-options.tsx`                                                                       |
| 5 — Ver histórico / Reagendar | histórico reabre `ClienteDetalhe` na agenda (montado do agendamento; stats ausentes → "—"); reagendar abre o Encaixe pré-preenchido (props `prefillNome`/`prefillServicoId`)              | `agenda.tsx`, `AdicionarWalkInModal.tsx`                                                                          |
| 2 — email do encaixe          | `email` opcional no walk-in (só no contrato walk-in); servidor gera um único `@toqe.internal` quando ausente e pula o dedup por email                                                     | `contracts/agendamento.ts`, `api/membro-barbearia.service.ts`, `AdicionarWalkInModal.tsx`, `use-criar-walk-in.ts` |
| 6 — arrastar p/ fechar        | `GestureHandlerRootView` no root; `Gesture.Pan` no handle do `BottomSheet` e do `AdicionarWalkInModal` (fecha além do limiar/velocidade, senão volta); handle com `testID="sheet-handle"` | `app/_layout.tsx`, `ui/BottomSheet.tsx`, `AdicionarWalkInModal.tsx`, `jest.setup.js`                              |

## Notas

- **Item 2 (server-side email):** `Usuario.email` é `@unique NOT NULL`; o
  contrato apenas torna o campo opcional na entrada — quem garante unicidade é o
  servidor (`upsertClienteUsuario`). O `criarClienteRapidoSchema` base (usado por
  "criar cliente rápido" e booking público) permanece com email obrigatório.
- **Item 6 (testes):** simulação de gesto no Jest é inviável; adicionado
  `react-native-gesture-handler/jestSetup` ao `jest.setup.js` (para os
  `GestureDetector` renderizarem) + Maestro `.maestro/flows/sheet-drag-close.yaml`.
  O fechamento por backdrop e por back do Android foram preservados.
- **Decisão de produto mantida:** navegação de dias (← →) na agenda.

## Follow-up (feedback de tela — fila do barbeiro)

Após validação visual, dois ajustes na seção de fila (`FilaSection`):

| Ponto                               | Problema                                                                                                   | Correção                                                                                                                                                                                | Arquivos-chave                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Cliente não saía da fila ao iniciar | a lista renderizava **todos** os itens da fila (inclusive `em_andamento`); o contador só somava `pendente` | a fila agora filtra **só quem aguarda** (`pendente`/`confirmado`); ao iniciar (`em_andamento`) o item sai da lista e o contador bate com o que aparece                                  | `FilaSection.tsx`                 |
| Bloco redundante                    | cada item mostrava nome/serviço/tempo **duas vezes** (linha `WalkInCard` + `FilaCard` logo abaixo)         | removido o `WalkInCard`; renderiza só o `FilaCard` (ordem + barra de espera). O CTA "Atender →" migrou para o header do `FilaCard` (nova prop `onAtender`), no lugar do badge de status | `FilaCard.tsx`, `FilaSection.tsx` |
| Pull-to-refresh não atualizava fila | o pull só refazia `useAgendaDia`; a fila (`useFilaDia`, query key `["fila"]`) ficava com cache stale       | o `refetch` do pull agora também invalida `["fila"]` (via `queryClient.invalidateQueries`) — puxar a agenda recarrega agenda **e** fila                                                 | `agenda.tsx`                      |

> **Por que o item já saía no backend mas continuava na tela:** `useUpdateStatus`
> já invalidava `["fila"]` ao atender, mas a `FilaSection` exibia o item
> `em_andamento` que voltava no GET (`tipo=WALK_IN` retorna todos os status). O
> filtro client-side resolve sem novo endpoint.

## Checks

mobile: tsc + lint limpos, suíte completa verde. api: tsc + specs verdes. web: tsc verde.

## Pendente (validação manual no device — só o usuário)

Atender→some da fila; CONFIRMADO mostra "Não compareceu" / EM_ANDAMENTO não;
"Ver histórico" abre o cliente certo; "Reagendar" abre Encaixe pré-preenchido;
arrastar p/ baixo fecha os 5 sheets; tab inativa legível.
