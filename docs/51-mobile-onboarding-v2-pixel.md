# 51 — Onboarding v2 (pixel-accurate)

**Status:** Implementado  
**Branch:** `feat/mobile-sprint4-full-fidelity`  
**Base:** `feat/mobile-sprint3-perfil-tenant`

---

## Contexto

Ajuste pixel-accurate da tela de onboarding (`app/(auth)/onboarding.tsx`) para
refletir fielmente o protótipo `Toqe Onboarding v2.html` — variante **Swipe (3
telas de valor)**, que é o default do protótipo.

---

## Arquivos Modificados

| Arquivo                                 | Modificação                                                                                                                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/app/(auth)/onboarding.tsx` | Ícone Feather (search/clock/bell) em container quadrado arredondado (borderRadius 20); conteúdo alinhado à esquerda; título 36px com ponto final; "Pular" com seta; dots inativos `#333` |

---

## Mapeamento do design → implementação

| Elemento HTML (`Toqe Onboarding v2.html` · Swipe) | Antes                                       | Depois                                                                            |
| ------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| Ícone hero                                        | emoji 🔍 ⏱ 🔔 em círculo (borderRadius 999) | Feather `search`/`clock`/`bell` (size 36) em quadrado arredondado borderRadius 20 |
| Alinhamento do conteúdo                           | centralizado                                | à esquerda (`alignItems: flex-start`)                                             |
| Título                                            | Sora 34px, sem ponto, centralizado          | Sora 36px letterSpacing -1, com ponto final, à esquerda                           |
| Palavra de destaque                               | accent (mantido)                            | accent + `.` (ex: "Encontre **sua barbearia**.")                                  |
| Botão "Pular"                                     | só texto                                    | texto + ícone `arrow-right` (Feather 14px)                                        |
| Dots inativos                                     | `palette.border` (#262626)                  | `#333333` (igual ao design)                                                       |
| Dots ativos                                       | width 22 accent                             | mantido                                                                           |

---

## Contrato preservado

- testIDs: `slide-{0..2}`, `dot-{0..2}`, `btn-pular`, `btn-proximo`
- `getByText("Encontre")` / `"Agende"` / `"Sem"` — palavra do título em `Text`
  próprio (normalização de espaço do RNTL mantém o match)
- Navegação: `Pular` e `Começar`/último slide → `router.replace("/(auth)/login")`
- Fluxo de 3 slides com avanço por "Próximo"

---

## Resultados

- `pnpm --filter mobile lint`: 0 errors (1 warning pré-existente em test file)
- `npx tsc --noEmit`: 0 erros novos (1 erro pré-existente em `secure-storage.ts`)
- `pnpm --filter mobile test -- onboarding`: 7 tests · all passed
