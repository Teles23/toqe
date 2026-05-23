# 72 — Correções pós-teste: aba Clientes + troca de senha

**Status:** Implementado (validação no device pendente — só o usuário)
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

| Item            | Mudança                                                                                                                                                                                                   | Commit    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Bug 1 + 2 (API) | `changePassword`: senha atual incorreta → **`BadRequestException` (400)**, não 401. Revoga apenas as **outras** sessões — identifica a atual pelo `refreshToken` enviado e a preserva. + specs            | `546f0d0` |
| Bug 1 (mobile)  | `useMudarSenha` anexa o `refreshToken` da sessão atual e passa `skipRefresh: true`; `senha.tsx` trata `400` como erro de campo e mostra toast de sucesso (sem Alert, sem logout). + specs                 | `0892ae3` |
| Bug 3           | Toggle de visibilidade (olho) nos 3 campos de `senha.tsx` via `CampoSenha` (sub-componente local, mantém o padrão card da tela). testID `<campo>-toggle`.                                                 | `1fbdd1b` |
| UX 1            | `+` da tela Clientes abre **cadastro de cliente** (nome+telefone obrig., e-mail opcional) em vez do encaixe. Endpoint passa a aceitar e-mail opcional + role `barbeiro`. Invalida `['clientes']` + toast. | `a310eb1` |
| UX 2            | E-mails sintéticos (`@toqe.internal`, `@walk-in.local`, vazio/nulo) não aparecem na UI. Helper `emailVisivel` no `ClienteCard` (telefone > e-mail real > nada) e na busca. + specs.                       | `2dd3e07` |
| UX 3            | Chips de ordenação soltos saem; ícone `sliders` no header abre `OrdenarClientesSheet` com 5 opções (Nome A→Z/Z→A, Última recente/antiga, Total gasto), selecionada com âmbar + check. + specs.            | `42051a7` |
| UX 4            | Sino da agenda → toast "Notificações em breve" (já implementado em rodada anterior; não há feed de notificações, só preferências). **Sem ação.**                                                          | —         |

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

### Bug 3 — toggle de senha (`senha.tsx`)

Os 3 campos viram `<CampoSenha>` (sub-componente `forwardRef` local): card com
label uppercase + `TextInput` + botão de olho (`Feather eye`/`eye-off`) que
alterna `secureTextEntry`. Decisão: **não** reusar o `FormInput` global (visual
diferente, de login/cadastro) nem criar componente em `shared/ui` usado por uma
só tela — extração local mantém o design e elimina a repetição.

### UX 1 — cadastro de cliente pelo `+` (Clientes)

O `+` abria o `AdicionarWalkInModal` (encaixe/agendamento) — confuso, pois
encaixe já vive no FAB da agenda. Agora abre `AdicionarClienteModal`, que apenas
**registra o cliente** (sem agendamento):

- **Contract:** `criarClienteManualSchema = criarClienteRapidoSchema.partial({ email: true })`
  → `nome` obrigatório, `email` opcional. `criarClienteRapidoSchema` (booking
  público, e-mail obrigatório) fica **intacto**.
- **API:** `POST /barbearias/:barCodigo/clientes` passa a usar `CriarClienteManualDto`
  e inclui a role `barbeiro` (antes só dono/gerente/recepcionista). O service
  `criarCliente` já aceitava e-mail ausente — gera sintético `@toqe.internal`,
  igual ao walk-in. + specs (`membro-barbearia.service.spec`: com e-mail, sem
  e-mail/sintético, conflito 409).
- **Mobile:** `useCriarCliente` (POST tenant + invalida `['clientes']`);
  `AdicionarClienteModal` (nome + telefone obrigatórios na UI, e-mail opcional)
  com toast "Cliente cadastrado". `clientes.tsx`: `+` (`btn-adicionar-cliente`)
  abre esse sheet. + specs (hook + tela).
- **Telefone obrigatório** é regra da UI mobile (validação client-side); o
  endpoint mantém telefone opcional por ser compartilhado com a web.

### UX 2 — ocultar e-mails sintéticos

Clientes sem e-mail real recebem um e-mail sintético server-side
(`encaixe-…@toqe.internal`) por causa da constraint `@unique NOT NULL`. Esses
e-mails vazavam no `ClienteCard` (fallback quando não há telefone).

- **`shared/utils/cliente.ts` `emailVisivel(email)`:** retorna `null` para
  domínios sintéticos (`@toqe.internal`, `@walk-in.local`), vazio ou nulo;
  senão retorna o e-mail. + spec dedicado.
- **`ClienteCard`:** identificador secundário agora é telefone > e-mail real >
  nada (antes caía no e-mail sintético). + specs.
- **`clientes.tsx`:** a busca textual por e-mail também usa `emailVisivel` —
  não casa em e-mail sintético.
- **`ClienteDetalhe`** não exibe e-mail (só telefone) → nada a fazer lá.

### UX 3 — ordenação por ícone + sheet

Os botões soltos "Nome"/"Última visita" no layout saíram. Agora há um ícone
`sliders` no header (ao lado do `+`) que abre o `OrdenarClientesSheet` (reusa o
`BottomSheet` global, `height="content"`) com 5 opções:

- Nome (A → Z) / Nome (Z → A)
- Última visita (mais recente) / (mais antiga) — sem visita vai sempre ao fim
- Total gasto (desc)

A opção ativa é destacada (âmbar + check) com `accessibilityState.checked`.
`testID`: `btn-ordenar`, `sort-option-<id>`. + specs (sheet isolado + fluxo
abrir/selecionar na tela).

### UX 4 — sino da agenda

Já estava correto: o sino (`btn-notificacoes` em `agenda.tsx`) dispara
`showToast("Notificações em breve", "info")` — com spec em `agenda.test.tsx`.
Não existe tela de **feed** de notificações (só a de **preferências**, em
Perfil), então o toast é o fallback pedido. **Sem mudança de código.**

### Addendum — linha "Notificações" do Perfil → preferências

A linha "Notificações push" (e "WhatsApp") em `perfil/index.tsx` era só display
(sem `onTap`). Agora navega para a tela de **preferências** já existente via
`go("/notificacoes")` (`/(barbeiro)/perfil/notificacoes`, sibling com `notificacoes.tsx`
nos dois grupos — barbeiro e cliente). `testID` `ir-notificacoes` + spec de
navegação. Distinção mantida: **sino da agenda = feed (toast)**, **linha do
Perfil = preferências (tela)**.

## Decisões

- **Bug 3:** `CampoSenha` local em vez de `shared/ui` — o padrão card é exclusivo
  desta tela; um componente global seria usado por um único consumidor.
- **UX 1:** novo `criarClienteManualSchema` em vez de relaxar o `rapido` —
  o `rapido` é compartilhado com o booking público (e-mail obrigatório). A web
  (que usa `criarClienteRapidoSchema` e exige e-mail no próprio form) continua
  funcionando sem alteração.
- **UX 4:** bell roteia para toast, não para a tela de preferências — um sino
  abre um feed de notificações (inexistente), não as configurações.

## Checks

Suítes completas verdes ao final:

- **api:** 306 testes (38 suites), `tsc --noEmit` e `lint` limpos.
- **mobile:** 582 testes (99 suites), `tsc --noEmit` e `lint` limpos.
- **contracts:** `tsc --noEmit` limpo.

A web não foi alterada (importa o `criarClienteRapidoSchema` intacto).

## Pendente (validação manual — só o usuário)

- **Senha errada:** mostra "senha atual incorreta" e **não** desloga.
- **Senha trocada com sucesso:** sessão atual **permanece** logada; demais
  dispositivos saem.
- **Olho:** alterna visibilidade em cada campo de senha.
- **Clientes `+`:** cadastra cliente (nome + telefone; e-mail opcional) e ele
  aparece na lista; toast "Cliente cadastrado".
- **E-mails sintéticos** de walk-in/encaixe não aparecem no card do cliente.
- **Ordenação:** ícone abre o sheet; opção escolhida reordena e fica destacada.
- **Sino da agenda:** toast "Notificações em breve".
