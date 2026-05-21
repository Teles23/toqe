# 52 — Quick Book / Home v2 (pixel-accurate)

**Status:** Implementado  
**Branch:** `feat/mobile-sprint4-full-fidelity`  
**Base:** `feat/mobile-sprint3-perfil-tenant`

---

## Contexto

Reescrita pixel-accurate da home do cliente (`app/(cliente)/home.tsx`) para
refletir o protótipo `Toqe Quick Book Slots v2.html` — a tela que combina o
"próximo agendamento" (strip), o card de reserva em 1 toque (Quick Book com 7
estados) e os stats.

---

## Arquivos Modificados

| Arquivo                              | Modificação                                                                                                                                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/app/(cliente)/home.tsx` | Reescrita completa: header "Início" + barbearia (ícone home + chevron), strip do próximo agendamento, Quick Book card com borda-esquerda accent + 7 estados, slot picker, stats com icon boxes, FAB e empty mantidos |

---

## Mapeamento do design → implementação

| Elemento HTML                                                                             | Implementação RN                                                                               |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Header "Início" Sora 22px + building icon + nome                                          | `headerTitle` 22px + `tenantRow` (Feather `home` + nome + `chevron-down`, abre TenantSwitcher) |
| Bell button 44×44 round                                                                   | `bellBtn` Feather `bell` 20px                                                                  |
| NextAppointment **strip**: PRÓXIMO + linha + "em Nd" / dot + data·hora + barbeiro + seta  | `NextAppointmentStrip` (dados reais de `useProximoAgendamento`)                                |
| Quick Book card: bg #171717, border accent30, **borderLeft 3px accent**, radius 20        | `qbCard`                                                                                       |
| Header card: avatar 46×46 letra + "Repetir com X" + scissors/serviço + badge "⚡ 1 TOQUE" | `qbHeader`                                                                                     |
| Idle: "Ver horários disponíveis" + seta (bg accent14)                                     | `verHorariosBtn`                                                                               |
| Loaded: dot verde + "N slots · próximos 7 dias" + slots agrupados por dia                 | SlotPicker inline (Feather, mono)                                                              |
| Slot selecionado: bg accent1c, border 1.5px accent                                        | `slotBtnSel`                                                                                   |
| Confirmar: botão accent + seta                                                            | `confirmBtn`                                                                                   |
| Confirmed: card verde #0f1f15 + check 64×64 + "Agendado!" + "Reservar outro"              | `qbConfirmedCard`                                                                              |
| Empty: clock icon + "Sem horários" + "Outro barbeiro"/"Avisar vaga"                       | estado `empty`                                                                                 |
| Error: wifi-off + "Falha na conexão" + "Tentar de novo"                                   | estado `error`                                                                                 |
| Stats: icon box 32×32 colorido + valor Sora 22px + label uppercase                        | `StatsGrid` (calendar azul / credit-card amber)                                                |

---

## Decisões

- **Accent amber mantido** (`#F4B400`), não o verde do tweak default do protótipo
  — consistência com o tema do app (`palette.primary`).
- Ícones via `@expo/vector-icons` (Feather) no lugar de emoji.
- Slot ao ser tocado **seleciona** (destaque); a reserva é confirmada no botão
  "Confirmar reserva" (default-seleciona o primeiro slot ao abrir).

---

## Contrato preservado

- testIDs: `home-header`, `home-sem-barbearia`, `next-apt-card`,
  `quick-book-card`, `quick-book-empty`, `quick-book-error`,
  `quick-book-confirmed`, `quick-book-btn-ver-horarios`,
  `quick-book-btn-confirmar`, `slot-{hora}`, `stats-visitas`, `stats-ticket`,
  `btn-notificacoes`, `fab-buscar`
- Hooks: `useProximosSlots`, `useProximoAgendamento`, `useAgendamentosMeus`,
  `useAuth` (switchBarbearia via TenantSwitcherSheet)
- Fluxo idle → loaded → confirming → confirmed inalterado

---

## Resultados

- `pnpm --filter mobile lint`: 0 errors (1 warning pré-existente em test file)
- `npx tsc --noEmit`: 0 erros novos (1 erro pré-existente em `secure-storage.ts`)
- `pnpm --filter mobile test`: 90 suites · 518 tests · all passed
