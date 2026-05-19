# 41 — Redesign da tela de Login (web)

**Status:** Ativo | **Branch:** `feat/redesign-login-web` | **Base:** develop

## Contexto

Primeira tela da frente de redesign web a partir dos protótipos HTML em `Downloads/toqe`. O objetivo é trocar a "cara" do login para o estilo editorial/urbano (eyebrow + título grande com palavra dourada + painel direito com mini-card de agenda) **mantendo intacta toda a funcionalidade atual**: login email/senha, Google Sign-In, 2FA, forgot/reset password.

O protótipo tinha elementos com dados fake ou features sem backend. Decisões tomadas com o usuário:

- **Toggle "Sou dono/gerente" vs "Sou barbeiro"** → removido. O papel vem do BE pós-login.
- **Magic link via WhatsApp** → mantido como banner **decorativo desabilitado** (`aria-disabled="true"` + tooltip "Em breve"). Backend não suporta hoje.
- **Apple Sign-In** → mantido como botão **desabilitado** (`disabled` + tooltip "Em breve"). Backend não suporta hoje.
- **"Lembrar de mim"** → removido. Validações e limites atuais (`email` max 100, `senha` max 128, mín 6) mantidos.
- **Dados técnicos / institucionais removidos do painel direito**: pílula "248 barbearias online agora", rodapé técnico "v2.4 · sincronizado há 2s" e linha "USADO POR · URBAN · CORTE FINO · NAVALHA". Logo do Toqe também removida do painel direito por já aparecer na coluna esquerda (evita duplicação).
- **Merchandising mantido** (decisão final do usuário): depoimento atribuído a "Marcus Andrade · Dono · Barbearia Urban · Salvador, BA" e mini-card "Agenda — Quarta, 06 mai" com horários, clientes (João Silva, Pedro Santos, Rafael Lima, Bruno Alves) e barbeiros (Carlos, Felipe, Lucas). Conteúdo decorativo, fica no componente — não vem da API.

## Princípios aplicados (DRY · SOLID · Clean Code)

Reusos (nada criado do zero quando já existia):

| Reuso                                                                                      | Origem                                                                                                                  |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Hook `useLogin`                                                                            | [features/auth/hooks/use-login.ts](../apps/web/src/features/auth/hooks/use-login.ts) — intacto                          |
| Schema `loginSchema` (Zod)                                                                 | [packages/contracts/src/schemas/auth.ts](../packages/contracts/src/schemas/auth.ts) — intacto                           |
| `AuthErrorBanner`                                                                          | [features/auth/components/AuthErrorBanner.tsx](../apps/web/src/features/auth/components/AuthErrorBanner.tsx) — reusado  |
| Service `requestGoogleLogin` + `TwoFaRequiredError`                                        | [features/auth/services/auth.service.ts](../apps/web/src/features/auth/services/auth.service.ts) — fluxo Google intacto |
| Componente `Kbd` (shadcn)                                                                  | [shared/ui/kbd.tsx](../apps/web/src/shared/ui/kbd.tsx) — hint `↵` no CTA                                                |
| Componentes `Tooltip*` (shadcn)                                                            | [shared/ui/tooltip.tsx](../apps/web/src/shared/ui/tooltip.tsx) — tooltip "Em breve" nos botões disabled                 |
| Classe utilitária `tqe-label`                                                              | [app/globals.css](../apps/web/src/app/globals.css) — labels do form                                                     |
| Design tokens CSS (`--primary`, `--bg-card`, `--text-primary`, `--status-*`, `--border-*`) | Tokens existentes — zero cor hardcoded                                                                                  |

Novas utilitárias adicionadas a `globals.css` (única classe genérica que faltava no design system para o padrão "input com ícone affix"):

- `.tqe-input-affix` — wrapper flex com ícone à esquerda e estado `:focus-within` no padrão dourado.
- `.tqe-input-bare` — input sem borda/background usado dentro do affix.

## Arquivos modificados / criados

| Arquivo                                                                                                                       | Tipo | Mudança                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [apps/web/src/app/(auth)/login/page.tsx](<../apps/web/src/app/(auth)/login/page.tsx>)                                         | mod  | Inverte colunas (form à esquerda, branding à direita), adiciona eyebrow + título "De volta pra **cadeira**" com palavra dourada, sub-headline neutra. Mantém alternância login/forgot/twofa.                                                                                                                                                                                |
| [apps/web/src/features/auth/components/LoginForm.tsx](../apps/web/src/features/auth/components/LoginForm.tsx)                 | mod  | Reestilizado com ícones affix (lucide `AtSign`/`KeyRound`), CTA "Entrar no painel" com `Kbd` `↵`, banner magic-link disabled e botão Apple disabled. Lógica `useLogin` + `react-hook-form` + zodResolver + 2FA + Google **intacta**. `noValidate` adicionado ao `<form>` para que o zodResolver controle todas as validações (sem interferência da validação HTML5 nativa). |
| [apps/web/src/features/auth/components/AuthBrandingPanel.tsx](../apps/web/src/features/auth/components/AuthBrandingPanel.tsx) | mod  | Estética editorial (gradiente diagonal + glow âmbar + glow azul + grade sutil) com depoimento "Marcus Andrade · Barbearia Urban · Salvador, BA" e mini-card "Agenda — Quarta, 06 mai" com 4 linhas (horário, cliente, status colorido, barbeiro). Logo removida — só aparece na coluna esquerda.                                                                            |
| [apps/web/src/app/globals.css](../apps/web/src/app/globals.css)                                                               | mod  | Adiciona `.tqe-input-affix` e `.tqe-input-bare` no bloco de inputs.                                                                                                                                                                                                                                                                                                         |
| [apps/web/src/features/auth/components/LoginForm.spec.tsx](../apps/web/src/features/auth/components/LoginForm.spec.tsx)       | novo | Spec cobrindo: render, submit válido, validação inválida (e-mail, senha curta), `onTwoFaRequired` via `TwoFaRequiredError`, callbacks de forgot/cadastrar, botões Apple e magic-link disabled, estado pending, banner de erro genérico e supressão do banner quando erro é `TwoFaRequiredError`. 12 testes, 100% passando.                                                  |
| [docs/41-redesign-login-web.md](./41-redesign-login-web.md)                                                                   | novo | Esta doc.                                                                                                                                                                                                                                                                                                                                                                   |

## Diagrama (alto nível)

```
┌────────────────────────────────┬──────────────────────────────┐
│  PAINEL ESQUERDO (form)        │  PAINEL DIREITO (branding)   │
│                                │  hidden lg:flex              │
│  [logo Toqe]                   │                              │
│                                │  [logo Toqe]                 │
│  • Acessar painel              │                              │
│  De volta pra **cadeira**.     │  A operação da sua barbearia,│
│  Entre na sua conta...         │  **no ritmo certo**.         │
│                                │                              │
│  [ @  e-mail        ]          │  [ Agenda do dia · AO VIVO ] │
│  [ ⚿  senha    ◯ ]             │  09:00  Corte                │
│                                │  09:30  Corte + Barba · agora│
│  [ Entrar no painel  ↵ ]       │  10:00  Corte                │
│                                │  10:30  Barba                │
│  ⚡ Sem senha? Em breve         │                              │
│                                │                              │
│  ──── OU ────                  │                              │
│  [ Google ] [ Apple (em breve)]│                              │
│                                │                              │
│  Sua barbearia ainda não está  │                              │
│  aqui? Cadastrar agora →       │                              │
│                                │  © 2026 Toqe                 │
│  © 2026 Toqe   Priv|Termos|Sup │                              │
└────────────────────────────────┴──────────────────────────────┘
```

## Validação

Antes do commit (CLAUDE.md — três checks obrigatórios):

```bash
pnpm --filter web lint            # ✅ zero erros / zero warnings
cd apps/web && npx tsc --noEmit   # ✅ zero erros
pnpm --filter web test            # ✅ 135 passed (17 files)
```

Spec específico do redesign:

```bash
pnpm --filter web test -- LoginForm
# Test Files  1 passed (1)
# Tests       12 passed (12)
```

Verificação manual (próximos passos do usuário):

1. `pnpm --filter web dev` → abrir `/login` em desktop (≥1024px): conferir layout 2 colunas, eyebrow, título com palavra dourada, painel direito com mini-card.
2. Reduzir para mobile (<1024px): painel direito some, form ocupa tela toda.
3. Login com credenciais válidas → redirect normal.
4. Email inválido / senha curta → erros inline em vermelho.
5. "Esqueci minha senha" → muda para modo `forgot`.
6. Conta com 2FA → muda para modo `twofa` automaticamente após submit.
7. Botão Google (se `NEXT_PUBLIC_GOOGLE_CLIENT_ID` configurado) → fluxo Google funciona.
8. Hover no botão Apple e no bloco magic-link → tooltip "Em breve".

## Próximos passos (fora deste PR)

- **Magic link via WhatsApp**: requer endpoint `POST /auth/magic-link` no BE + tela de confirmação. Backlog.
- **Apple Sign-In**: requer integração `Sign In with Apple` + endpoint `POST /auth/apple` análogo ao Google. Backlog.
- **Onboarding, dashboard, agenda, etc.**: próximas telas do redesign seguindo os protótipos restantes em `Downloads/toqe`.
