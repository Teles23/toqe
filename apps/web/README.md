# @toqe/web

Frontend Next.js 16 (App Router, RSC) do `toqe`.

> Para visão geral do monorepo, ver [`/README.md`](../../README.md). Para arquitetura, ver [`/ARCHITECTURE.md`](../../ARCHITECTURE.md). Para a reorganização em curso, ver [`/docs/10-arquitetura-reorganizacao.md`](../../docs/10-arquitetura-reorganizacao.md).

## Stack

- **Next.js 16.2** (App Router, React Server Components)
- **React 19**
- **Tailwind CSS 4** + **shadcn/ui** + **Radix UI**
- **Framer Motion** (animações)
- **react-hook-form** + **Zod** (forms)
- **`@toqe/validators`** (schemas compartilhados — será `@toqe/contracts` na Fase 2)
- TanStack Query (a ser introduzido na Fase 3)

## Como rodar

```bash
# Da raiz do monorepo
pnpm install
pnpm dev:web          # http://localhost:3001
```

Ou diretamente:

```bash
pnpm --filter web dev
```

## Estrutura atual (será reorganizada na Fase 3)

```
app/                  # rotas Next (App Router)
  (auth)/login/
  (dashboard)/
  onboarding/
components/           # UI library (shadcn) + componentes business
contexts/             # AuthContext, ThemeContext
hooks/                # custom hooks
lib/                  # api-client.ts, utils.ts
proxy.ts              # middleware Next 16 (proteção de rotas privadas)
```

**Estrutura-alvo (Fase 3):** ver `/docs/13-fase-3-frontend-piloto.md` (a ser criado).

## Variáveis de ambiente

Ver `/.env.example` na raiz. Principais:

- `NEXT_PUBLIC_API_URL` — URL do backend (`http://localhost:3000/api/v1` em dev).
- `NEXT_PUBLIC_SENTRY_DSN` — DSN do Sentry (Fase 3).

## Scripts

```bash
pnpm --filter web dev          # next dev --port 3001
pnpm --filter web build        # build de produção
pnpm --filter web start        # next start
pnpm --filter web lint         # ESLint
pnpm --filter web check-types  # tsc --noEmit
```

## Proteção de rotas

`proxy.ts` (convenção Next 16; equivale ao antigo `middleware.ts`) protege as rotas em `(dashboard)/*` validando o cookie `access_token`. RBAC por `perfil` será adicionado na Fase 3.

## Convenções

- **Sem `style={{ }}` para cores/spacing** — usar Tailwind classes ou design tokens (Fase 3).
- **Validação** via schemas Zod compartilhados em `@toqe/validators`.
- **Forms** com `react-hook-form` + `zodResolver`.

Veja [`/CONTRIBUTING.md`](../../CONTRIBUTING.md) para mais detalhes.
