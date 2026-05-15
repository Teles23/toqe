# Mobile — Tela Agenda do Barbeiro

**Status:** ✅ Implementado
**Branch:** `mobile/feat/barbeiro-agenda` → `mobile/base`

---

## O que faz

Tela inicial do barbeiro (`app/(barbeiro)/agenda.tsx`). Lista os agendamentos do dia para o barbeiro logado, com navegação por dia (±1d), pull-to-refresh, e atualização de status via long-press.

---

## Arquivos

| Arquivo                                                                   | Papel                                                            |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/mobile/app/(barbeiro)/agenda.tsx`                                   | Tela (header + day nav + lista)                                  |
| `apps/mobile/src/features/barbeiro/AgendamentoCard.tsx`                   | Card de agendamento (horário, cliente, serviço, badge de status) |
| `apps/mobile/src/shared/hooks/barbeiro/use-agenda-dia.ts`                 | TanStack Query → `GET /agendamentos?data=&barbeiroId=`           |
| `apps/mobile/src/shared/hooks/barbeiro/use-update-status.ts`              | TanStack Mutation → `PATCH /agendamentos/:codigo/status`         |
| `apps/mobile/src/features/barbeiro/__tests__/AgendamentoCard.test.tsx`    | Testes do card (status, horário, multi-itens)                    |
| `apps/mobile/src/shared/hooks/barbeiro/__tests__/use-agenda-dia.test.tsx` | Testes do hook (queryKey, enabled, query string)                 |
| `apps/mobile/.maestro/flows/barbeiro-agenda.yaml`                         | E2E (open, navega dia, volta para hoje)                          |

---

## API consumida

```
GET /agendamentos?data=YYYY-MM-DD&barbeiroId=<usrCodigo>
Header: x-tenant-id: <barbearia.codigo>
→ AgendamentoResponse[] (de @toqe/shared)
```

```
PATCH /agendamentos/:codigo/status
Body: { status: 'confirmado' | 'cancelado' | 'concluido' | 'no_show' }
Header: x-tenant-id
```

`barbeiroId` = `user.codigo` do `useAuth()` (corresponde a `MembroResponse.usrCodigo`).
`tenantId` = `barbearia.codigo` do `useAuth()`.

---

## Fluxo

```
Mount
  → useAgendaDia(hoje)
  → tenantApi(barbearia.codigo).get('/agendamentos?data=…&barbeiroId=…')
  → render FlatList<AgendamentoCard>

Long-press card
  → ActionSheet (iOS) ou Alert (Android) com 4 opções:
       Confirmar | Concluído | No-show | Cancelar
  → useUpdateStatus.mutate({ codigo, status })
  → onSuccess: invalidateQueries(['agendamentos']) → refetch automático

Tap "‹" / "›" no header
  → setSelectedDate(±1 dia) → useQuery refetch automático (queryKey muda)

Tap no label central
  → setSelectedDate(hoje)

Pull-to-refresh
  → refetch()
```

---

## Estados visuais

| Estado          | UI                                                                       |
| --------------- | ------------------------------------------------------------------------ |
| Loading inicial | `<ActivityIndicator>` centralizado                                       |
| Erro            | Texto: "Não foi possível carregar a agenda. Puxe para tentar novamente." |
| Vazio           | Texto: "Sem agendamentos para hoje." (ou "para este dia" se outra data)  |
| Refetch         | `RefreshControl` no topo da FlatList                                     |

---

## Cores de status (light/dark)

| Status                  | Light               | Dark      |
| ----------------------- | ------------------- | --------- |
| `pendente`              | `#f59f00` (laranja) | `#ffd43b` |
| `confirmado`            | `#1a73e8` (azul)    | `#4da3ff` |
| `concluido`             | `#2f9e44` (verde)   | `#51cf66` |
| `cancelado` / `no_show` | `#868e96` (cinza)   | `#adb5bd` |

---

## Testes

```bash
pnpm --filter mobile test
```

| Suite                      | Cenários                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `AgendamentoCard.test.tsx` | render horário/cliente/serviço, label correto por status, "+N" multi-itens, testID |
| `use-agenda-dia.test.tsx`  | não chama API sem auth, query string com data + barbeiroId corretos                |

---

## Acessibilidade

- Touch targets de navegação: 44pt × 44pt (botões `‹`, `›`, label de dia)
- `accessibilityLabel` em todos os botões e cards
- `accessibilityHint` no card explicando long-press
- Suporte completo dark/light mode via `useColorScheme()`
