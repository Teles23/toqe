# 13. Fase 3 — Reorganização do Frontend (feature-based pragmático)

> **Status:** em execução (sub-PR 3a entregue) · **Branch:** `arch/fase-3-frontend-piloto` · **PR alvo:** `feature/arquitetura-reorganizacao` · **Documento-mãe:** [`10-arquitetura-reorganizacao.md`](./10-arquitetura-reorganizacao.md).

## Objetivo

Migrar `apps/web` de um layout layer-based plano para **feature-based pragmático** com `src/features/<feat>/` e `src/shared/`, eliminar estilos inline duplicados, introduzir TanStack Query para data fetching, adicionar RBAC em `proxy.ts` e integrar Sentry.

Devido ao tamanho, dividimos a Fase 3 em **sub-PRs sequenciais**, cada um em uma branch própria a partir de `feature/arquitetura-reorganizacao`:

| Sub-PR | Branch                            | Escopo                                                                                               | Status       |
| ------ | --------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| 3a     | `arch/fase-3-frontend-piloto`     | Reestruturação para `src/` + TanStack Query + `shared/config` + `useAuth` separado + ESLint hygiene  | concluída #3 |
| **3b** | `arch/fase-3b-auth-feature`       | Feature piloto `auth`: `src/features/auth/{components,hooks,services,schemas}`                       | **entregue** |
| 3c     | `arch/fase-3c-rbac-sentry`        | RBAC em `proxy.ts` + componente `<RequireRole>` + Sentry SDK FE                                      | pendente     |
| 3d     | `arch/fase-3d-design-tokens`      | Design tokens consolidados em `tokens.css` + banimento de `style={{}}` via ESLint custom             | pendente     |
| 3e     | `arch/fase-3e-dashboard-refactor` | Refactor do `dashboard/page.tsx` em componentes pequenos + `useDashboardOverview()` (TanStack Query) | pendente     |

## Entregue na sub-PR 3b — feature piloto `auth`

Cria a primeira feature seguindo o layout `src/features/<feat>/` definido na 3a. Quebra o monolítico `login/page.tsx` (759 linhas) em uma página-shell de 117 linhas + componentes pequenos (~80–280 linhas cada) na feature.

### Arquivos criados em `apps/web/src/features/auth/`

```
schemas/index.ts                      # re-export de @toqe/contracts (auth)
services/auth.service.ts              # requestLogin, requestLogout, requestPasswordReset
                                      # + AuthServiceError (erro tipado)
hooks/use-login.ts                    # useMutation envolvendo useAuth().login
hooks/use-logout.ts                   # useMutation + queryClient.clear() no onSettled
hooks/use-forgot-password.ts          # useMutation chamando o stub do service
components/AuthBrandingPanel.tsx      # painel esquerdo decorativo (logo + headline + mockup live)
components/LoginForm.tsx              # form de login com react-hook-form + Zod + useLogin
components/ForgotPasswordForm.tsx     # form forgot + tela de sucesso embutida (useForgotPassword)
components/AuthErrorBanner.tsx        # banner de erro reutilizado entre formulários
```

### Página refatorada

- `src/app/(auth)/login/page.tsx` — agora **117 linhas** (era 759). Apenas:
  - layout em duas colunas;
  - alternância de modo (`login` / `forgot`) via `useState`;
  - heading dinâmico;
  - composição dos componentes da feature.

### `AuthProvider` mais magro

- `src/shared/providers/auth-provider.tsx` agora delega ao service:
  - `requestLogin({ email, senha })` em vez de `fetch` inline;
  - `requestLogout()` em vez de `fetch` inline.
- Mantém a lógica de estado global (user, barbearia, perfil, roteamento) — service e provider têm responsabilidades claras.

### Decisões de design

- **`useLogin`/`useLogout` não duplicam o AuthContext**: encapsulam `useAuth().login`/`logout` em `useMutation` para a UI consumir `isPending`/`error` ergonomicamente. Estado global continua único.
- **`useLogout` limpa o cache do TanStack Query** no `onSettled` — evita mostrar dados do usuário anterior se outro logar na mesma aba.
- **`AuthServiceError`** é uma classe de erro tipada (com `status`) que substitui o `throw new Error` genérico. Componentes podem inspecionar `err instanceof AuthServiceError`.
- **`schemas/index.ts`** é apenas re-export de `@toqe/contracts` — convenção: features não importam de packages externos diretamente; passam pela própria camada de schemas. Facilita refactor futuro.

### Validações da sub-PR 3b

| Checagem                              | Resultado       |
| ------------------------------------- | --------------- |
| `pnpm --filter web exec tsc --noEmit` | ✅              |
| `pnpm --filter web lint`              | ✅ (0 warnings) |
| `pnpm --filter web build`             | ✅ (14 rotas)   |

### Critérios de aceite (sub-PR 3b)

- [x] `src/features/auth/` existe com `components/`, `hooks/`, `services/`, `schemas/`.
- [x] `auth.service.ts` centraliza chamadas BFF; `AuthProvider` não tem mais `fetch` inline.
- [x] Hooks de mutation TanStack Query (`useLogin`, `useLogout`, `useForgotPassword`) disponíveis.
- [x] `login/page.tsx` reduzido a shell <120 linhas.
- [x] Build/lint/types verdes.
- [ ] PR aberto e mergeado.

---

## Entregue nesta sub-PR (3a)

### 1. Nova estrutura de pastas em `apps/web/`

```
apps/web/
  src/
    app/                     # rotas Next 16 (App Router) — movido de apps/web/app/
      (auth)/login/
      (dashboard)/
      api/                   # BFF (auth/login, auth/logout, auth/refresh)
      onboarding/
      layout.tsx
      page.tsx
      not-found.tsx
      globals.css
      fonts/
    shared/                  # cross-feature
      api/                   # api-client.ts (movido de lib/), query-client.ts (novo)
      components/            # page-layout, sidebar, topbar, stat-card (cross-feature)
      config/                # routes.ts, roles.ts, env.ts (novos)
      hooks/                 # use-composition, use-mobile, use-persist-fn (movidos),
                             # use-auth.ts (novo, SRP)
      lib/                   # utils.ts (cn, formatters)
      providers/             # auth-provider.tsx, theme-provider.tsx (movidos),
                             # query-provider.tsx (novo, TanStack Query)
      types/                 # reservado
      ui/                    # shadcn primitives + tokens.css (novo, placeholder)
  proxy.ts                   # middleware Next (raiz — convenção Next 16) — preservado
```

`src/features/<feat>/` será criado conforme as features forem migradas (sub-PR 3b em diante).

### 2. Movimentação preservando histórico

Renames feitos via PowerShell `Move-Item` (Bash `git mv`/`mv` falhavam por locks de fs no Windows). Git detecta como rename via heurística de similaridade — histórico de blame fica preservado.

### 3. Atualização de paths e imports

- `apps/web/tsconfig.json`: `"@/*": ["./*"]` → `"@/*": ["./src/*"]`.
- Find/replace via `sed -i -E` em 89 arquivos `.ts(x)`:
  - `@/components/ui` → `@/shared/ui`
  - `@/components/{page-layout,sidebar,topbar,stat-card}` → `@/shared/components/...`
  - `@/contexts/auth-context` → `@/shared/providers/auth-provider`
  - `@/contexts/theme-context` → `@/shared/providers/theme-provider`
  - `@/hooks/` → `@/shared/hooks/`
  - `@/lib/api-client` → `@/shared/api/api-client`
  - `@/lib/utils` → `@/shared/lib/utils`

### 4. TanStack Query

- Adicionado `@tanstack/react-query@^5.x` + `@tanstack/react-query-devtools@^5.x`.
- `src/shared/api/query-client.ts` — factory `makeQueryClient()` com defaults documentados (staleTime 30s, gcTime 5min, retry 1, sem refetchOnWindowFocus).
- `src/shared/providers/query-provider.tsx` — Provider client component com `QueryClient` instanciado via `useState(() => makeQueryClient())` para isolar por sessão (evita vazamento SSR). Devtools só em dev.
- Integrado em `src/app/layout.tsx`: ordem dos providers é `ThemeProvider → QueryProvider → AuthProvider`. `AuthProvider` consome `api-client` que poderá futuramente disparar invalidations via `QueryClient`.

### 5. Separação `useAuth` ← `AuthProvider` (SRP)

- `AuthContext` agora é exportado de `auth-provider.tsx` (era privado).
- Hook `useAuth` foi extraído para `src/shared/hooks/use-auth.ts`.
- Consumidores atualizados: `src/app/(auth)/login/page.tsx`, `src/shared/components/topbar.tsx`.

### 6. `shared/config/`

- `routes.ts` — mapa central de rotas (`ROUTES`, `PUBLIC_ROUTES`, `PRIVATE_ROUTES`, `isPublicRoute()`).
- `roles.ts` — `PERFIL`, `ROUTE_ROLES` (matriz de permissões), `canAccessRoute()`. Será consumido por `proxy.ts` no sub-PR 3c.
- `env.ts` — acesso tipado a `process.env.NEXT_PUBLIC_*`.

### 7. `shared/ui/tokens.css` (placeholder)

Arquivo criado com a convenção documentada. A consolidação dos ~2400 linhas de tokens hoje em `src/app/globals.css` será feita no sub-PR 3d junto com a regra ESLint que banirá `style={{}}` para cores/spacing.

### 8. Hygiene de ESLint e turbo.json

- `turbo.json`: adicionado `globalEnv` (`NODE_ENV`, `CI`, telemetry flags) e `env` por task (`NEXT_PUBLIC_*`, `INTERNAL_API_URL`, DB/Redis) — resolve avisos `turbo/no-undeclared-env-vars` em routes/BFF e em `query-provider.tsx`. Também adicionado task `check-types` (a Fase 4 vai usar).
- `apps/web/eslint.config.js`: regra `@typescript-eslint/no-unused-vars` configurada com `argsIgnorePattern: "^_"` etc. — convenção `_*` agora reconhecida como "intencionalmente não usado".
- `apps/web/src/app/(auth)/login/page.tsx`: removido import `registerSchema` realmente não usado.

## Arquivos criados

```
docs/13-fase-3-frontend-piloto.md
apps/web/src/shared/api/query-client.ts
apps/web/src/shared/providers/query-provider.tsx
apps/web/src/shared/hooks/use-auth.ts
apps/web/src/shared/config/routes.ts
apps/web/src/shared/config/roles.ts
apps/web/src/shared/config/env.ts
apps/web/src/shared/ui/tokens.css
```

## Arquivos movidos (rename detectado pelo Git)

```
apps/web/app/                       → apps/web/src/app/
apps/web/components/ui/             → apps/web/src/shared/ui/
apps/web/components/page-layout.tsx → apps/web/src/shared/components/page-layout.tsx
apps/web/components/sidebar.tsx     → apps/web/src/shared/components/sidebar.tsx
apps/web/components/topbar.tsx      → apps/web/src/shared/components/topbar.tsx
apps/web/components/stat-card.tsx   → apps/web/src/shared/components/stat-card.tsx
apps/web/contexts/auth-context.tsx  → apps/web/src/shared/providers/auth-provider.tsx
apps/web/contexts/theme-context.tsx → apps/web/src/shared/providers/theme-provider.tsx
apps/web/hooks/*                    → apps/web/src/shared/hooks/
apps/web/lib/api-client.ts          → apps/web/src/shared/api/api-client.ts
apps/web/lib/utils.ts               → apps/web/src/shared/lib/utils.ts
```

Pastas `apps/web/{app,components,contexts,hooks,lib}` foram removidas após o move.

## Arquivos modificados

- `apps/web/tsconfig.json` — paths.
- `apps/web/src/shared/providers/auth-provider.tsx` — `AuthContext` exportado; `useAuth` removido (movido para hook).
- `apps/web/src/app/layout.tsx` — adicionado `QueryProvider` na cadeia de providers.
- `apps/web/src/app/(auth)/login/page.tsx` — `useAuth` agora de `@/shared/hooks/use-auth`; import morto removido.
- `apps/web/src/shared/components/topbar.tsx` — `useAuth` do novo lugar.
- `apps/web/eslint.config.js` — regra `_*` ignorada.
- `apps/web/package.json` — `@tanstack/react-query` e `@tanstack/react-query-devtools`.
- `turbo.json` — `globalEnv` e `env` por task.
- ~80 arquivos `.ts(x)` em `apps/web/src/**` — imports `@/...` atualizados pelo sed.

## Validações

| Checagem                              | Resultado                                                        |
| ------------------------------------- | ---------------------------------------------------------------- |
| `pnpm --filter web exec tsc --noEmit` | ✅                                                               |
| `pnpm --filter web lint`              | ✅ (0 warnings com `--max-warnings 0`)                           |
| `pnpm --filter web build`             | ✅ (Next 16 buildou todas as 14 rotas)                           |
| `pnpm --filter api build`             | ✅                                                               |
| `pnpm --filter api exec tsc --noEmit` | ✅ (apenas erro pré-existente em `tenant.interceptor.spec.ts:5`) |

## Critérios de aceite (sub-PR 3a)

- [x] `apps/web/src/` em uso; pastas legadas removidas.
- [x] `tsconfig.json` paths atualizados; imports `@/` funcionando.
- [x] `QueryProvider` integrado no layout.
- [x] `useAuth` separado do `AuthProvider`.
- [x] `shared/config/` com routes, roles, env.
- [x] Build/lint/types verdes.
- [ ] PR aberto contra `feature/arquitetura-reorganizacao` com CI verde.

## Próximos passos

Após merge desta sub-PR:

- **3b**: criar `src/features/auth/` com `components/LoginForm`, `hooks/useLogin`/`useLogout` consumindo `@toqe/contracts`. Quebrar `src/app/(auth)/login/page.tsx` em composição de feature components.
- **3c**: RBAC server-side em `proxy.ts` lendo claim `perfil`, redirecionando conforme `ROUTE_ROLES`. Adicionar `<RequireRole>` para guarda fina. Integrar `@sentry/nextjs`.
- **3d**: consolidar design tokens em `tokens.css`; regra ESLint custom proibindo `style={{ color/background/padding/margin: ... }}`.
- **3e**: refatorar `src/app/(dashboard)/dashboard/page.tsx` (628 linhas → ~5 componentes de ~100 linhas) com dados via `useDashboardOverview()` (TanStack Query) — substituindo mocks.
