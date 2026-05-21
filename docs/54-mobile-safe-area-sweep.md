# 54 — Safe-area + layout sweep (todas as telas mobile)

**Status:** Implementado
**Branch:** `feat/mobile-sprint4-full-fidelity`
**Base:** `feat/mobile-sprint3-perfil-tenant`

---

## Contexto

Reporte do usuário: a maioria das telas "colava no topo" (título sob a status
bar / notch), **Editar perfil** estava quebrada (Nome/Telefone cortando) e o
**Walk-in** aparecia incompleto (conteúdo/botão cortados). Auditoria confirmou
problema sistêmico: apenas 3 de 27 telas aplicavam safe-area real
(`useSafeAreaInsets`); as demais usavam `paddingTop` fixo (ou nada) com
`headerShown:false` nos layouts → conteúdo começava em `y=0`.

---

## Estratégia (DRY)

Núcleo reutilizável (`ScreenHeader`) + aplicação de `useSafeAreaInsets` por tela.

## Arquivos Modificados

| Arquivo                                                                                                         | Modificação                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/ui/ScreenHeader.tsx` (+ test)                                                                       | `useSafeAreaInsets()` real (era paddingTop fixo); novas props `onBack` (botão voltar 40×40, label "Voltar"), `subtitle`, `border`. Título 18px com back / 24px sem.                                     |
| `app/(barbeiro)/perfil/{editar,senha,2fa,notificacoes,jornada,servicos}.tsx`                                    | Header inline → `<ScreenHeader onBack=…/>` (DRY); CTAs sticky com `insets.bottom`. **editar**: `fieldInput`/`emailRow` `height:30` → `minHeight:40 + paddingVertical` (Nome/Telefone deixam de cortar). |
| `src/features/barbeiro/AdicionarWalkInModal.tsx`                                                                | `ScrollView` com `flexShrink:1` (footer/conteúdo não cortam mais); footer `paddingBottom: insets.bottom + 18`; guard "Nenhum serviço ativo".                                                            |
| `app/(cliente)/{home,agendamentos/index,perfil/index,buscar}.tsx`                                               | Header `paddingTop: insets.top + 10`.                                                                                                                                                                   |
| `app/(cliente)/{agendar/index,agendamentos/[codigo],barbearia/[slug],buscar/qr}.tsx`, `app/convite/[token].tsx` | Inset no topo (header/scroll/topBar absoluto conforme a tela).                                                                                                                                          |

Subtelas de perfil do **cliente** (editar/senha/2fa/notificacoes) são
re-exports das do barbeiro → corrigidas automaticamente.

---

## Detalhes

- **ScreenHeader** vira a fonte única do header das subtelas. Remoção dos top
  bars inline duplicados (back + título) em 6 telas.
- **Editar perfil**: além do safe-area, o clipping vinha do `height:30` fixo nos
  campos; agora `minHeight:40` + `paddingVertical:8`.
- **Walk-in**: dentro do sheet `maxHeight:92%`, o `ScrollView` sem flex deixava
  o footer "Atender agora" fora da área visível em telas menores; `flexShrink:1`
  resolve, e o footer respeita o home indicator.
- Telas com header bespoke (pills/busca/tenant/hero/qr) recebem o inset inline
  (não forçam ScreenHeader).

---

## Resultados

- `pnpm --filter mobile lint`: 0 errors (1 warning pré-existente em test file)
- `npx tsc --noEmit`: 0 erros novos (1 erro pré-existente em `secure-storage.ts`)
- `pnpm --filter mobile test`: 90 suites · 521 tests · all passed
