# 63 — Auditoria pós-sprint: bugs UX, texto e política de senha

**Status:** Implementado
**Branch:** develop
**Base:** auditoria do fluxo barbeiro (agenda) + consistência de autenticação

## Contexto

Auditoria após as Fases 1-5 do fluxo barbeiro revelou quatro bugs de UX na
agenda, strings "No-show" em inglês visíveis ao usuário e a regra de senha
inconsistente entre camadas (mín. 6 em vários pontos, mín. 8 só no convite),
além da falta do toggle de visibilidade da senha em telas-chave.

Esta é a **Fase 1** do pacote de auditoria (bugs + texto + senha). A reescrita
dos testes que mockam lógica de negócio fica para a Fase 2.

## Bugs de UX (mobile — agenda do barbeiro)

| #   | Sintoma                                   | Causa                                              | Correção                                                                                                                   |
| --- | ----------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Atender →" não tirava o encaixe da fila  | `useUpdateStatus` invalidava só `["agendamentos"]` | invalida também `["fila"]` (espelha `useCriarWalkIn`)                                                                      |
| 2   | Fila empurrava a agenda para baixo        | `FilaSection` era lista vertical sempre expandida  | virou **banner colapsável**: colapsado mostra contador + prévia do 1º + atalho "Atender →"; expande no tap; vazio → `null` |
| 3   | Pull-to-refresh só sobre a lista          | `RefreshControl` ficava só no `FlatList` interno   | header + stats + fila agora são o `ListHeaderComponent` do `FlatList` → gesto cobre o topo da tela                         |
| 4   | `ActionMenuSheet` alto demais (vão vazio) | `BottomSheet height="auto"` = 80% fixo da tela     | novo modo `height="content"` (ajusta-se ao conteúdo, sem altura fixa); `ActionMenuSheet` usa esse modo                     |

| Arquivo                                                      | Mudança                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `apps/mobile/src/shared/hooks/barbeiro/use-update-status.ts` | invalida `["agendamentos"]` **e** `["fila"]`                                           |
| `apps/mobile/src/features/barbeiro/FilaSection.tsx`          | banner colapsável (`useState` + `LayoutAnimation`); reusa `WalkInCard`/`RedPulsingDot` |
| `apps/mobile/src/shared/ui/BottomSheet.tsx`                  | `height: number \| "auto" \| "content"`; em `content` não fixa altura                  |
| `apps/mobile/src/features/barbeiro/ActionMenuSheet.tsx`      | `height="content"`                                                                     |
| `apps/mobile/src/shared/ui/DataListWrapper.tsx`              | encaminha `ListHeaderComponent` e o mantém visível em loading/erro                     |
| `apps/mobile/app/(barbeiro)/agenda.tsx`                      | header/stats/fila no `ListHeaderComponent`; padding horizontal por seção/linha         |

## Texto — "No-show" → "Não compareceu"

Apenas **strings visíveis** ao usuário. Enum `no_show`/`NO_SHOW`, `testID`s
(`action-no_show`) e nomes de função/hook foram mantidos (contrato canônico).

- `FilaCard.tsx` (label de status + ação "Marcar não compareceu")
- `AgendaRow.tsx` (`getStatusLabel`)
- `AppointmentDetailSheet.tsx` (botão)
- `utils/agendamento-actions.ts` (ação + badge)
- `(cliente)/agendamentos/index.tsx` (label de status)
- `(barbeiro)/perfil/index.tsx` (rodapé "N faltas este mês")

> "Walk-in" já aparecia como **"Encaixe"** na UI — nada a trocar.

## Senha — mínimo 8 em todas as camadas + toggle de visibilidade

`min(6)`/`@MinLength(6)`/placeholders com "6" eram um bug de consistência (o
convite já exigia 8). Tudo padronizado em **8**.

| Camada   | Arquivo                                          | Mudança                                                                  |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| Contrato | `packages/contracts/src/schemas/auth.ts`         | `login`, `register`, `reset`, `change` → `min(8)`                        |
| Web      | `features/auth/components/ResetPasswordForm.tsx` | schema `min(8)` + placeholder + **toggle de olho** (espelha `LoginForm`) |
| Web      | `app/onboarding/page.tsx`                        | placeholder "Mín. 8 caracteres"                                          |
| Mobile   | `app/(auth)/cadastro.tsx`                        | placeholder + `secureToggle` (senha e confirmar)                         |
| Mobile   | `app/(auth)/login.tsx`                           | `secureToggle`                                                           |
| Mobile   | `app/convite/[token].tsx`                        | campo trocado para `FormInput` com `secureToggle`                        |

**Toggle DRY:** `apps/mobile/src/shared/ui/FormInput.tsx` ganhou a prop
`secureToggle` — quando ativa, o componente controla `secureTextEntry`
internamente e renderiza um botão Feather `eye`/`eye-off` à direita
(`testID="toggle-senha"`, acessível). Não foi criado componente novo.

## Testes (acompanham o código)

- **mobile**: `use-update-status.test.tsx` (novo — hook real com `api-client`
  mockado, valida invalidação de `["agendamentos"]` + `["fila"]`);
  `FilaSection.test.tsx` (colapsado/expande/atalho); `BottomSheet.test.tsx`
  (modo `content` não aplica altura fixa); `FormInput.test.tsx` (toggle de
  senha); labels "Não compareceu" em `AgendaRow`/`AgendamentoCard`/
  `agendamento-actions`/`AppointmentDetailSheet`.
- **web**: `ResetPasswordForm.spec.tsx` (placeholder 8 + toggle de olho),
  `LoginForm.spec.tsx` e `onboarding.spec.tsx` (mensagem/placeholder 8).

### Checks

`api` 267, `web` 172, `mobile` 543 — todos verdes. Lints: 0 erros (api/web/mobile).
`tsc --noEmit`: limpo nos três.

## Observações

- Sem migração (nenhuma mudança de schema Prisma).
- A regra `min(8)` no `login` é segura: produto pré-lançamento, sem usuários
  legados com senha de 6-7 caracteres.
- Pendente (Fase 2): reescrever specs que mockam hooks de negócio para
  exercitar o código real (mobile via HTTP mockado, web via MSW).
