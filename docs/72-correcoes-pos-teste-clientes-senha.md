# 72 — Correções pós-teste: aba Clientes + troca de senha

**Status:** Em andamento (validação no device pendente — só o usuário)
**Branch:** develop
**Base:** doc 71 (correções perfil + preços)

## Contexto

Rodada de correções pós-teste no app do barbeiro focada na **aba Clientes** e na
**tela de troca de senha**. Um commit por item, sem push. Bugs de segurança/UX
primeiro, refinamentos de UX depois.

O bug mais grave era de **segurança**: trocar a senha digitando a senha atual
errada **deslogava** o usuário. Causa raiz dupla:

1. O backend retornava **401** para "senha atual incorreta". No mobile, qualquer
   401 dispara o interceptor de refresh → ao "ter sucesso" no refresh e repetir
   o `change-password`, recebia 401 de novo → o interceptor limpava os tokens e
   redirecionava para o login.
2. Mesmo no **sucesso**, o backend revogava **todos** os refresh tokens (inclusive
   o da sessão atual) → o próximo refresh do device falhava → logout.

## Itens

| Item            | Mudança                                                                                                                                                                                        | Commit    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Bug 1 + 2 (API) | `changePassword`: senha atual incorreta → **`BadRequestException` (400)**, não 401. Revoga apenas as **outras** sessões — identifica a atual pelo `refreshToken` enviado e a preserva. + specs | `546f0d0` |
| Bug 1 (mobile)  | `useMudarSenha` anexa o `refreshToken` da sessão atual e passa `skipRefresh: true`; `senha.tsx` trata `400` como erro de campo e mostra toast de sucesso (sem Alert, sem logout). + specs      | —         |

## Detalhes técnicos

### Bug 1 + Bug 2 — API (`apps/api/src/auth/`)

- **`auth.service.ts` `changePassword`:**
  - Senha atual incorreta → `throw new BadRequestException('Senha atual incorreta')`
    (antes `UnauthorizedException`). Erro de validação do input, não de auth.
  - Novo parâmetro opcional `refreshTokenAtual?: string`. Quando informado, busca
    os refresh tokens ativos do usuário, encontra o que casa (`bcrypt.compare`) e
    monta o `updateMany` com `codigo: { not: manterCodigo }` — revoga só os
    **outros** dispositivos, mantendo a sessão atual. Sem token → revoga todos
    (fallback compatível com a web).
- **`auth.controller.ts`:** passa `dto.refreshToken` ao service; Swagger do
  endpoint atualizado de `401` para `400` em "senha atual incorreta".
- **`packages/contracts/src/schemas/auth.ts`:** `changePasswordSchema` ganha
  `refreshToken: z.string().optional()` (retrocompatível — a web não envia).
- **Specs (`auth.service.spec.ts`):** senha errada → `BadRequestException`;
  sem `refreshToken` → `updateMany` sem filtro de `codigo`; com `refreshToken` →
  `updateMany` com `codigo: { not: <atual> }`.

### Bug 1 — mobile (`apps/mobile/`)

- **`use-mudar-senha.ts`:** lê `TokenStorage.getRefreshToken()`, anexa ao payload
  e envia `{ skipRefresh: true }` — assim um 401 dessa rota não dispara o
  interceptor de refresh (que deslogaria). Input do caller é só `senhaAtual` +
  `novaSenha`.
- **`senha.tsx`:** `catch` passa a tratar **`400`** como "senha atual incorreta"
  (era 401); sucesso vira `showToast(...)` (removido `Alert` nativo).
- **Specs (`use-mudar-senha.test.tsx`):** anexa refreshToken + skipRefresh; token
  ausente → `refreshToken: undefined`; propaga 400 sem deslogar.

## Checks

api: `pnpm --filter api test -- auth.service` (28 verdes), `tsc --noEmit` (api +
contracts) e `lint` limpos. mobile: `use-mudar-senha` (3 verdes), `tsc` + `lint`
limpos.

## Pendente (validação manual — só o usuário)

Trocar senha com a atual **errada**: mostra "senha atual incorreta" e **não**
desloga; trocar com sucesso: sessão atual **permanece** logada; demais
dispositivos saem.
