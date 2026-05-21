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

### Cobertura de testes — Design v4+v5

Total: **84 suites · 482 tests** — todos passando

---

## Extensão — Design v6 (fluxo completo cliente, 2026-05-21)

**Design bundle:** `h/pcdJqXIMwxAnS5h2u5Ls5g` — protótipos `Toqe App Cliente.html` + `Toqe App Barbeiro.html`

Objetivo: fluxo completo de ponta a ponta para o cliente — descoberta → detalhe → agendamento → avaliação.

### Novas Telas

| Tela                    | Arquivo                                   | Descrição                                                       |
| ----------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| **Buscar v2**           | `app/(cliente)/buscar.tsx`                | "Descobrir" header, search, FlatList com navegação para detalhe |
| **Barbearia Pública**   | `app/(cliente)/barbearia/[slug].tsx`      | Landing pública: avatar, rating, barbeiros, botão "Reservar"    |
| **Agendar (4 passos)**  | `app/(cliente)/agendar/index.tsx`         | Serviço → Barbeiro → Data → Horário → Confirmação               |
| **Avaliar agendamento** | `src/features/cliente/AvaliacaoSheet.tsx` | Bottom sheet 5 estrelas + comentário opcional                   |

### Modificações

| Arquivo                                                  | Mudança                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `app/(cliente)/agendamentos/[codigo].tsx`                | Botão "Avaliar" quando status=concluido + integração AvaliacaoSheet |
| `app/(cliente)/agendamentos/__tests__/[codigo].test.tsx` | Mocks adicionados para useAuth + useAvaliarAgendamento              |

### Novos Hooks

| Hook                    | Endpoint                               | Descrição                                 |
| ----------------------- | -------------------------------------- | ----------------------------------------- |
| `useBarbeariaPublica`   | `GET /publico/:slug`                   | Detalhe público de uma barbearia por slug |
| `useAvaliarAgendamento` | `POST /agendamentos/:codigo/avaliacao` | Mutation para submeter avaliação          |

### Endpoints usados no fluxo de agendamento

| Endpoint                           | Uso                         |
| ---------------------------------- | --------------------------- |
| `GET /publico/:slug/servicos`      | Lista de serviços (step 0)  |
| `GET /publico/:slug/barbeiros`     | Lista de barbeiros (step 1) |
| `GET /publico/:slug/slots?...`     | Slots disponíveis (step 3)  |
| `POST /publico/:slug/agendamentos` | Confirmar reserva           |

### TestIDs novos (v6)

| TestID                      | Tela                | Descrição                         |
| --------------------------- | ------------------- | --------------------------------- |
| `buscar-input`              | Buscar              | Campo de busca                    |
| `lista-barbearias-publicas` | Buscar              | FlatList de barbearias            |
| `buscar-empty`              | Buscar              | Estado vazio                      |
| `barbearia-detalhe`         | Barbearia detalhe   | Container principal               |
| `barbearia-nao-encontrada`  | Barbearia detalhe   | Estado 404                        |
| `btn-voltar-barbearia`      | Barbearia detalhe   | Botão voltar                      |
| `btn-reservar`              | Barbearia detalhe   | Botão "Reservar"                  |
| `progress-bar`              | Agendar             | Barra de progresso 4 segmentos    |
| `step-servico`              | Agendar             | Step 0 — seleção de serviço       |
| `step-barbeiro`             | Agendar             | Step 1 — seleção de barbeiro      |
| `step-data`                 | Agendar             | Step 2 — seleção de data          |
| `step-horario`              | Agendar             | Step 3 — seleção de horário       |
| `agendar-btn-voltar`        | Agendar             | Voltar / step anterior            |
| `agendar-btn-continuar`     | Agendar             | CTA "Continuar" / "Confirmar"     |
| `agendar-confirmado`        | Agendar             | Estado de sucesso                 |
| `avaliacao-sheet`           | Avaliação           | BottomSheet de avaliação          |
| `star-{1..5}`               | Avaliação           | Botões de estrela                 |
| `input-comentario`          | Avaliação           | Campo de comentário (após rating) |
| `btn-enviar-avaliacao`      | Avaliação           | Botão enviar                      |
| `botao-avaliar`             | Agendamento detalhe | Abre AvaliacaoSheet               |

### Cobertura de testes — Design v6

Total: **88 suites · 512 tests** — todos passando

---

## Extensão — Pixel-Accurate Rewrite v7 (2026-05-21)

**Design bundle:** `h/pcdJqXIMwxAnS5h2u5Ls5g` — arquivos: `cliente-screens.jsx`, `flow-shared-1.jsx`, `barbeiro-agenda.jsx`, `barbeiro-clientes.jsx`, `barbeiro-perfil.jsx`, `barbeiro-sheets.jsx`, `toqe-ds.jsx`

**Motivação:** O app rodando com Expo dev-client estava visualmente idêntico ao design anterior. Causa: implementações anteriores usavam abstrações genéricas (`Avatar`, `Card`, `ScreenHeader`, `AmberButton`) que não reproduzem o CSS inline do protótipo. Rewrite pixel-accurate traduzindo todos os estilos para `StyleSheet.create()`.

### Arquivos reescritos

| Arquivo                                            | Operação | Mudanças principais                                                                                                                               |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(cliente)/buscar.tsx`                         | REWRITE  | Logo square 54×54 amber (não círculo Avatar), header "Descobrir", search pill 46px borderRadius 23, chips feature/rating                          |
| `app/(cliente)/barbearia/[slug].tsx`               | REWRITE  | Hero 200px backgroundColor amber, body overlap `marginTop: -60`, logo 80×80 borderRadius 20 borda 3px, CTA fixo `position: 'absolute' bottom: 18` |
| `app/(cliente)/agendamentos/index.tsx`             | FIX      | DateTile: futuro `#F4B40014` bg / `#F4B40038` border, passado `#1c1c1c` / `#262626`; row borderBottom sem card bg; badge AVALIAR amber tint       |
| `app/(cliente)/agendamentos/[codigo].tsx`          | FIX      | Hero Sora_700Bold 32px data (branca) + hora (amber); service card `#1c1c1c` + grid 3-col; actions sticky por status                               |
| `app/(cliente)/perfil/index.tsx`                   | FIX      | StatCard icon 30×30 + Sora 24px valor; SettingsGroup container `#171717` overflow hidden; separadores internos borderBottom                       |
| `app/(barbeiro)/agenda.tsx`                        | FIX      | Header: dia Sora 700 24px + data 12px `#888888`; nav buttons 40×40 `#1c1c1c`; FAB `bottom: 80` shadow `#F4B40066`                                 |
| `app/(barbeiro)/clientes.tsx`                      | FIX      | SearchInput pill height 44 borderRadius 22; chips filtro: ativo `#F4B4001c` / inativo `#1c1c1c`; sort buttons amber active                        |
| `app/(barbeiro)/perfil/index.tsx`                  | FIX      | PerfilStat grid 3-col (amber/green/blue) Sora 700 22px; SettingsRow IconBox 36×36 borderRadius 10; SettingsGroup `#171717` overflow hidden        |
| `src/features/barbeiro/AppointmentDetailSheet.tsx` | FIX      | Service card `#1c1c1c` + ✂ iconBox 36×36; history card `#171717` violet; CONFIRMADO: Iniciar + Ligar + Zap                                        |
| `src/features/barbeiro/ClienteCard.tsx`            | FIX      | Row transparente borderBottom `#262626`, sem card bg; badge NOVO `#a78bfa1a`                                                                      |
| `src/features/barbeiro/AgendaRow.tsx`              | FIX      | timeCol 52px → 48px (spec design)                                                                                                                 |

### Token mapping aplicado

| TOQE_COLORS       | Hex       | Aplicação              |
| ----------------- | --------- | ---------------------- |
| `bg`              | `#0d0d0d` | `palette.bg`           |
| `card` / `bgElev` | `#171717` | inline `'#171717'`     |
| `border`          | `#262626` | inline `'#262626'`     |
| `fg`              | `#f5f5f5` | `palette.text`         |
| `fg2`             | `#aaaaaa` | inline `'#aaaaaa'`     |
| `fg3`             | `#888888` | `palette.textMuted`    |
| `fg4`             | `#666666` | inline `'#666666'`     |
| `fg5`             | `#444444` | `palette.textDisabled` |
| `accent`          | `#F4B400` | `palette.primary`      |

### Cobertura de testes — v7

Total: **90 suites · 518 tests** — todos passando

---

## Extensão — Sprint 3: Fluxo Multi-Tenant + Perfil/Settings (2026-05-21)

**Branch:** `feat/mobile-sprint3-perfil-tenant`  
**Design source:** `C:\...\Design system-handoff\design-system\project` — `flow-perfil.jsx`, `flow-shared-1.jsx`, HTMLs de fluxo  
**Doc completo:** `docs/48-mobile-sprint3-multi-tenant-qr.md`

### Telas implementadas

| Tela/Componente          | Arquivo                                                             | Descrição                                                                                   |
| ------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Editar perfil            | `(barbeiro)/perfil/editar.tsx` ← re-exportado por `(cliente)`       | Avatar 80×80 amber + botão edit 28×28, campos `#171717`, badge VERIFICADO verde, CTA sticky |
| Trocar senha             | `(barbeiro)/perfil/senha.tsx` ← re-exportado por `(cliente)`        | Info box amber, 4 requisitos inline com ✓ verde/cinza, CTA disabled                         |
| 2FA setup                | `(barbeiro)/perfil/2fa.tsx` ← re-exportado por `(cliente)`          | 3 passos: intro hero 🛡 + benefits, QR 160×160, 6 inputs 42×54 mono                         |
| Notificações             | `(barbeiro)/perfil/notificacoes.tsx` ← re-exportado por `(cliente)` | Matriz 3 canais × 4 tipos, switches amber, auto-save                                        |
| SplashTenantPicker       | `app/index.tsx`                                                     | Cards amber 54×54 para multi-tenant, botão dashed "+ Entrar em outra"                       |
| TenantSwitcherSheet      | `src/shared/ui/TenantSwitcherSheet.tsx`                             | Bottom sheet com checkmark e bg amber na ativa                                              |
| HeaderComTenant pill     | `home.tsx` + `agendamentos/index.tsx`                               | Pill 22×22 interativo, abre TenantSwitcherSheet                                             |
| EmptyClienteSemBarbearia | `home.tsx`                                                          | ✂ 72px hero, 2 CTAs: buscar + QR, footer hint                                               |
| QR Scan                  | `(cliente)/buscar/qr.tsx`                                           | Frame 4 cantos amber 260×260, hint JetBrainsMono                                            |
| Login sent state         | `(auth)/login.tsx`                                                  | ✉ 80×80 amber, pulse dot animado, "Reenviar link"                                           |
| Fila barbeiro            | `(barbeiro)/fila.tsx`                                               | Seção `#ef44441a` com dot pulsante vermelho, WalkInCard, pull-to-refresh                    |
| ConfirmacaoReserva       | `(cliente)/agendar/index.tsx`                                       | Círculo `#22c55e20` + ✓ 32px, ticket card `#171717` amber data                              |

### Cobertura de testes — Sprint 3

Total: **90 suites · 518 tests** — todos passando
