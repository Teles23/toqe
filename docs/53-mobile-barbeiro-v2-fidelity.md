# 53 — Barbeiro pixel-accurate (App Barbeiro v2)

**Status:** Implementado
**Branch:** `feat/mobile-sprint4-full-fidelity`
**Base:** `feat/mobile-sprint3-perfil-tenant`

---

## Contexto

Fechamento das divergências estruturais e de tela do app do barbeiro contra os
protótipos definitivos (`Toqe App Barbeiro.html`, `Toqe Barbeiro Agenda/Clientes/
Perfil v2.html`, `Toqe Fluxo Barbeiro.html` e os JSX `barbeiro-*.jsx`). Foco em
**reuso (DRY)** — sem duplicar estilos/lógica já existentes.

Decisões do usuário:

1. **Fila fiel ao protótipo (3 tabs)** — a fila vira seção vermelha no topo da
   Agenda; tab bar = Agenda / Clientes / Perfil (Perfil = shield).
2. **Walk-in recriado como chips** — sheet leve (nome + chips de serviço + chips
   de duração + "Atender agora").

---

## Arquivos Criados

| Arquivo                                                            | Descrição                                                                                                                           |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/barbeiro/FilaSection.tsx`                | Seção de fila (red dot pulsante + WalkInCard) reutilizável; reusa `FilaCard` + `useFilaDia` + `useUpdateStatus`. Some quando vazia. |
| `apps/mobile/src/features/barbeiro/__tests__/FilaSection.test.tsx` | Specs migrados da antiga `fila.test.tsx` (seção, walkin cards, botão Atender, vazio).                                               |

## Arquivos Modificados

| Arquivo                                                        | Modificação                                                                                                                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/mobile/src/shared/ui/BaseButton.tsx`                     | Props opcionais `icon`/`iconRight` (Feather) — DRY p/ todos os botões com ícone. Retrocompatível (herdado por Amber/Ghost/Danger).                                                         |
| `apps/mobile/app/(barbeiro)/_layout.tsx`                       | 4 → **3 tabs** (remove Fila); Perfil `user` → `shield`; Clientes `user-check` → `users`.                                                                                                   |
| `apps/mobile/app/(barbeiro)/agenda.tsx`                        | `<FilaSection/>` no topo (só hoje); 📅 emoji → Feather `calendar`.                                                                                                                         |
| `apps/mobile/src/features/barbeiro/AdicionarWalkInModal.tsx`   | Rewrite chip-based: nome (FormInput leftIcon) + chips de serviço (reais via `useServicos`) + chips de duração + info verde + "Atender agora". `barbeiroId = user.codigo`, email sintético. |
| `apps/mobile/src/features/barbeiro/AppointmentDetailSheet.tsx` | Ligar/Zap agora usam `Linking` (tel: / wa.me) com ícones; Aceitar/Iniciar/Concluir com ícones (check/play).                                                                                |
| `apps/mobile/app/(barbeiro)/perfil/servicos.tsx`               | ✂️ → Feather `scissors`; botão "+" no header; chips de preço (base/seu preço).                                                                                                             |
| `apps/mobile/app/(barbeiro)/perfil/jornada.tsx`                | Day pill 36×36 mono; chips de horário + **almoço** (violet, display-only).                                                                                                                 |
| `apps/mobile/app/(barbeiro)/perfil/index.tsx`                  | Ícones emoji → Feather; grupo **Notificações** (Push/WhatsApp) + linha **Telefone**.                                                                                                       |

## Arquivos Removidos

| Arquivo                                              | Motivo                                                    |
| ---------------------------------------------------- | --------------------------------------------------------- |
| `apps/mobile/app/(barbeiro)/fila.tsx`                | Rota da tab Fila removida — fila agora é seção da Agenda. |
| `apps/mobile/app/(barbeiro)/__tests__/fila.test.tsx` | Specs migrados para `FilaSection.test.tsx`.               |

## Tests Atualizados

| Arquivo                                                                     | Modificação                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/mobile/app/(barbeiro)/__tests__/agenda.test.tsx`                      | Stub de `FilaSection` (isola a Agenda).                                                     |
| `apps/mobile/src/features/barbeiro/__tests__/AdicionarWalkInModal.test.tsx` | Reescrito p/ chips (serviço ativo, submit com `barbeiroId`+`servicosIds`, email sintético). |

---

## Tradeoffs / limitações documentadas

- **Walk-in sem backend change**: o contrato `criarClienteRapidoSchema` exige
  `email`. O sheet de chips não coleta email, então o app gera um e-mail
  sintético (`walkin-<ts>@walk-in.local`) e usa `user.codigo` como `barbeiroId`.
  TODO futuro: tornar e-mail opcional no backend para walk-ins.
- **Serviços**: a API expõe apenas `precoBase`; "Preço base" e "Seu preço"
  mostram o mesmo valor (sem inventar preço do barbeiro). Badge de delta só
  apareceria se houvesse dois preços distintos.
- **Jornada**: almoço é exibido (display-only), consistente com os horários já
  read-only; persistência de almoço fica para fase futura.
- **Notificações (perfil)**: linhas Push/WhatsApp são informativas (sem navegação).

---

## Resultados

- `pnpm --filter mobile lint`: 0 errors (1 warning pré-existente em test file)
- `npx tsc --noEmit`: 0 erros novos (1 erro pré-existente em `secure-storage.ts`)
- `pnpm --filter mobile test`: 90 suites · 518 tests · all passed
