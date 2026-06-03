# 88 — Auth redirect, convite, perfil de barbeiro, agenda e onboarding

**Status:** Implementado
**Branch:** `fix/auth-redirect-onboarding`
**Base:** develop
**PR:** #164
**Data:** 2026-06-03

---

## Contexto

Sessão de testes em homologação identificou bugs e gaps funcionais em múltiplos fluxos:
usuário autenticado sem barbearia acessava o dashboard quebrando a navegação; aceite de
convite aceitava senha muito curta; barbeiro não tinha obrigatoriedade de serviço no modal;
agenda exibia todos os agendamentos independentemente do perfil logado; onboarding avançava
sem validar horários e serviços; convites rejeitados eram deletados sem deixar rastro de auditoria.

---

## 1. Auth redirect — sem barbearia vai para onboarding

### Problema
Usuário autenticado mas sem barbearia associada (ex: conta criada via Google sem completar
onboarding) acessava o dashboard e causava erro de contexto.

### Solução
`apps/web/src/app/(dashboard)/layout.tsx` redireciona para `/onboarding` quando
`barbearias.length === 0`. No mobile, `apps/mobile/app/_layout.tsx` faz o mesmo
redirecionando para a tela de onboarding após login.

---

## 2. Convite — soft-delete de rejeições com campo `rejeitadoEm`

### Problema
`rejeitarConvite` usava `deleteMany`, apagando o registro permanentemente e impedindo auditoria.

### Solução
Substituído por `updateMany` com `rejeitadoEm: new Date()`. `obterConvite` agora filtra
convites com `rejeitadoEm != null` (retorna 404). Campo adicionado ao schema com migration.

```sql
-- migration.sql
ALTER TABLE "TQE_CONVITE_BARBEARIA" ADD COLUMN "TQE_CVT_REJEITADO_EM" TIMESTAMP(3);
```

```typescript
// convite.service.ts
async rejeitarConvite(token: string) {
  await this.prisma.conviteBarbearia.updateMany({
    where: { token, usadoEm: null, rejeitadoEm: null },
    data: { rejeitadoEm: new Date() },
  });
}
```

---

## 3. Convite — validação client-side no aceite (web + mobile)

### Regras implementadas

| Campo | Regra | Quando |
|-------|-------|--------|
| `nome` | ≥ 2 caracteres | `isNew = true` |
| `senha` | ≥ 8 caracteres | sempre |
| Erro da API | mensagem real exibida | HTTP 4xx |

### Comportamento
- Submit bloqueado enquanto validação falha (API não é chamada)
- Após erro 400/422 da API, `response.message` é exibido no formulário
- Estado `convite-accepting` (spinner) enquanto POST está em voo

---

## 4. BarbeiroModal — regras por perfil

### Regras implementadas

| Perfil | Serviços | Comissão | Restrição |
|--------|----------|----------|-----------|
| `barbeiro` | obrigatório (≥ 1) | sim | botão salvar desabilitado sem serviço |
| `gerente` | opcional | sim | sem restrição |
| `recepcionista` | não exibe | não exibe | — |

Título do modal muda conforme perfil selecionado: "Novo barbeiro" / "Novo gerente" / "Nova recepcionista".

---

## 5. Agenda — filtro por perfil do usuário logado

### Comportamento

| Perfil | Vê |
|--------|----|
| `dono`, `gerente`, `recepcionista` | todos os agendamentos |
| `barbeiro` | apenas os seus (filtra por `barbeiroUsrCodigo === user.codigo`) |

Botões de seleção de barbeiro ficam ocultos para o perfil `barbeiro`.

Campo `barbeiroUsrCodigo` adicionado ao tipo `Slot` em `packages/shared/src/types/index.ts`.

---

## 6. Onboarding — validações nos passos 4 e 5

| Passo | Título | Regra | Erro exibido |
|-------|--------|-------|--------------|
| 4 | Quando vocês abrem? | ≥ 1 dia ativo | "Ative ao menos um dia de funcionamento." |
| 5 | O que vocês fazem? | ≥ 1 serviço com nome, preço e duração | "Adicione ao menos um serviço." |

---

## 7. Configurações — SecaoHorarios bloqueia sem dia ativo

Equivalente ao passo 4 do onboarding, mas na tela de configurações: salvar com todos os
dias fechados exibe erro e não chama a mutação. Erro some ao reativar um dia e salvar.

---

## 8. Mobile — navegação pública `/b/:slug`

Rota `app/b/[slug].tsx` recebe o slug de uma barbearia (link público compartilhável):
- Usuário autenticado → redireciona para a tela de agendamento
- Usuário não autenticado → redireciona para login com `returnTo=/b/:slug`

`app/convite.tsx` normaliza links de convite com query string (`?token=`) para a rota canônica `/convite/:token`.

---

## Arquivos criados/modificados

### API (`apps/api`)

| Arquivo | Tipo | O que mudou |
|---------|------|-------------|
| `prisma/schema.prisma` | alter | Campo `rejeitadoEm DateTime?` em `ConviteBarbearia` |
| `prisma/migrations/20260602000001_add_rejeitado_em_convite/migration.sql` | novo | `ALTER TABLE` + coluna `TQE_CVT_REJEITADO_EM` |
| `src/convite/convite.service.ts` | fix | `rejeitarConvite` usa `updateMany`; `obterConvite` filtra `rejeitadoEm != null` |
| `src/convite/convite.service.spec.ts` | test | Testa soft-delete, idempotência e filtro de convites rejeitados (26 testes) |
| `src/common/utils/slug.utils.ts` | fix | `maskSlug` normaliza acentos corretamente |
| `src/common/utils/slug.utils.spec.ts` | test | Cobre acentos, espaços e caracteres especiais |
| `src/usuario/usuario.service.spec.ts` | fix | Mocks atualizados |

### Web (`apps/web`)

| Arquivo | Tipo | O que mudou |
|---------|------|-------------|
| `src/app/(dashboard)/layout.tsx` | fix | Redirect para `/onboarding` quando `barbearias.length === 0` |
| `src/shared/providers/auth-provider.tsx` | fix | Comportamento de sessão atualizado |
| `src/shared/providers/auth-provider.spec.tsx` | test | Spec atualizado |
| `src/features/auth/components/LoginForm.tsx` | fix | Chama `establishSession` em paralelo após login Google |
| `src/features/convite/components/ConviteForm.tsx` | feat | Validação client-side (nome, senha); erro real da API |
| `src/features/convite/components/ConviteForm.spec.tsx` | test | 16 testes; 3 novos casos de validação |
| `src/features/barbeiros/components/BarbeiroModal.tsx` | feat | Regras por perfil; barbeiro exige serviço |
| `src/features/barbeiros/components/BarbeiroModal.spec.tsx` | test | 20 testes; 9 novos |
| `src/features/agenda/types/agenda.types.ts` | feat | `barbeiroUsrCodigo` adicionado ao tipo `Slot` local |
| `src/features/agenda/hooks/use-agenda.ts` | feat | Passa `barbeiroUsrCodigo` nos dados |
| `src/features/agenda/components/AgendaView.tsx` | feat | Filtra slots por perfil |
| `src/features/agenda/components/AgendaView.spec.tsx` | novo | 5 testes cobrindo todos os perfis |
| `src/app/onboarding/page.tsx` | feat | Passos 4 e 5 com validação de bloqueio |
| `src/app/onboarding/onboarding.spec.tsx` | test | 4 novos testes; helpers `goToStep4/5` |
| `src/features/configuracoes/components/SecaoHorarios.tsx` | feat | Valida ≥ 1 dia ativo antes de salvar |
| `src/features/configuracoes/components/SecaoHorarios.spec.tsx` | novo | 4 testes |
| `src/features/configuracoes/components/SecaoQrCode.tsx` | fix | Usa `NEXT_PUBLIC_BOOKING_DOMAIN` dinâmico |
| `src/features/configuracoes/components/SecaoQrCode.spec.tsx` | fix | Spec atualizado |
| `src/features/super-admin/components/TenantDrawer.tsx` | fix | Campos de contrato atualizados |
| `src/features/super-admin/components/TenantDrawer.spec.tsx` | fix | Spec atualizado |
| `src/app/.well-known/apple-app-site-association/route.ts` | novo | Universal Links iOS |
| `src/app/.well-known/assetlinks.json/route.ts` | novo | App Links Android |

### Mobile (`apps/mobile`)

| Arquivo | Tipo | O que mudou |
|---------|------|-------------|
| `app/_layout.tsx` | fix | Redirect para onboarding se sem barbearia |
| `src/shared/providers/auth-provider.tsx` | fix | Comportamento de sessão atualizado |
| `app/(auth)/login.tsx` | fix | Fluxo pós-login com verificação de barbearia |
| `app/(auth)/cadastro.tsx` | fix | Fluxo pós-cadastro com verificação de barbearia |
| `app/convite/[token].tsx` | feat | Validação client-side (nome, senha); erro real da API |
| `app/convite/__tests__/[token].test.tsx` | test | 16 testes; testes 14–16 novos |
| `app/b/[slug].tsx` | novo | Rota pública de booking por slug |
| `app/convite.tsx` | novo | Normaliza links com query string para rota canônica |
| `src/shared/navigation/return-to.ts` | novo | Utilitário de `returnTo` para redirecionamento pós-login |
| `src/shared/navigation/__tests__/return-to.test.ts` | novo | Testes do utilitário |
| `src/shared/api/api-client.ts` | fix | `EXPO_PUBLIC_API_URL` por ambiente |
| `src/shared/hooks/use-push-notifications.ts` | fix | Nova interface de permissão Expo |

### Shared (`packages/shared`)

| Arquivo | Tipo | O que mudou |
|---------|------|-------------|
| `src/types/index.ts` | feat | Campo `barbeiroUsrCodigo?: number` adicionado ao tipo `Slot` |

### Infra / Docs

| Arquivo | Tipo | O que mudou |
|---------|------|-------------|
| `apps/api/.env.example` | docs | `REDIS_HOST`, `BOOKING_DOMAIN` |
| `apps/mobile/.env.example` | docs | `EXPO_PUBLIC_API_URL` por perfil |
| `apps/web/.env.example` | docs | `NEXT_PUBLIC_BOOKING_DOMAIN` |
| `apps/mobile/app.config.ts` | fix | Deep link scheme e bundle identifier |
| `apps/mobile/eas.json` | fix | Perfil `production` atualizado |
| `nginx/conf.d/toqe.conf` | fix | Subdomínios `toqe-barber.com.br` |
| `turbo.json` | fix | Pipeline atualizada |

---

## Testes

Todos os checks passaram antes do commit:

```bash
pnpm --filter api lint          # 0 errors
pnpm --filter web lint          # 0 errors
pnpm --filter mobile lint       # 0 errors
cd apps/api && npx tsc --noEmit # 0 errors
pnpm --filter web check-types   # 0 errors
pnpm --filter mobile type-check # 0 errors
pnpm --filter api test          # 528 passed, 53 suites
pnpm --filter web test          # 39 test files passed
pnpm --filter mobile test       # 612 passed, 103 suites
```
