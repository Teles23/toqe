# 50 — Login v2 (pixel-accurate)

**Status:** Implementado  
**Branch:** `feat/mobile-sprint4-full-fidelity`  
**Base:** `feat/mobile-sprint3-perfil-tenant`

---

## Contexto

Reescrita pixel-accurate da tela de login (`app/(auth)/login.tsx`) para refletir
fielmente o protótipo `Toqe Login v2.html` (variante `email_password`, que é o
método ligado ao backend). Implementação anterior usava brand centralizado e não
tinha brand mark, headline grande nem link "Esqueci a senha".

---

## Arquivos Modificados

| Arquivo                                   | Modificação                                                                                                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/app/(auth)/login.tsx`        | Header esquerda com brand mark âmbar "T" + headline "Bom te ver de volta." (Sora 28px) + subtítulo; ícones mail/lock nos campos; link "Esqueci a senha"; footer "Novo por aqui? Crie sua conta" |
| `apps/mobile/src/shared/ui/FormInput.tsx` | Prop opcional `leftIcon` (Feather) — ícone à esquerda com padding ajustado; retrocompatível                                                                                                     |

---

## Mapeamento do design → implementação

| Elemento HTML (`Toqe Login v2.html`)                                 | Implementação RN                                                                  |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `ToqeBrand size={44}` (quadrado gradient + "T")                      | `brandMark` 44×44 borderRadius 10 bg `#F4B400` + "T" Sora 20px `#0d0d0d` + shadow |
| Header `alignItems: flex-start, gap: 18`                             | `headerBlock` left-aligned, gap 18                                                |
| Título `Bom te ver de\nvolta.` Sora 28px w800 letterSpacing -0.035em | `headline` Sora_700Bold 28px lineHeight 30 letterSpacing -1, duas linhas          |
| Subtítulo `Entre com seu e-mail e senha do Toqe.` 13px `#888888`     | `subtitle` Inter 13px `#888888` marginTop 6                                       |
| `ToqeInput icon="mail"`                                              | `<FormInput leftIcon="mail" />`                                                   |
| Input senha `••••••`                                                 | `<FormInput leftIcon="lock" placeholder="••••••" />`                              |
| "Esqueci a senha" (right, accent, 12px 600)                          | `forgotWrap`/`forgotText` alignSelf flex-end, `#F4B400` 12px                      |
| Botão "Entrar"                                                       | `AmberButton label="Entrar"` (preservado)                                         |
| Divider "ou" + social                                                | divider "ou" + `GhostButton "Entrar com Google"` (preservado)                     |
| "Novo por aqui? Crie sua conta"                                      | footer com `Link` para `/(auth)/cadastro`                                         |

---

## Contrato preservado

- `getByLabelText("E-mail")` / `getByLabelText("Senha")` — labels mantidos
- `getByRole("button", { name: "Entrar" })` e `"Entrar com Google"` — mantidos
- Toda a lógica de `login()`, `loginWithGoogle()`, tratamento de erros 401/5xx/rede
- Estado `emailSent` (link enviado) com pulse dot — mantido
- testID novo: `btn-esqueci-senha`

---

## Resultados

- `pnpm --filter mobile lint`: 0 errors (1 warning pré-existente em test file)
- `npx tsc --noEmit`: 0 erros novos (1 erro pré-existente em `secure-storage.ts`)
- `pnpm --filter mobile test`: 90 suites · 518 tests · all passed
