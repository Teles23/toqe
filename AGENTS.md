# AGENTS.md — Toqe

Guia operacional para agentes Codex trabalhando neste monorepo. O Toqe é um SaaS multi-tenant para barbearias com API NestJS, Web Next.js, Mobile Expo e pacotes compartilhados.

## Leitura Obrigatória

Antes de implementar, leia:

1. `ARCHITECTURE.md` — visão de stack, módulos, fluxo de dados e decisões ativas.
2. `docs/INDEX.md` — mapa de documentação por domínio.
3. O doc do domínio tocado, por exemplo:
   - Auth: `docs/mobile-auth.md`, `docs/31-auth-google.md`, `docs/82-auditoria-seguranca.md`, `docs/83-auditoria-seguranca-rounds-2-3.md`
   - Agendamento/agenda: `docs/28-funcionalidade-novo-agendamento.md`, `docs/61-jornada-semanal-transacional.md`, `docs/76-fuso-agenda-saopaulo.md`
   - Mobile: `docs/mobile-setup.md`, `docs/mobile-navegacao.md`, `docs/mobile-design-system.md`
   - Testes: `docs/18-testes.md`, `docs/64-testes-codigo-real-lote-1.md` a `docs/67-testes-codigo-real-lote-5.md`
   - Segurança: `docs/82-auditoria-seguranca.md`, `docs/83-auditoria-seguranca-rounds-2-3.md`

Nunca afirme comportamento sem ler o arquivo-fonte relevante nesta sessão. Para rotas, leia controller/route handler. Para env vars, leia o código consumidor. Para CI, leia o YAML.

## Stack e Organização

- Raiz: pnpm 9 workspaces + Turborepo.
- `apps/api`: NestJS 11, Prisma 7, Postgres 16, Redis/Bull, JWT, RBAC, Swagger, Pino, Sentry.
- `apps/web`: Next.js 16 App Router, React 19, Tailwind 4, Radix/shadcn, TanStack Query, Vitest/MSW, Playwright.
- `apps/mobile`: Expo 54, React Native 0.81, Expo Router 6, TanStack Query, SecureStore, Jest Expo.
- `packages/contracts`: schemas Zod e tipos compartilhados; fonte preferencial para contratos.
- `packages/shared`: enums, DTOs e tipos de domínio.
- `packages/config`: helpers/configuração compartilhada.

## Regras Inegociáveis

- Preserve mudanças locais existentes. Nunca reverta arquivo que você não alterou sem pedido explícito.
- Não use comandos destrutivos (`git reset --hard`, `git checkout --`, `rm`) sem autorização explícita.
- Não commite segredos, tokens, `.env` reais ou credenciais.
- Não use bypass para passar validação: `@ts-ignore`, `@ts-expect-error`, `any` casting, `eslint-disable` indevido, `--passWithNoTests`, `it.skip`, `describe.skip`.
- Testes devem importar o código real. Não duplique lógica da implementação dentro do spec.
- Se corrigir bug, adicione ou atualize teste que falharia antes da correção.
- Mudança de comportamento deve atualizar documentação em `docs/` quando for relevante para futuro desenvolvimento.

## Multi-Tenant e Segurança

O risco principal é vazamento cross-tenant. Ao tocar API, web ou mobile:

- Rotas autenticadas de tenant devem receber/propagar `x-tenant-id` ou `barCodigo` validado.
- Queries Prisma de dados de tenant devem filtrar por `barCodigo` ou executar dentro de tenant context quando aplicável.
- Clientes com perfil `cliente` precisam de ownership check em dados próprios.
- Staff (`dono`, `gerente`, `barbeiro`, `recepcionista`) precisa de RBAC explícito.
- Super admin não deve virar bypass universal de tenant fora do painel `/admin`.
- Raw SQL deve usar tagged template (`$executeRaw`) e nunca interpolação insegura.
- Webhooks e integrações devem falhar fechados quando secret/config obrigatória estiver ausente.

## Prisma

Ao alterar `apps/api/prisma/schema.prisma`:

1. Gere migration SQL.
2. Rode ou documente `prisma generate`.
3. Revise `apps/api/prisma/seed-runner.js` e seeds afetados.
4. Atualize services/specs que dependem dos tipos gerados.
5. Nunca use `upsert` baseado em índice parcial SQL; Prisma não expõe índice parcial como compound unique.
6. Tipos `Decimal` devem usar `Prisma.Decimal` ou `Prisma.XxxGetPayload`, não duck typing.

## Contratos API ↔ Web ↔ Mobile

Qualquer novo endpoint, DTO ou response shape deve ser sincronizado:

- API: controller/service/DTO + teste Jest.
- `packages/contracts` ou `packages/shared`: schema/tipo compartilhado quando aplicável.
- Web: client/hook/service + MSW handler + spec Vitest/componente.
- Mobile: api-client/hook/tela + mock/spec Jest Expo.
- E2E Playwright/Maestro quando fluxo de usuário crítico muda.

Entregar só um consumidor atualizado é incompleto.

## Frontend Web

- Preferir estrutura `src/features/<feature>/{components,hooks,services,types}` e `src/shared/*`.
- Data fetching via TanStack Query e cliente central `src/shared/api/api-client.ts`.
- BFF route handlers usam `src/app/api/_lib/internal-api.ts`; `INTERNAL_API_URL` é obrigatório em produção.
- Evitar `style={{}}` novo para cores/spacing/tipografia; usar Tailwind, CVA e tokens. Exceções existentes devem permanecer rastreáveis.
- Rotas admin são privadas; manter `RequireSuperAdmin` e proteção no proxy/config.

## Mobile

- Expo Router com grupos `(auth)`, `(cliente)`, `(barbeiro)` e `convite`.
- Tabs devem declarar e esconder rotas auxiliares com `href: null` quando não devem aparecer na barra.
- Tokens sensíveis ficam em SecureStore; nunca AsyncStorage.
- Google Sign-In exige development build; não funciona corretamente no Expo Go.
- Módulos nativos (`expo-notifications`, Google Sign-In, MMKV) precisam de fallback defensivo quando o runtime pode não tê-los linkados.
- Preserve `testID`s existentes em telas testadas.
- Use `useTheme()` e componentes `src/shared/ui` antes de hardcode visual.

## Comandos de Validação

Validação geral:

```bash
pnpm lint
pnpm check-types
pnpm build
```

API:

```bash
pnpm --filter api lint
pnpm --filter api test
pnpm --filter api test:integration
pnpm --filter api test:security
```

Web:

```bash
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
pnpm --filter web test:e2e
```

Mobile:

```bash
pnpm --filter mobile lint
pnpm --filter mobile type-check
pnpm --filter mobile test
pnpm --filter mobile test:e2e
```

Segurança e dependências:

```bash
pnpm audit --prod --audit-level=high
```

Use validação seletiva durante desenvolvimento, mas antes de PR/commit relevante rode os checks afetados com rigor.

## Matriz de Impacto

| Mudança                           | Verificar                                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| `apps/api/src/**/*.controller.ts` | DTO, guards, Swagger, unit spec, consumers web/mobile            |
| `apps/api/src/**/*.service.ts`    | Prisma tenant scope, unit spec, integração se regra crítica      |
| `packages/contracts/src/**`       | serializers/API, MSW, hooks web, mobile, fixtures                |
| `packages/shared/src/**`          | enums/tipos usados em web/mobile/API                             |
| `schema.prisma`                   | migration, generate, seed, Prisma mocks, tests                   |
| Web hook/service                  | MSW handler e spec                                               |
| Mobile hook/tela                  | Jest Expo spec, testID, runtime nativo                           |
| Auth/security/payment/tenant      | security test ou integração real                                 |
| UI visual                         | docs/design system se padrão muda, screenshots quando solicitado |

## Commits e PR

- Conventional Commits: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Scopes comuns: `api`, `web`, `mobile`, `contracts`, `shared`, `infra`, `ci`, `docs`, `security`, `prisma`.
- Não criar branch nem commit sem pedido explícito.
- PR deve listar o que mudou, como validar, riscos e screenshots/GIFs quando UI.

## Subagents Recomendados

- `toqe-reviewer`: revisão final de diff.
- `toqe-contract-sync`: endpoints/contratos API-Web-Mobile.
- `toqe-security-auditor`: auth, tenant, secrets, raw SQL, webhooks.
- `toqe-prisma-guardian`: schema, migrations, seeds, transactions.
- `toqe-web-next`: App Router, BFF, React Query, Tailwind.
- `toqe-mobile-expo`: Expo Router, native modules, SecureStore, Jest Expo.
- `toqe-nest-api`: controllers, services, DTOs, guards, queues.
- `toqe-test-gap-closer`: integração, security, E2E, load.
- `toqe-performance-analyst`: N+1, bundle, render, cache, indexes.
- `toqe-docs-maintainer`: documentação operacional e histórico de decisão.

## Ao Finalizar Uma Tarefa

Informe:

- Arquivos alterados.
- Comandos executados e resultado.
- Riscos residuais ou testes não executados.
- Se há necessidade de rebuild nativo mobile, migration Prisma ou atualização de env.
