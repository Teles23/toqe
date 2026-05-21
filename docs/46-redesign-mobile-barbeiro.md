# 46 — Redesign Mobile Barbeiro (Urban Flow v2)

**Status:** Implementado  
**Branch:** `feat/mobile-barbeiro-screens`  
**Base:** `feat/super-admin`  
**PR:** para `develop`

---

## Contexto

Redesign completo das telas do grupo `(barbeiro)` no app mobile, baseado no protótipo Claude Design `dTVtmzWT4ykmhzZusl4Mog` (Urban Flow v2). O design traz uma lista densa de agendamentos, bottom sheets de ações rápidas, e uma tela de detalhe de cliente full-screen.

---

## Arquivos Criados

| Arquivo                                                                       | Descrição                                                                         |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `apps/mobile/src/features/barbeiro/AgendaRow.tsx`                             | Linha densa da agenda: coluna de horário + dot de status + nome + serviço + preço |
| `apps/mobile/src/features/barbeiro/AppointmentDetailSheet.tsx`                | Bottom sheet com detalhe do agendamento e ações por status                        |
| `apps/mobile/src/features/barbeiro/ActionMenuSheet.tsx`                       | Sheet do FAB (+) com opções walk-in e bloqueio                                    |
| `apps/mobile/src/features/barbeiro/BloqueioSheet.tsx`                         | Sheet para bloquear horário com motivo, duração e recorrência                     |
| `apps/mobile/src/features/barbeiro/ClienteDetalhe.tsx`                        | Modal full-screen de detalhe do cliente                                           |
| `apps/mobile/src/shared/hooks/barbeiro/use-criar-bloqueio.ts`                 | `useMutation` para `POST /agenda/bloqueios/:barbeiroId`                           |
| `apps/mobile/src/features/barbeiro/__tests__/AgendaRow.test.tsx`              | Testes do componente AgendaRow                                                    |
| `apps/mobile/src/features/barbeiro/__tests__/AppointmentDetailSheet.test.tsx` | Testes de ações por status no detail sheet                                        |
| `apps/mobile/src/features/barbeiro/__tests__/ActionMenuSheet.test.tsx`        | Testes de callbacks walk-in e bloqueio                                            |
| `apps/mobile/src/features/barbeiro/__tests__/BloqueioSheet.test.tsx`          | Testes de seleção motivo, duração e toggle recorrente                             |
| `apps/mobile/src/features/barbeiro/__tests__/ClienteDetalhe.test.tsx`         | Testes de dados, notas editáveis e histórico                                      |
| `docs/46-redesign-mobile-barbeiro.md`                                         | Este documento                                                                    |

---

## Arquivos Modificados

| Arquivo                                                  | Mudança                                                                |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/mobile/app/(barbeiro)/agenda.tsx`                  | Reescrita completa: AgendaRow + StatsStrip + NowDivider + FAB + Sheets |
| `apps/mobile/app/(barbeiro)/clientes.tsx`                | Reescrita completa: filter chips + ClienteDetalhe + walk-in modal      |
| `apps/mobile/app/(barbeiro)/__tests__/agenda.test.tsx`   | Adicionados testes de FAB, detail sheet, stats strip e action menu     |
| `apps/mobile/app/(barbeiro)/__tests__/clientes.test.tsx` | Atualizados mocks + adicionados testes de filtros e walk-in            |

---

## Arquitetura

### Agenda do Dia

```
BarbeiroAgendaScreen
├── Day Nav (← Hoje, data, →)
├── StatsStrip (concluídos · pendentes · próximo HH:mm)
├── DataListWrapper
│   ├── NowDivider (inserido entre passado/futuro para hoje)
│   └── AgendaRow (tap → AppointmentDetailSheet)
├── FAB amber (→ ActionMenuSheet)
├── ActionMenuSheet
│   ├── → AdicionarWalkInModal
│   └── → BloqueioSheet
├── AppointmentDetailSheet (ações: aceitar/recusar/iniciar/concluir/no_show/reagendar)
└── AdicionarWalkInModal
```

### Clientes

```
BarbeiroClientesScreen
├── Header ("Clientes" + total count + botão +)
├── SearchInput (busca case-insensitive, ignora acentos)
├── Filter chips horizontais (Todos · Recentes · Sumidos · VIP · Novos)
├── Sort buttons (Nome · Última visita)
├── DataListWrapper → ClienteCard (tap → ClienteDetalhe)
├── ClienteDetalhe (Modal full-screen slide)
│   ├── Avatar + nome + telefone
│   ├── Quick actions (Agendar · Ligar · WhatsApp)
│   ├── Stats card (visitas · ticket · última visita)
│   ├── Serviço favorito
│   ├── Notas editáveis (estado local — API Phase 2)
│   └── Timeline histórico via useHistoricoCliente
└── AdicionarWalkInModal
```

---

## Hook `use-criar-bloqueio`

```ts
// Endpoint
POST /agenda/bloqueios/:barbeiroId
Header: x-tenant-id = barCodigo

// Payload calculado
{
  inicio: roundToNext15(new Date()).toISOString(), // próximo slot de 15min
  fim:    (inicio + duration * 60000).toISOString(),
  motivo?: string,
  recorrente?: boolean,
}

// onSuccess: invalida queryKey ["agendamentos"]
```

Utilitário exportado: `roundToNext15(now: Date): Date`

---

## Decisões de Design

| Decisão                                  | Razão                                                                |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `Modal fullScreen` para ClienteDetalhe   | Imita push navigation sem alterar estrutura de rotas Expo Router     |
| Filtros VIP/Novos desabilitados          | API v1 não retorna tags de cliente — Phase 2                         |
| Notas com estado local                   | Endpoint de notas não existe — Phase 2                               |
| Divider "AGORA" apenas para hoje         | `isSameDay(selectedDate, new Date())` — irrelevante para outros dias |
| Acento violet `#a78bfa` no BloqueioSheet | Diferencia visualmente do amber da agenda principal                  |

---

## TestIDs relevantes

| TestID                                    | Componente                                         |
| ----------------------------------------- | -------------------------------------------------- |
| `agenda-row-{codigo}`                     | AgendaRow                                          |
| `stats-strip`                             | StatsStrip                                         |
| `now-divider`                             | NowDivider                                         |
| `fab-adicionar`                           | FAB da agenda                                      |
| `action-menu-sheet`                       | ActionMenuSheet                                    |
| `menu-walkin`                             | Botão walk-in do ActionMenuSheet                   |
| `menu-bloqueio`                           | Botão bloqueio do ActionMenuSheet                  |
| `detail-sheet`                            | AppointmentDetailSheet                             |
| `action-{acao}`                           | Botões de ação do detail sheet                     |
| `bloqueio-sheet`                          | BloqueioSheet                                      |
| `motivo-{label}`                          | Chips de motivo do BloqueioSheet                   |
| `duracao-{n}`                             | Chips de duração do BloqueioSheet                  |
| `toggle-recorrente`                       | Switch de recorrência do BloqueioSheet             |
| `confirm-bloqueio`                        | Botão confirmar do BloqueioSheet                   |
| `cliente-detalhe-modal`                   | ClienteDetalhe                                     |
| `btn-voltar`                              | Botão back do ClienteDetalhe                       |
| `qa-agendar` / `qa-ligar` / `qa-whatsapp` | Quick actions do ClienteDetalhe                    |
| `btn-editar-nota`                         | Toggle nota do ClienteDetalhe                      |
| `input-nota`                              | TextInput de nota                                  |
| `historico-vazio` / `historico-lista`     | Estados do histórico                               |
| `clientes-busca`                          | SearchInput da tela de clientes                    |
| `filter-{id}`                             | Chips de filtro (todos/recentes/sumidos/vip/novos) |
| `sort-nome` / `sort-ultimaVisita`         | Botões de ordenação                                |
| `clientes-contagem`                       | Contagem filtrada/total                            |
| `btn-adicionar-walkin`                    | Botão + do header de clientes                      |

---

## Extensão — Design v4 + v5 (2026-05-21)

**Design bundles:** `h/AqsnKt00L9AeqO0334ZKGw` (v4) + `h/DX2Sut4VXrSqfPreHKex8Q` (v5)

### Novas Telas Implementadas

| Tela                    | Arquivo                                | Descrição                                                                |
| ----------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Barbeiro Perfil v2      | `app/(barbeiro)/perfil/index.tsx`      | Identity hero, stats mensais (`useBarbeiroStats`), grupos settings       |
| Barbeiro Jornada        | `app/(barbeiro)/perfil/jornada.tsx`    | Editor semanal (Phase 1 — estado local)                                  |
| Barbeiro Serviços       | `app/(barbeiro)/perfil/servicos.tsx`   | Toggle por serviço via `useServicos()`                                   |
| Cliente Agendamentos v2 | `app/(cliente)/agendamentos/index.tsx` | Abas Próximos/Histórico, DateTile, pills de status, chip AVALIAR         |
| Cliente Perfil v2       | `app/(cliente)/perfil/index.tsx`       | Implementação própria, barbeiros favoritos, barbearias salvas            |
| **Login v2**            | `app/(auth)/login.tsx`                 | Urban Flow v2: "Bom te ver de volta." headline, Sora_700Bold             |
| **Onboarding v2**       | `app/(auth)/onboarding.tsx`            | 3-slide swipe: Encontre / Agende / Sem esquecimentos                     |
| **Home / Quick Book**   | `app/(cliente)/home.tsx`               | Header + QuickBook card (7 estados) + stats grid                         |
| **Convite Magic Link**  | `app/convite/[token].tsx`              | Landing barbeiro: estados loading/landing/form/accepting/success/expired |

### Novos Hooks

| Hook               | Endpoint                      | Descrição                                |
| ------------------ | ----------------------------- | ---------------------------------------- |
| `useBarbeiroStats` | `GET /me/stats?periodo=mes`   | Stats mensais do barbeiro (graceful 404) |
| `useProximosSlots` | `GET /agenda/proximos?dias=7` | Slots para Quick Book (graceful 404)     |
| `useConvite`       | `GET /convite/:token`         | Dados do convite por token               |

### TestIDs novos

| TestID                        | Tela       | Descrição                 |
| ----------------------------- | ---------- | ------------------------- |
| `quick-book-card`             | Home       | Card Quick Book           |
| `quick-book-btn-ver-horarios` | Home       | Botão idle state          |
| `quick-book-empty`            | Home       | Estado sem slots          |
| `quick-book-confirmed`        | Home       | Estado sucesso            |
| `slot-{HH-mm}`                | Home       | Botão de slot individual  |
| `quick-book-btn-confirmar`    | Home       | Confirmar agendamento     |
| `next-apt-card`               | Home       | Card próximo agendamento  |
| `home-sem-barbearia`          | Home       | Empty state sem barbearia |
| `btn-pular`                   | Onboarding | Pular onboarding          |
| `btn-proximo`                 | Onboarding | Avançar slide             |
| `dot-{0,1,2}`                 | Onboarding | Indicadores de passo      |
| `convite-landing`             | Convite    | Landing do convite        |
| `convite-expirado`            | Convite    | Token expirado/inválido   |
| `convite-accepting`           | Convite    | Vinculando...             |
| `convite-success`             | Convite    | Sucesso                   |
| `btn-aceitar`                 | Convite    | Aceitar convite           |

### Cobertura de testes

Total: **84 suites · 482 tests** — todos passando
