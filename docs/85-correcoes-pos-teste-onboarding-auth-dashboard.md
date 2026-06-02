# 85 — Correções pós-teste: onboarding, auth, dashboard, convite e deploy

**Status:** Implementado
**Branch:** `fix/pos-teste-onboarding-auth-dashboard`
**Base:** develop
**Data:** 2026-06-01

---

## Contexto

Sessão de testes manuais da aplicação web identificou múltiplos bugs em fluxos críticos:
onboarding, autenticação Google, dashboard ao vivo, convite de barbeiro, nota de cliente,
serviços e configuração de ambiente para produção.

---

## Arquivos criados/modificados

### API (`apps/api`)

| Arquivo | Tipo | O que mudou |
|---|---|---|
| `prisma/schema.prisma` | alter | Campo `descricao String?` adicionado ao model `Servico` |
| `prisma/migrations/20260601000002_add_servico_descricao/migration.sql` | novo | `ALTER TABLE TQE_SERVICO ADD COLUMN TQE_SRV_DESCRICAO VARCHAR(500)` |
| `src/usuario/usuario.service.ts` | fix | `create()` agora persiste `telefone` (estava omitido na query Prisma) |
| `src/convite/convite.service.ts` | feat | Verifica limite de plano antes de emitir convite (`gerarConvite`) e no aceite (`aceitarConvite`) |
| `src/notificacao/notificacao.service.ts` | feat | Remetente configurável via `EMAIL_FROM` (padrão `onboarding@resend.dev` para dev sem domínio verificado) |
| `src/dashboard/dashboard.service.ts` | fix | `getLiveMetrics` e `getBarbeirosStatus` incluem `EM_ANDAMENTO` além de `CONFIRMADO` no filtro de barbeiros ativos |
| `src/app.module.ts` | fix | `DashboardModule` registrado antes de `BarbeariaModule` para resolver conflito de rota `GET /barbearias/rede` |
| `src/servico/servico.service.spec.ts` | fix | Mocks de `Servico` atualizados com `descricao: null` |
| `src/agenda/agenda.service.spec.ts` | fix | Mock de `Servico` atualizado com `descricao: null` |
| `src/convite/convite.service.spec.ts` | fix | `beforeEach` em `aceitarConvite` mocka `barbearia.findUnique` e `planoLimite.findUnique` |
| `src/notificacao/notificacao.service.spec.ts` | fix | `from` nos mocks usa `expect.any(String)` (não hardcoda domínio) |
| `.env.example` | docs | Adicionado `API_BASE_URL`, `EMAIL_FROM`, `LOG_LEVEL` com documentação de dev vs prod |

### Web (`apps/web`)

| Arquivo | Tipo | O que mudou |
|---|---|---|
| `src/app/onboarding/page.tsx` | fix | Após criar barbearia, faz `PUT /barbearias/:id` com `telefone` e `cidade` (endereço) |
| `src/app/(auth)/login/page.tsx` | fix | Redireciona para `/dashboard` se usuário já estiver autenticado; mostra fundo vazio durante `loading` |
| `src/app/api/auth/token/route.ts` | feat | Retorna `canRefresh: boolean` além do token — indica se cookie `refresh_token` existe |
| `src/shared/api/api-client.ts` | fix | Só tenta refresh se `canRefresh=true`; se não há refresh token, falha imediatamente sem chamar a API (elimina 401 ruidoso no console em páginas públicas) |
| `src/features/auth/components/LoginForm.tsx` | fix | Após login Google, chama `establishSession()` em paralelo para popular o AuthProvider antes de navegar — corrige dashboard vazio após login Google |
| `src/features/barbeiros/services/barbeiro.service.ts` | fix | Convite de barbeiro usa `POST /convite` (aceita emails sem conta) em vez de `POST /membros` (exigia conta existente) |
| `src/features/clientes/hooks/use-cliente-nota.ts` | fix | Usa `tenantApi` em vez de `barbeariaApi` — endpoint `/clientes/:id/nota` não tem prefixo `/barbearias/:id/` na URL |
| `src/features/configuracoes/components/ConfiguracoesView.tsx` | feat | Aba "API Keys" removida (feature prematura para o estágio atual) |
| `src/features/configuracoes/constants/configuracao.constants.ts` | feat | Entrada `api-keys` removida de `SECOES` |
| `src/features/configuracoes/types/configuracao.types.ts` | feat | `"api-keys"` removido do union type `SecaoId` |
| `src/features/servicos/components/ServicoModal.tsx` | fix | Campo `descricao` populado do serviço existente ao abrir modal de edição (estava hardcoded `""`) |
| `src/features/servicos/components/ServicoDetalhe.spec.tsx` | novo | 6 testes para confirmação de exclusão de serviço |
| `src/shared/components/sidebar.tsx` | feat | Status ao vivo (aberta/fechada, barbeiros ativos) usa dados reais da API via `useSidebarStatus` |
| `src/shared/hooks/use-sidebar-status.ts` | novo | Hook que busca `liveMetrics` e horários de funcionamento para calcular status real da barbearia |
| `src/shared/hooks/use-sidebar-status.spec.ts` | novo | 12 testes cobrindo `calcularAberta` e `useSidebarStatus` |
| `src/test/msw-handlers.ts` | fix | Mock de `ServicoAPI` com `descricao: null`; handler do dashboard adicionado |
| `next.config.js` | fix | `apiOrigin` adicionado ao `img-src` da CSP — permite carregar logos servidas pela API |
| `.env.example` | docs | Reescrito com categorias, vars faltantes e documentação dev vs prod |

### Packages

| Arquivo | Tipo | O que mudou |
|---|---|---|
| `packages/contracts/src/types/api-responses.ts` | fix | `ServicoAPI` agora inclui `descricao: string \| null` |

### Infra/Deploy

| Arquivo | Tipo | O que mudou |
|---|---|---|
| `.github/workflows/ci-deploy.yml` | feat | 4 novos steps de sincronização: `RESEND_API_KEY`, `API_BASE_URL`, `FRONTEND_URL`, `EMAIL_FROM` |
| `apps/mobile/.env.example` | novo | Criado do zero com `EXPO_PUBLIC_API_URL`, `MOBILE_HOST_IP`, `GOOGLE_SERVICES_JSON`, `TOQE_DISABLE_KEEP_AWAKE` |
| `docs/84-pendencias-seguranca.md` | novo | 4 gaps de segurança documentados: rate limit, cleanup refresh tokens, Helmet headers, 2FA obrigatório para donos |

---

## Bugs corrigidos

### 1. Campos do onboarding não salvos
- **Problema:** telefone do usuário e cidade/telefone da barbearia preenchidos no onboarding não eram persistidos
- **Causa API:** `usuarioService.create` listava campos explicitamente, omitindo `telefone`
- **Causa Web:** `POST /barbearias` no onboarding enviava só `nome` e `slug`; sem `PUT` subsequente
- **Correção:** `telefone: dto.telefone ?? null` no service + `PUT /barbearias/:id` após criação

### 2. Dashboard vazio após login com Google
- **Problema:** após login Google, dashboard ficava vazio e navegação redirecionava para `/dashboard` em loop
- **Causa:** `LoginForm` chamava `router.push('/dashboard')` sem atualizar o `AuthProvider` — contexto permanecia com `user: null`, `perfil: null`; o `RequireRole` via `!isAuthorized` redirecionava em loop
- **Correção:** `Promise.all([api.get('/me'), establishSession()])` após `requestGoogleLogin`

### 3. `POST /api/auth/refresh 401` em páginas públicas
- **Problema:** 401 ruidoso no console em landing, login e onboarding (sem sessão)
- **Causa:** `api-client` tentava refresh cegamente quando token era null, mesmo sem cookie de refresh
- **Correção:** BFF `/api/auth/token` retorna `canRefresh: boolean`; client só tenta refresh se `canRefresh=true`

### 4. Página de login sem detecção de sessão ativa
- **Problema:** usuário logado que navegava para `/login` via URL direta via o formulário de login
- **Correção:** `useEffect` detecta `user !== null` e faz `router.replace('/dashboard')`

### 5. Convidar barbeiro retornava 404
- **Problema:** endpoint `POST /membros` exige usuário com conta existente; barbeiro novo não tem conta
- **Correção:** trocado para `POST /convite`, que cria convite + envia email e funciona para ambos os casos

### 6. Nota privada do cliente não carregava
- **Problema:** hook usava `barbeariaApi` que prefixava `/barbearias/73/clientes/1/nota`; endpoint real é `/clientes/1/nota` (sem prefixo, via header `x-tenant-id`)
- **Correção:** trocado para `tenantApi`

### 7. Campo descricao do serviço dava erro 500
- **Problema:** contrato e UI tinham `descricao` mas o model Prisma não tinha a coluna
- **Correção:** migration + campo no schema + `ServicoAPI` no contrato + modal de edição populando o campo

### 8. Página "Minha Rede" — "Tenant inválido"
- **Problema:** `DashboardModule` registrado após `BarbeariaModule`; NestJS resolvia `GET /barbearias/rede` como `GET /barbearias/:barCodigo` com `barCodigo='rede'` → NaN → 403
- **Correção:** `DashboardModule` registrado antes de `BarbeariaModule` no `app.module.ts`

### 9. Status do dashboard não incluía EM_ANDAMENTO
- **Problema:** `getBarbeirosStatus` e `getLiveMetrics` filtravam só `CONFIRMADO`; barbeiro com atendimento iniciado (`EM_ANDAMENTO`) aparecia como "Disponível/Livre"
- **Correção:** filtro ampliado para `{ in: [CONFIRMADO, EM_ANDAMENTO] }`

### 10. Logo da barbearia não exibia
- **Problema:** `API_BASE_URL` não configurada → URL salva como `http://localhost:3000/uploads/...` → inacessível no browser
- **Causa adicional:** CSP não permitia imagens da origem da API
- **Correção:** `API_BASE_URL` documentada no `.env.example`; `apiOrigin` adicionado ao `img-src` do CSP

---

## Limite de plano no convite (novo)

O `ConviteService` agora verifica o limite de barbeiros do plano em dois momentos:

1. **`gerarConvite`:** conta `membros ativos + convites pendentes` (excluindo renovação do mesmo email). Bloqueia antes de enviar o email.
2. **`aceitarConvite`:** re-verifica no momento do aceite — protege contra downgrade de plano entre envio e aceite.

---

## Email configurável (novo)

| Ambiente | `EMAIL_FROM` | Comportamento |
|---|---|---|
| Dev | `onboarding@resend.dev` (padrão) | Funciona sem verificar domínio no Resend |
| Prod | `Toqe <noreply@toqe.com.br>` | Requer domínio verificado no Resend |

---

## Secrets necessários no GitHub

Para deploy em produção, adicionar em `Settings → Secrets → Actions`:

| Secret | Valor prod |
|---|---|
| `API_BASE_URL` | `https://api.toqe.com.br` |
| `FRONTEND_URL` | `https://app.toqe.com.br` |
| `EMAIL_FROM` | `Toqe <noreply@toqe.com.br>` |
| `RESEND_API_KEY` | chave de produção do Resend |

---

## Checklist de validação

- [x] `pnpm --filter api lint` — 0 erros
- [x] `pnpm --filter web lint` — 0 erros
- [x] `cd apps/api && npx tsc --noEmit` — 0 erros
- [x] `cd apps/web && npx tsc --noEmit` — 0 erros
- [x] `pnpm --filter api test` — 514/514 passando
- [x] Migration aplicada localmente e registrada no histórico Prisma
