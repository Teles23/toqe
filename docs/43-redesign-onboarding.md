# 43 — Redesign da tela de Onboarding

| Campo      | Valor                      |
| ---------- | -------------------------- |
| **Status** | ✅ Completo                |
| **Branch** | `feat/redesign-onboarding` |
| **Base**   | `develop` (`8774405`)      |

---

## Contexto

Redesign completo da tela de onboarding do painel web, seguindo a linguagem editorial/urbana inaugurada pelo redesign do login. A tela passa a ter 7 passos guiados em layout lateral-fixo + área de conteúdo principal, com CSS tokens próprios (`ob-*`, `tqe-ob-*`) definidos em `globals.css`.

Junto ao redesign foram implementados os endpoints de **horário de funcionamento** (`GET`/`PUT /barbearias/:barCodigo/horarios`) — necessários para o passo 4 do onboarding — e a respectiva migration Prisma.

---

## Arquivos criados

| Arquivo                                                                | Descrição                                            |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| `apps/api/prisma/migrations/20260519000000_add_horario_funcionamento/` | Migration que cria a tabela `HorarioFuncionamento`   |
| `apps/api/src/barbearia/dto/upsert-horarios.dto.ts`                    | DTO NestJS para PUT /horarios (valida array de dias) |
| `apps/web/src/app/onboarding/onboarding.spec.tsx`                      | 7 testes Vitest para o fluxo de onboarding           |
| `docs/43-redesign-onboarding.md`                                       | Este documento                                       |

## Arquivos modificados

| Arquivo                                                | Mudança                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                        | Adiciona modelo `HorarioFuncionamento`                         |
| `apps/api/src/barbearia/barbearia.controller.ts`       | Adiciona `GET`/`PUT :barCodigo/horarios`                       |
| `apps/api/src/barbearia/barbearia.service.ts`          | Adiciona `getHorarios` e `upsertHorarios`                      |
| `apps/api/src/barbearia/barbearia.service.spec.ts`     | Testes unit para os novos métodos                              |
| `apps/api/src/agendamento/agendamento.service.spec.ts` | Fix lint `no-unsafe-assignment` (nested objectContaining)      |
| `apps/api/src/push-token/push-token.service.spec.ts`   | Fix lint `no-unsafe-assignment`                                |
| `apps/api/src/test/prisma-mock.factory.ts`             | Expõe `horarioFuncionamento` no mock                           |
| `apps/web/src/app/globals.css`                         | +359 linhas: design system do onboarding (`ob-*`, `tqe-ob-*`)  |
| `apps/web/src/app/onboarding/page.tsx`                 | Redesign completo (layout 7 passos)                            |
| `apps/web/src/test/msw-handlers.ts`                    | Handlers MSW para `GET`/`PUT /horarios`                        |
| `packages/contracts/src/schemas/barbearia.ts`          | Adiciona `horarioFuncionamentoSchema` e `upsertHorariosSchema` |

---

## Arquitetura do onboarding

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  ob-side (240px fixo)    │  ob-main (flex-1)            │
│  ─────────────────────   │  ───────────────────────     │
│  Logo                    │  PASSO N DE 7  · ~X min      │
│  Headline editorial      │                               │
│  Progresso (7 passos)    │  <StepComponent />            │
│  Help footer             │                               │
│                          │  [← Voltar]  [Continuar →]   │
└─────────────────────────────────────────────────────────┘
```

### Passos e componentes

| Passo                        | Componente    | Valida                                                                     |
| ---------------------------- | ------------- | -------------------------------------------------------------------------- |
| 1 — Criar conta              | `Passo1Conta` | `registerSchema` (nome, email, senha) + match de senhas + checkEmailExists |
| 2 — Sua barbearia            | `Passo1`      | `createBarbeariaSchema` (nome, slug)                                       |
| 3 — Identidade visual        | `Passo2`      | — (cor + logo são opcionais)                                               |
| 4 — Horário de funcionamento | `Passo3`      | — (defaults razoáveis pré-carregados)                                      |
| 5 — Serviços                 | `Passo4`      | `createServicoSchema` por item                                             |
| 6 — Equipe                   | `Passo5`      | `convidarMembroSchema` por barbeiro com e-mail preenchido                  |
| 7 — Tudo pronto              | `Passo6`      | Preview + publicação                                                       |

### Fluxo de publicação (passo 7)

```
1. POST /auth/register (se não Google)
2. POST /api/auth/login → cookies
3. POST /barbearias → barCodigo
4. PUT  /barbearias/:barCodigo/tema (cor primária)
5. PUT  /barbearias/:barCodigo/horarios (7 dias)
6. POST /barbearias/:barCodigo/logo (se logoFile)
7. POST /barbearias/:barCodigo/servicos × N
8. POST /barbearias/:barCodigo/membros × M (allSettled)
9. router.push('/dashboard')
```

### Auto-slug

`maskSlug(nomeBarbearia)` → `nome-da-barbearia` (reutiliza `masks.ts` existente).
O slug é auto-gerado enquanto o usuário não editar o campo manualmente (flag `slugEditado`).

---

## API — Horário de funcionamento

### Schema Prisma

```prisma
model HorarioFuncionamento {
  codigo     Int       @id @default(autoincrement())
  barCodigo  Int
  diaSemana  Int       // 0 = Domingo … 6 = Sábado
  aberto     Boolean
  abertura   String    // HH:MM
  fechamento String    // HH:MM
  barbearia  Barbearia @relation(fields: [barCodigo], references: [codigo])
  @@unique([barCodigo, diaSemana])
}
```

### Endpoints

| Método | Rota                              | Permissão                              | Descrição                              |
| ------ | --------------------------------- | -------------------------------------- | -------------------------------------- |
| `GET`  | `/barbearias/:barCodigo/horarios` | dono, gerente, barbeiro, recepcionista | Lista horários ordenados por diaSemana |
| `PUT`  | `/barbearias/:barCodigo/horarios` | dono, gerente                          | Upsert array de horários (1–7 dias)    |

### Contracts (`@toqe/contracts`)

```typescript
horarioFuncionamentoSchema; // diaSemana, aberto, abertura, fechamento
upsertHorariosSchema; // array(horarioFuncionamentoSchema).min(1).max(7)
```

---

## Testes

### Web — `onboarding.spec.tsx` (7 testes)

| Teste                                              |
| -------------------------------------------------- |
| Renderiza passo 1 com campos de conta              |
| Exibe erro quando nome é muito curto               |
| Exibe erro quando senhas não conferem              |
| Avança para passo 2 ao passar validação do passo 1 |
| Auto-preenche slug ao digitar nome da barbearia    |
| Renderiza sidebar com 7 passos e destaca o ativo   |
| Botão Voltar está desabilitado no passo 1          |

### API — `barbearia.service.spec.ts` (+4 testes)

| Teste                                                            |
| ---------------------------------------------------------------- |
| `getHorarios` retorna horários ordenados por diaSemana           |
| `getHorarios` lança NotFoundException se barbearia não existe    |
| `upsertHorarios` faz upsert de todos os dias enviados            |
| `upsertHorarios` lança NotFoundException se barbearia não existe |

---

## Validação pré-commit

```bash
# Lint
pnpm --filter web lint        # ✅
pnpm --filter api lint        # ✅

# Tipos
cd apps/web && npx tsc --noEmit   # ✅
cd apps/api && npx tsc --noEmit   # ✅

# Testes
pnpm --filter web test -- --run   # 136/136 ✅
pnpm --filter api test            # 202/202 ✅
```

---

## Reutilizações (sem código novo desnecessário)

- `maskSlug` / `maskTelefone` — `@/shared/utils/masks`
- `registerSchema`, `createBarbeariaSchema`, `createServicoSchema`, `convidarMembroSchema` — `@toqe/contracts`
- `checkEmailExists` — `@/features/auth/services/auth.service`
- `getInitial` — `@/shared/lib/utils`
- `api`, `tenantApi` — `@/shared/api/api-client`
- Design tokens CSS (`var(--primary)`, `var(--bg-*)`, `var(--text-*)`, etc.) — `globals.css`
