---
name: toqe-nextjs
description: Use para trabalhar no app web Next.js do Toqe: App Router, BFF route handlers, React Query, MSW, Tailwind, shadcn/Radix, auth, dashboards e E2E Playwright.
---

# Toqe Next.js

## Padrões

- App Router em `apps/web/src/app`.
- Features em `apps/web/src/features/<feature>`.
- Shared UI/API/providers em `apps/web/src/shared`.
- Auth usa BFF route handlers e cookies httpOnly.
- Requests client-side passam por `src/shared/api/api-client.ts`.
- Route handlers server-side usam `src/app/api/_lib/internal-api.ts`.
- Data fetching via TanStack Query.
- Testes com Vitest + MSW.

## UI

- Use Tailwind/tokens/CVA.
- Evite `style={{}}` novo para cores/spacing/tipografia.
- Respeite componentes Radix/shadcn existentes.
- Teste acessibilidade básica e estados loading/error/empty.

## Validação

```bash
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
pnpm --filter web test:e2e
```

Use Playwright para login, agendamento, pagamentos, configurações e fluxos críticos.
