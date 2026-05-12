# 13. Fase 3 — Reorganização do Frontend (feature-based pragmático)

> **Status:** em execução (sub-PR 3a entregue) · **Branch:** `arch/fase-3-frontend-piloto` · **PR alvo:** `feature/arquitetura-reorganizacao` · **Documento-mãe:** [`10-arquitetura-reorganizacao.md`](./10-arquitetura-reorganizacao.md).

## Objetivo

Migrar `apps/web` de um layout layer-based plano para **feature-based pragmático** com `src/features/<feat>/` e `src/shared/`, eliminar estilos inline duplicados, introduzir TanStack Query para data fetching, adicionar RBAC em `proxy.ts` e integrar Sentry.

Devido ao tamanho, dividimos a Fase 3 em **sub-PRs sequenciais**, cada um em uma branch própria a partir de `feature/arquitetura-reorganizacao`:

| Sub-PR | Branch                            | Escopo                                                                                               | Status       |
| ------ | --------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| 3a     | `arch/fase-3-frontend-piloto`     | Reestruturação para `src/` + TanStack Query + `shared/config` + `useAuth` separado + ESLint hygiene  | concluída #3 |
| 3b     | `arch/fase-3b-auth-feature`       | Feature piloto `auth`: `src/features/auth/{components,hooks,services,schemas}`                       | concluída #4 |
| 3c     | `arch/fase-3c-rbac-sentry`        | `proxy.ts` consumindo `shared/config` + componente `<RequireRole>` + Sentry SDK FE                   | concluída #5 |
| **3d** | `arch/fase-3d-design-tokens`      | Design tokens centralizados em `tokens.css` + ESLint custom proibindo `style={{}}` (legacy excluída) | **entregue** |
| 3e     | `arch/fase-3e-dashboard-refactor` | Refactor do `dashboard/page.tsx` em componentes pequenos + `useDashboardOverview()` (TanStack Query) | pendente     |

## Entregue na sub-PR 3d — design tokens centralizados + ESLint contra `style={{}}`

### 1. `tokens.css` agora é a source of truth

- Bloco `:root` com todos os tokens (`--bg-base`, `--text-primary`, `--status-success`, `--font-heading`, `--shadow-lg`, `--ease-snappy`, mapeamento shadcn/Radix etc.) foi movido de `src/app/globals.css` para `apps/web/src/shared/ui/tokens.css`.
- `src/app/globals.css` passa a importar via `@import "../shared/ui/tokens.css";` logo após `@import "tailwindcss"`. Variáveis ficam disponíveis para o bloco `@theme inline` e para todos os componentes.
- Cabeçalho do `tokens.css` documenta as regras: nada hardcoded; novos tokens vão lá; mudar a paleta = mudar só esse arquivo.

### 2. Regra ESLint `no-restricted-syntax` banindo `style={{}}` em código novo

Adicionada em `apps/web/eslint.config.js`:

```js
{
  selector: "JSXAttribute[name.name='style']",
  message: "Evite style={{ ... }} inline. Use classes Tailwind ou CVA. Tokens em src/shared/ui/tokens.css."
}
```

Aplicada como **error** em `src/**/*.tsx`. Para não bloquear o build enquanto a migração acontece, há um override `"off"` para arquivos **legados**:

```
src/app/page.tsx
src/app/not-found.tsx
src/app/(auth)/login/page.tsx
src/app/(dashboard)/**/*.tsx
src/app/onboarding/page.tsx
src/shared/components/{page-layout,sidebar,stat-card,topbar}.tsx
src/shared/ui/**/*.tsx                            # shadcn primitives — permitidos
src/features/auth/components/**/*.tsx             # criados na 3b com inline styles
```

**Plano de pagamento da dívida:**

- Sub-PR **3e** vai remover `src/app/(dashboard)/dashboard/page.tsx` da lista (refactor + migração para classes).
- **Fase 4** vai remover as demais pages do dashboard e os components em `src/shared/components/`.
- `src/shared/ui/**` provavelmente permanece (shadcn precisa de `style` para variantes dinâmicas como chart/progress/slider).
- `src/features/auth/components/**` será migrado quando estabilizar.

### 3. Verificação da regra

Teste manual confirmou: criar `<div style={{ color: "red" }}>` em `src/features/_test/Sample.tsx` (fora dos overrides) faz o `pnpm --filter web lint` falhar com a mensagem documentada. Removido após o teste.

### Validações da sub-PR 3d

| Checagem                              | Resultado                                                            |
| ------------------------------------- | -------------------------------------------------------------------- |
| `pnpm --filter web exec tsc --noEmit` | ✅                                                                   |
| `pnpm --filter web lint`              | ✅ (0 warnings com `--max-warnings 0`)                               |
| `pnpm --filter web build`             | ✅ (14 rotas, CSS resolvido via `@import "../shared/ui/tokens.css"`) |
| Smoke test da regra ESLint            | ✅ (dispara em código novo fora da lista de overrides)               |

### Critérios de aceite (sub-PR 3d)

- [x] `tokens.css` contém o bloco `:root` completo (source of truth).
- [x] `globals.css` importa `tokens.css` e mantém só `@theme inline` + `@layer base/components` + keyframes.
- [x] Regra ESLint contra `style={{}}` ativa para código novo.
- [x] Lista de legados documentada com TODO de pagamento.
- [x] Build/lint/types verdes.
- [ ] PR aberto e mergeado.

---

## Entregue na sub-PR 3c — RBAC + Sentry FE

### 1. `proxy.ts` consome `shared/config`

`apps/web/proxy.ts` foi refatorado para usar `isPublicRoute()` de `@/shared/config/routes` (em vez de listas duplicadas). Mantém **autenticação** (presença do cookie `access_token`) como única verificação server-side.

**Decisão de design — sem RBAC no proxy:** o `perfil` do usuário é por-barbearia (multi-tenant) e **não está no JWT** (o payload atual é só `{ sub: codigo }`). Em vez de inflar o token com perfis que ficariam stale ao trocar barbearia, fazemos RBAC client-side via `<RequireRole>` lendo `useAuth().perfil` (sempre sincronizado com a barbearia ativa). Comentário detalhado no próprio `proxy.ts`.

### 2. `<RequireRole>` — guarda client-side por perfil

`apps/web/src/shared/components/RequireRole.tsx` — guarda de UX por perfil:

- Lê `useAuth()` (`perfil` + `loading`).
- Compara contra `roles` (array de `Perfil`).
- Enquanto `loading`, renderiza `fallback` (default `null`).
- Autorizado: renderiza `children`.
- Não autorizado: `router.replace(redirectTo)` em `useEffect` (default `/dashboard`); ou apenas `fallback` se `redirectTo === null`.

Uso:

```tsx
import { RequireRole } from "@/shared/components/RequireRole";
import { Perfil } from "@/shared/config/roles";

export default function ConfiguracoesPage() {
  return (
    <RequireRole roles={[Perfil.SUPER_ADMIN, Perfil.DONO]}>
      <ConfiguracoesUI />
    </RequireRole>
  );
}
```

### 3. `shared/config/roles.ts` alinhado com `@toqe/shared`

`roles.ts` agora **re-exporta** o enum `Perfil` de `@toqe/shared` (single source of truth) em vez de definir um próprio com valores diferentes — corrige incompatibilidade de tipos entre `useAuth().perfil` e `ROUTE_ROLES`. Matriz `ROUTE_ROLES` atualizada com os perfis reais do enum (`SUPER_ADMIN`, `DONO`, `GERENTE`, `BARBEIRO`, `RECEPCIONISTA`, `CLIENTE`).

### 4. Sentry SDK (`@sentry/nextjs`)

- `@sentry/nextjs@^8.x` instalado em `apps/web`.
- `instrumentation.ts` (Next 16 hook) carrega `sentry.server.config.ts` (runtime nodejs) ou `sentry.edge.config.ts` (runtime edge).
- `instrumentation-client.ts` inicializa o SDK no browser, com `Sentry.captureRouterTransitionStart` exportado como `onRouterTransitionStart` para instrumentar transições de rota do App Router.
- Todos os configs são **no-op** se `NEXT_PUBLIC_SENTRY_DSN` não estiver definido — evita ruído em dev sem configuração.
- `next.config.js` envolto com `withSentryConfig(...)`. Source map upload opt-in via `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` (campos comentados, prontos para descomentar quando o projeto Sentry estiver provisionado).

### 5. Hygiene

- `turbo.json`: `NEXT_RUNTIME` adicionado ao `globalEnv`; `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` no `env` do task `build`.
- `apps/web/eslint.config.js`: bloco específico para arquivos de config/instrumentation (`*.{js,mjs,cjs}`, `instrumentation*.ts`, `sentry.*.config.ts`) com globals do Node.js (`process`, `Buffer`, etc.).
- `apps/web/README.md`: seção "Proteção de rotas" atualizada com 2 níveis (proxy + RequireRole); seção "Observabilidade" adicionada documentando Sentry.

### Validações da sub-PR 3c

| Checagem                              | Resultado                                    |
| ------------------------------------- | -------------------------------------------- |
| `pnpm --filter web exec tsc --noEmit` | ✅                                           |
| `pnpm --filter web lint`              | ✅ (0 warnings)                              |
| `pnpm --filter web build`             | ✅ (14 rotas, withSentryConfig sem warnings) |

### Critérios de aceite (sub-PR 3c)

- [x] `proxy.ts` consome `isPublicRoute()` (sem listas duplicadas).
- [x] `<RequireRole>` disponível e documentado.
- [x] `Perfil` único entre `useAuth` e `roles.ts`.
- [x] Sentry SDK instalado e configurado (no-op sem DSN).
- [x] Build/lint/types verdes.
- [ ] PR aberto e mergeado.

---

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
