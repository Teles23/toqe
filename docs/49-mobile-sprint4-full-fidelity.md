# 49 — Sprint 4 · Full HTML Fidelity (pixel-accurate)

**Status:** Implementado  
**Branch:** `feat/mobile-sprint4-full-fidelity`  
**Base:** `feat/mobile-sprint3-perfil-tenant`

---

## Contexto

Auditoria completa dos 13 arquivos HTML do design handoff (`Toqe App Cliente.html`, `Toqe App Barbeiro.html`, `Toqe Fluxo Cliente.html`, `Toqe Fluxo Barbeiro.html` e demais) revelou gaps visuais significativos em relação ao protótipo Urban Flow v2. Esta sprint fecha todos os gaps identificados.

---

## Arquivos Modificados

| Arquivo                                                      | Modificação                                                                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/app/(cliente)/agendar/index.tsx`                | Progress dots; StepServico icon box; StepBarbeiro rating+FOLGA; StepData grid 2-col; StepHorario Manhã/Tarde; ConfirmacaoReserva botão calendário |
| `apps/mobile/src/features/cliente/AvaliacaoSheet.tsx`        | Star scale animation Animated.spring; dynamic comment placeholder; "Há X minutos" subtitle; star opacity 0.35 para unfilled                       |
| `apps/mobile/src/features/barbeiro/ClienteDetalhe.tsx`       | Tags VIP/NOVO; next appointment card com borderLeft amber; repeat button ↺ em history rows; QuickAction icon boxes coloridos                      |
| `apps/mobile/app/(cliente)/home.tsx`                         | FAB buscar `position absolute bottom:80 right:18` (only when barbearia ativa)                                                                     |
| `apps/mobile/src/features/barbeiro/AdicionarWalkInModal.tsx` | Redesign visual: drag handle, header "Novo Walk-in", info box verde, botão "Atender agora →", bg `#0d0d0d`                                        |
| `apps/mobile/app/convite/[token].tsx`                        | Landing com logo barbearia + botão "Rejeitar convite"; Success screen com ✓ verde + CTA; Expired screen com ✖ vermelho; Already member com CTA    |

---

## Tests Atualizados

| Arquivo                                                                     | Modificação                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/mobile/src/features/barbeiro/__tests__/AdicionarWalkInModal.test.tsx` | Rótulo do botão atualizado: "Adicionar à fila" → "Atender agora →" |

---

## Detalhes por Arquivo

### agendar/index.tsx

**Progress dots:** 4 círculos 8×8 `borderRadius: 4`. Ativos/passados: `#F4B400`. Futuros: `#262626`.

**StepServico — icon box:**

```
40×40 borderRadius:10 backgroundColor:'#F4B40014'
└─ ✂ fontSize:18
```

**StepBarbeiro — rating + FOLGA:**

- Interface estendida: `nota?: number | null`, `disponivel?: boolean`
- ⭐ + valor mono 11px `#aaaaaa`
- Badge FOLGA: `bg #ef44441a, color #ef4444, fontSize 9`

**StepData — grid 2-col:**

- `useWindowDimensions` para `cardWidth = (screenWidth - 48) / 2`
- Cada card: 72px height, borderRadius 14, centered
- Conteúdo: dayName (9px uppercase) + day (Sora_700Bold 20px) + month (11px)
- Selecionado: bg+border `#F4B400`, texto `#0d0d0d`

**StepHorario — Manhã/Tarde:**

- Manhã: slots com `hora < "12:00"`
- Tarde: slots com `hora >= "12:00"`
- Label seção: Inter_600SemiBold 10px uppercase `#666666`

**ConfirmacaoReserva:** Botão ghost "Adicionar ao calendário" abaixo do CTA principal.

---

### AvaliacaoSheet.tsx

- `Animated.Value(1.0)` × 5 para scale animation (spring 1.15 selected, 1.0 unselected)
- Placeholder dinâmico: `nota >= 4` → "O que foi incrível? Nos conta!" / `nota < 4` → "O que podemos melhorar?"
- Prop opcional `minutosAtras?: number` → "Há X minutos" em caption `#666666`
- Stars: `opacity: i <= nota ? 1 : 0.35` (sem border color)

---

### ClienteDetalhe.tsx

**Tags:**

- NOVO: `totalVisitas === 0` → badge `#a78bfa1a / #a78bfa`
- VIP: `totalVisitas >= 10` → badge `#F4B40014 / #F4B400`
- testID: `cliente-tags`

**Next appointment card:**

- Prop opcional `proximoAgendamento?: { data, horario, servico } | null`
- borderLeft 3px `#F4B400`, bg `#171717`
- testID: `next-apt-card`

**Repeat button em HistoryRow:**

- 32×32 borderRadius 8 bg `#F4B40014` + ↺ 14px `#F4B400`
- testID: `repeat-{codigo}`

**QuickAction icon boxes:**

- Cada ação: iconBox 36×36 borderRadius 9 com bg colorido
- Agendar: `#F4B40014` | Ligar: `#3b82f61a` | WhatsApp: `#22c55e1a`

---

### home.tsx — FAB

```
position: 'absolute'
bottom: 80, right: 18
width: 52, height: 52, borderRadius: 26
backgroundColor: '#F4B400'
shadowColor: '#F4B40066'
```

testID: `fab-buscar`. Visível apenas quando `!semBarbearias`.

---

### AdicionarWalkInModal.tsx

- Header: drag handle 36×4 `#333333` + título "Novo Walk-in" Sora_700Bold 16px + subtítulo 12px `#888888`
- Info box verde: `rgba(34,197,94,0.06)` border `rgba(34,197,94,0.15)` texto 11px `#22c55e`
- CTA: "Atender agora →"
- Sheet bg: `#0d0d0d`, `borderTopLeftRadius: 24, borderTopRightRadius: 24`

---

### convite/[token].tsx

**Landing:**

- Logo barbearia: 60×60 amber bg + letra inicial Sora_700Bold 24px
- "Você foi convidado para" + nome em Sora_700Bold 22px
- Botão "Rejeitar convite" ghost → `router.back()`; testID: `btn-rejeitar`

**Success:**

- ✓ 32px em View 80×80 `#22c55e20`
- Título "Vinculação concluída!" Sora_700Bold 22px
- CTA "Ir para o app" → `router.replace('/')`

**Expired:**

- ✖ 32px em View 80×80 `#ef44441a`
- Título "Link inválido" Sora_700Bold 22px

**Already member:**

- Mesmo layout do success + CTA "Ir para o app"

---

## Resultados

- `pnpm --filter mobile lint`: 0 errors (1 warning pré-existente em test file)
- `npx tsc --noEmit`: 0 erros novos (1 erro pré-existente em `secure-storage.ts`)
- `pnpm --filter mobile test`: 90 suites · 518 tests · all passed
