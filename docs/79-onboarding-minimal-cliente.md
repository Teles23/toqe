# 79 — Onboarding minimal do cliente (Fluxo Cliente, slide 02)

**Status:** Implementado
**Branch:** `develop`
**Base:** `381e536` (redesign editorial da jornada de aceite de convite — chunk 2/3)

---

## Contexto

O fluxo completo do cliente (`Toqe Fluxo Cliente.html`) e os transcripts de
design do Claude Design fixaram a tela de abertura do app no **onboarding
minimal** — 1 tela, 1 promessa, 1 ação. A decisão de produto registrada nos
chats foi rejeitar o onboarding swipe de 3 telas ("abandono > valor") em favor
da filosofia "1 toque, sem fricção".

A implementação anterior de `app/(auth)/onboarding.tsx` ainda era a variante
swipe de 3 slides (Encontre / Agende / Sem esquecimentos, com dots e botão
"Próximo"). Este chunk a substitui pelo `MinimalOnboardingPhone` do protótipo.

A mensagem é específica do cliente final — quem chega aqui organicamente é o
cliente; o barbeiro entra pelo convite (magic link) e não passa por este fluxo.
A tela de boas-vindas pós-convite (`resolvedView === "welcome"` em
`app/convite/[token].tsx`) é separada e **não foi alterada**.

---

## Arquivos Modificados

| Arquivo                                                | Modificação                                                                                                                                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/app/(auth)/onboarding.tsx`                | Reescrita: variante swipe de 3 slides → onboarding minimal 1 tela (marca âmbar + título display + value prop + CTA "Começar" + link "Já tenho conta"). Todos os tokens via `useTheme()` |
| `apps/mobile/app/(auth)/__tests__/onboarding.test.tsx` | Specs realinhadas ao novo comportamento: renderização minimal, value prop, os 2 CTAs e ambos navegando para `/(auth)/login`                                                             |

## Arquivos verificados (sem alteração necessária)

| Arquivo                                      | Conclusão                                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/mobile/app/(cliente)/_layout.tsx`      | Já usa `buildTabBarOptions(theme)` compartilhado com `(barbeiro)/_layout.tsx` — DRY, mesma cor de aba inativa                                    |
| `apps/mobile/src/shared/theme/tokens.ts`     | `tabInactive: "#888888"` (dark) já corrigido em `fc572dd` — contraste ≈5.3:1 sobre `#0a0a0a`, passa WCAG AA; mais claro que o `bg`. Nada a fazer |
| `apps/mobile/app/(cliente)/home.tsx`         | Quick Book + strip + stats + empty "sem barbearia" + FAB + TenantSwitcher já fiéis ao protótipo (commit `82ca118`)                               |
| `apps/mobile/app/(cliente)/perfil/index.tsx` | Identidade + 2 stats + favoritos + barbearias salvas + settings + logout já fiéis, todo em `useTheme()`                                          |

---

## Mapeamento do design → implementação

| Elemento do protótipo (`MinimalOnboardingPhone`)                                         | Implementação RN (`useTheme()`)                                                                |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ToqeBrand size={56}` — quadrado arredondado gradiente âmbar com "T"                     | `brandMark` 56×56 `palette.primary` + `radius.md` + letra "T" `palette.primaryOn`              |
| Título display "Sua barbearia,\nem **1 toque**." (Sora 800, accent)                      | `title` `Sora_700Bold` 40/42, "1 toque" em `palette.primary`                                   |
| Value prop "Encontre, agende e seja lembrado. Sem ligar, sem WhatsApp, sem complicação." | `subtitle` `typography.body` + `palette.textMuted`                                             |
| `ToqeButton variant="primary" iconRight="arrow_right"` "Começar"                         | `AmberButton label="Começar" iconRight="arrow-right"` → `router.replace(login)`                |
| Link secundário "Já tenho conta · entrar"                                                | `Text` acessível (`accessibilityRole="button"`) `typography.label` `palette.textMuted` → login |
| Fundo `TOQE_COLORS.bg` (#0d0d0d)                                                         | `palette.bg`                                                                                   |

### Tokens design → tema

`#F4B400 → palette.primary` · `on #0d0d0d → palette.primaryOn` · `bg → palette.bg` ·
`fg → palette.text` · `fg3 → palette.textMuted` · espaçamento `spacing.*` ·
raio `radius.md` · Sora/Inter via `typography.*`. Safe areas via
`useSafeAreaInsets()`.

---

## testIDs

| testID               | Elemento                         |
| -------------------- | -------------------------------- |
| `onboarding-minimal` | container raiz da tela           |
| `btn-comecar`        | CTA primário "Começar"           |
| `btn-ja-tenho-conta` | link secundário "Já tenho conta" |

Os testIDs antigos (`btn-pular`, `btn-proximo`, `slide-N`, `dot-N`) deixaram de
existir — não eram referenciados por nenhum fluxo Maestro nem por `app/index.tsx`
(o redirect por perfil mora em `index.tsx`/`SplashTenantPicker`).

---

## Checks

| Comando                           | Resultado                        |
| --------------------------------- | -------------------------------- |
| `pnpm --filter mobile lint`       | OK (sem erros)                   |
| `pnpm --filter mobile type-check` | OK (sem erros)                   |
| `pnpm --filter mobile test`       | 102 suítes / 602 testes passando |
