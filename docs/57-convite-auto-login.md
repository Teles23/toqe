# 57 — Convite: auto-login, rejeitar e boas-vindas

**Status:** Implementado
**Branch:** develop
**Base:** Fase 3 do fluxo barbeiro (slides 02–04 do protótipo "Toqe Fluxo Barbeiro")

## Contexto

O fluxo de convite (slides 02–04) terminava sem login: ao aceitar, o app voltava
para a raiz e o usuário caía na tela de login ("agora faça login"). A Fase 3
implementa **auto-login** após o aceite, a tela de **boas-vindas** (slide 04) e
o endpoint de **rejeitar**.

## Mudanças backend

| Arquivo                                      | Mudança                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts/src/schemas/convite.ts`  | `senha` min 6 → **min 8**                                                                                                       |
| `apps/api/src/auth/auth.service.ts`          | novo método público `issueTokens(codigo, nome, email)` (reusa `generateTokens`)                                                 |
| `apps/api/src/auth/auth.module.ts`           | `exports: [AuthService]`                                                                                                        |
| `apps/api/src/convite/convite.module.ts`     | importa `AuthModule`                                                                                                            |
| `apps/api/src/convite/convite.service.ts`    | `aceitarConvite` agora é **transacional** e retorna **tokens** (auto-login) + `isNew` + `barbeariaNome`; novo `rejeitarConvite` |
| `apps/api/src/convite/convite.controller.ts` | `DELETE /convite/:token` (rejeitar)                                                                                             |

### Resposta do aceite (auto-login)

```http
POST /convite/:token/aceitar
{ "nome": "Carlos", "senha": "12345678" }   # novo usuário
# — ou, usuário existente: { "senha": "<senha da conta>" }

→ 200 { access_token, refresh_token, user: { codigo, nome, email }, isNew, barbeariaNome }
```

### Segurança — usuário novo vs existente

A posse do link (enviado por e-mail) prova acesso ao e-mail, mas **não basta**
para logar como um usuário **já existente** (vetor de account-takeover se o link
vazar). Portanto:

- **Novo usuário:** cria conta (`nome` + `senha` min 8) → auto-login.
- **Usuário existente:** precisa informar a **senha da conta**, que é
  **verificada** (`bcrypt.compare`) antes de emitir tokens. Senha errada → 401.
  Conta sem senha (login social) → 401 com orientação para entrar pelo método
  original.

O `aceitarConvite` roda numa transação (cria usuário se novo + vincula membro +
marca convite usado); a emissão de tokens ocorre após o commit.

## Mudanças mobile

| Arquivo                                             | Mudança                                                                                                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/providers/auth-provider.tsx`            | extrai `establishSession(tokens)` (DRY de `login`/`loginWithGoogle`) e o expõe no contexto — estabelece a sessão sem redirecionar                                    |
| `src/shared/hooks/use-aceitar-convite.ts`           | result type agora traz tokens + `isNew` + `barbeariaNome`                                                                                                            |
| `src/shared/hooks/use-rejeitar-convite.ts` _(novo)_ | `DELETE /convite/:token`                                                                                                                                             |
| `app/convite/[token].tsx`                           | aceite → `establishSession(tokens)` → view **boas-vindas** ("Bem-vindo, {nome}" + "Ver minha agenda" → `/(barbeiro)/agenda`); rejeitar → `useRejeitarConvite` + back |

A tela de boas-vindas é mostrada apenas no fluxo de aceite (acontece uma única
vez) — satisfaz "splash só na primeira sessão" sem precisar de flag persistida.

## Testes

- **api** `convite.service.spec.ts`: auto-login (novo + existente com senha), senha
  incorreta → 401, senha ausente p/ existente → 400, transação, `rejeitarConvite`
  (idempotente).
- **mobile** `use-aceitar-convite.test` (novo shape), `use-auth.test`
  (`establishSession`), `[token].test` (auto-login + boas-vindas + navegação +
  rejeitar via DELETE).

## Decisões / limitações

- Sem flag `primeiroAcesso` persistida — a boas-vindas vive no fluxo de aceite.
- O envio do convite (WhatsApp/e-mail) segue fora de escopo (exceção conhecida do
  prompt; o disparo por e-mail já existe).
