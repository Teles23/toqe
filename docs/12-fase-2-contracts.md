# 12. Fase 2 — Packages Compartilhados (`@toqe/contracts` + `nestjs-zod`)

> **Status:** em execução · **Branch:** `arch/fase-2-contracts` · **PR alvo:** `feature/arquitetura-reorganizacao` · **Documento-mãe:** [`10-arquitetura-reorganizacao.md`](./10-arquitetura-reorganizacao.md).

## Objetivo

Unificar a validação do monorepo com **Zod como source of truth**, eliminando a duplicação `class-validator` (back) ↔ `zod` (front). Renomear `packages/validators` → `packages/contracts` e introduzir `nestjs-zod` no backend (módulo piloto: `auth`).

## Entregáveis desta fase

### 1. Renomeação `packages/validators` → `packages/contracts`

- Pasta movida via `Move-Item` (Git detecta como rename).
- `package.json` renomeado para `@toqe/contracts` com `exports` map para sub-paths:
  - `@toqe/contracts` (barrel raiz: schemas + types + errors)
  - `@toqe/contracts/schemas` (todos os schemas)
  - `@toqe/contracts/schemas/auth` (schema específico, ideal para tree-shake no FE)
  - `@toqe/contracts/types`
  - `@toqe/contracts/errors`

### 2. Reorganização interna em subpastas

```
packages/contracts/src/
  schemas/         # schemas Zod (1 arquivo por domínio)
    agenda.ts
    agendamento.ts
    auth.ts
    barbearia.ts
    notificacao.ts
    servico.ts
    usuario.ts
    index.ts       # barrel
  types/           # tipos inferidos (z.infer)
    index.ts
  errors/          # ApiErrorCode, ApiErrorPayload, ApiFieldError, helpers
    index.ts
  index.ts         # re-export geral
```

**Regras adotadas:**

- Schemas **não** exportam `type` (evita duplicação no barrel raiz).
- Tipos vivem em `types/index.ts` (single source).
- Schemas usam `.strict()` quando representam input para evitar campos extras silenciosos.
- `errors/` define o payload HTTP padronizado (`ApiErrorPayload`) e helper `zodErrorToFieldErrors()`.

### 3. Atualização de paths no monorepo

- `tsconfig.base.json` — adicionados paths `@toqe/contracts`, `@toqe/contracts/schemas`, `@toqe/contracts/schemas/*`, `@toqe/contracts/types`, `@toqe/contracts/errors`.
- `apps/api/package.json`, `apps/web/package.json`, `apps/mobile/package.json` — dependência atualizada de `@toqe/validators` para `@toqe/contracts`.
- `apps/api/Dockerfile`, `apps/api/Dockerfile.dev`, `apps/web/Dockerfile.dev` — `COPY packages/validators/package.json` → `COPY packages/contracts/package.json`.
- Imports em `apps/web/app/(auth)/login/page.tsx` e `apps/web/app/onboarding/page.tsx` migrados.
- Documentos atualizados: `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `commitlint.config.cjs` (scope `validators` removido — agora só `contracts`).

### 4. `nestjs-zod` no backend (módulo piloto: `auth`)

- Dependência `nestjs-zod@^4.3.1` + `zod@^3.22.4` adicionadas em `apps/api/package.json`.
- DTOs do `auth` reescritos com `createZodDto(<schema>)`:
  - `apps/api/src/auth/dto/login.dto.ts` ← `loginSchema`
  - `apps/api/src/auth/dto/refresh-token.dto.ts` ← `refreshTokenSchema`
  - `apps/api/src/auth/dto/logout.dto.ts` ← `logoutSchema`
- Schemas adicionados no `@toqe/contracts/schemas/auth.ts`:
  - `refreshTokenSchema`, `logoutSchema`, `authTokensSchema` (resposta).
- `apps/api/src/main.ts`:
  - `ZodValidationPipe` registrado **antes** do `ValidationPipe` (class-validator) — coexistência permite migração incremental.
  - `patchNestJsSwagger()` chamado antes de `SwaggerModule.createDocument` para que o Swagger leia os DTOs Zod.

### 5. Tipos de erro compartilhados

Criado `packages/contracts/src/errors/index.ts` expondo:

- `ApiErrorCode` (enum-like): `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION`, `RATE_LIMITED`, `INTERNAL`.
- `ApiFieldErrorSchema` — detalhe por campo em erros de validação.
- `ApiErrorPayloadSchema` — payload HTTP padrão (`statusCode`, `code`, `message`, `details`, `timestamp`, `path`, `requestId`).
- `zodErrorToFieldErrors(zodError)` — helper para converter `ZodError` em `ApiFieldError[]` (uso futuro no filtro global do NestJS e no api-client).

## Arquivos criados

```
docs/12-fase-2-contracts.md (este)
packages/contracts/src/schemas/index.ts (barrel)
packages/contracts/src/types/index.ts
packages/contracts/src/errors/index.ts
```

## Arquivos modificados

- Renomeados: `packages/validators/*` → `packages/contracts/*` (com reorganização em subpastas).
- `packages/contracts/package.json` (nome + `exports` map + descrição).
- `packages/contracts/src/schemas/auth.ts` — adicionados `refreshTokenSchema`, `logoutSchema`, `authTokensSchema`; removidos `export type` (movidos para `types/index.ts`).
- `packages/contracts/src/index.ts` — passa a re-exportar de `schemas/`, `types/`, `errors/`.
- `tsconfig.base.json` — paths atualizados.
- `apps/api/src/main.ts` — `ZodValidationPipe` + `patchNestJsSwagger()`.
- `apps/api/src/auth/dto/{login,logout,refresh-token}.dto.ts` — convertidos para `createZodDto(...)`.
- `apps/api/package.json`, `apps/web/package.json`, `apps/mobile/package.json` — deps.
- `apps/api/Dockerfile`, `apps/api/Dockerfile.dev`, `apps/web/Dockerfile.dev`.
- `apps/web/app/(auth)/login/page.tsx`, `apps/web/app/onboarding/page.tsx` — imports.
- `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `commitlint.config.cjs`.
- `apps/web/README.md` — texto sobre `@toqe/contracts`.

## Validação

| Checagem                                 | Resultado                                                                                                                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                           | ✅ instalou `nestjs-zod@4.3.1`                                                                                                                                                           |
| `pnpm --filter api build` (`nest build`) | ✅ compila                                                                                                                                                                               |
| `pnpm --filter api lint`                 | ✅ 0 erros                                                                                                                                                                               |
| `pnpm --filter api exec tsc --noEmit`    | ✅ apenas erro pré-existente em `src/tenant/tenant/tenant.interceptor.spec.ts:5` (não introduzido pela Fase 2)                                                                           |
| `pnpm --filter web exec tsc --noEmit`    | ✅ 0 erros                                                                                                                                                                               |
| `pnpm --filter api test`                 | ⚠️ 13 falhas pré-existentes (DI scaffolding nos `*.spec.ts`); confirmado pela mesma falha após `git stash`. Não bloqueante para esta fase — será endereçado em fase de testes (Fase 6+). |

## Critérios de aceite

- [x] `packages/validators` removido; `packages/contracts` em uso.
- [x] Imports `@toqe/validators` substituídos em todo o monorepo.
- [x] Backend tem `nestjs-zod` instalado.
- [x] Pelo menos 1 módulo (auth) com DTOs Zod-first.
- [x] Schemas Zod reaproveitados entre back (DTOs) e front (forms) sem divergência.
- [x] Tipos de erro compartilhados em `@toqe/contracts/errors`.
- [x] Build api ✅, type-check api ✅ (pré-existente fora), type-check web ✅, lint api ✅.
- [ ] PR da Fase 2 mergeado em `feature/arquitetura-reorganizacao`.

## Próximos passos (Fase 3)

- Branch `arch/fase-3-frontend-piloto`.
- Mover `apps/web/app/` → `apps/web/src/app/`.
- Criar `src/features/auth/` consumindo `@toqe/contracts/schemas/auth`.
- Adicionar TanStack Query, design tokens, RBAC.

## Débitos identificados (não desta fase)

- 13 testes do backend falhando por problemas de DI scaffolding (pré-existente). Endereçar em fase específica de testes.
- Conversão dos demais módulos NestJS (`usuario`, `barbearia`, `agendamento`, etc.) para `nestjs-zod` — fazer incrementalmente, módulo a módulo, em PRs separados.
- Filtro global de exceções em `apps/api/src/observabilidade/sentry.filter.ts` deveria emitir o `ApiErrorPayload` padronizado de `@toqe/contracts/errors` — adicionar como item da Fase 5 (observabilidade).
