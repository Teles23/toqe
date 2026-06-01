# Codex Operacional

**Status:** Ativo | **Base:** develop | **Criado em:** 2026-06-01

Este documento define workflows para agentes Codex trabalharem no Toqe sem perder contexto de arquitetura, segurança, multi-tenancy e testes. Use junto com `AGENTS.md`, `ARCHITECTURE.md` e `docs/INDEX.md`.

## Objetivo

Padronizar como agentes analisam, implementam, validam e entregam mudanças neste monorepo SaaS multi-tenant:

- API NestJS com Prisma/Postgres/Redis.
- Web Next.js com BFF, React Query e MSW.
- Mobile Expo Router com SecureStore e módulos nativos.
- Pacotes compartilhados `@toqe/contracts` e `@toqe/shared`.

## Workflow Base

1. Ler `AGENTS.md`.
2. Ler `ARCHITECTURE.md` e `docs/INDEX.md`.
3. Identificar domínio tocado e ler docs específicas.
4. Mapear arquivos afetados com `rg`/`rg --files`.
5. Checar worktree com `git status --short`.
6. Preservar mudanças locais existentes.
7. Implementar mudança mínima coerente com padrões locais.
8. Atualizar testes e documentação quando comportamento muda.
9. Rodar validação seletiva e registrar resultado.

## Workflows Por Tipo De Tarefa

### Bugfix API

Leia controller, service, DTO, guards e specs do módulo. Confirme rota real no controller.

Validação mínima:

```bash
pnpm --filter api lint
pnpm --filter api test -- <arquivo-ou-padrão>
pnpm --filter api test
```

Adicione integração/security quando o bug envolver:

- autenticação/autorização;
- isolamento de tenant;
- pagamento/webhook;
- agendamento/slots/conflito;
- fila/walk-in;
- fidelidade/pontos;
- schema Prisma.

### Novo Endpoint ou Contrato

Ordem recomendada:

1. `packages/contracts` ou `packages/shared` se houver tipo compartilhado.
2. API DTO/controller/service/spec.
3. Web service/hook/MSW/spec.
4. Mobile hook/tela/spec.
5. Docs com rota, body, response e erros.

Validação:

```bash
pnpm --filter api test
pnpm --filter web test
pnpm --filter mobile test
pnpm check-types
```

### Mudança Prisma

Checklist:

- `schema.prisma` modificado.
- Migration SQL gerada.
- Prisma client gerado.
- Seeds e `seed-runner.js` revisados.
- Services/specs atualizados.
- Tests com banco real se regra crítica.

Validação:

```bash
pnpm --filter api exec prisma generate
pnpm --filter api test
pnpm --filter api test:integration
```

### Web Next.js

Leia a página em `src/app`, a feature em `src/features` e o client/hook usado.

Padrões:

- BFF route handlers para auth/cookies.
- `INTERNAL_API_URL` via `src/app/api/_lib/internal-api.ts`.
- React Query para dados.
- MSW para testes de hook/component.
- Tailwind/tokens em vez de inline style novo.

Validação:

```bash
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web test
```

Playwright se fluxo crítico de usuário mudar.

### Mobile Expo

Leia `docs/mobile-navegacao.md`, layout do grupo de rota, provider/hook e teste da tela.

Padrões:

- Preserve `testID`.
- Esconda rotas auxiliares em tabs com `href: null`.
- SecureStore para tokens.
- Defensivo com módulos nativos quando runtime pode não estar linkado.
- Rebuild development build quando dependência nativa muda.

Validação:

```bash
pnpm --filter mobile lint
pnpm --filter mobile type-check
pnpm --filter mobile test -- --runInBand --forceExit --runTestsByPath <spec>
```

Maestro se fluxo E2E mobile mudar.

### Segurança

Procure:

- endpoint sem guard;
- role ausente;
- ownership ausente para cliente;
- query Prisma sem `barCodigo`;
- raw SQL inseguro;
- webhook fail-open;
- env sensível em `NEXT_PUBLIC_*` ou `EXPO_PUBLIC_*`;
- PII em logs, Redis, push payload ou resposta pública.

Validação:

```bash
pnpm audit --prod --audit-level=high
pnpm --filter api test:security
```

### Refactor

Refactor precisa preservar comportamento observável.

Regras:

- Primeiro identifique testes existentes.
- Evite alterar contrato público no mesmo PR.
- Não misture refactor com feature.
- Rode testes antes e depois quando possível.
- Se extrair helper, teste pelo consumidor real ou por helper exportado quando apropriado.

### Performance

Backend:

- detectar N+1 em loops com Prisma;
- usar `select` enxuto;
- validar índices para filtros comuns;
- paginar listagens;
- cuidar de datas/fuso.

Web/mobile:

- reduzir renders e queries duplicadas;
- usar stale/cache apropriado;
- evitar assets pesados;
- verificar bundle quando mexer em libs.

Validação adicional:

```bash
pnpm --filter web analyze
k6 run tools/load/scenarios/<cenario>.js
```

## Validação Inteligente Por Diff

Use `scripts/quality/affected-checks.js` para listar checks recomendados a partir dos arquivos alterados.

Exemplos:

```bash
node scripts/quality/affected-checks.js
node scripts/quality/affected-checks.js --base HEAD~1
```

Categorias:

| Arquivo alterado                | Checks sugeridos                                                 |
| ------------------------------- | ---------------------------------------------------------------- |
| `apps/api/**`                   | API lint, type, unit; integration/security se auth/tenant/prisma |
| `apps/web/**`                   | Web lint, type, vitest; Playwright se e2e/rotas críticas         |
| `apps/mobile/**`                | Mobile lint, type, Jest                                          |
| `packages/contracts/**`         | API + Web + Mobile type/tests                                    |
| `packages/shared/**`            | API + Web + Mobile type/tests                                    |
| `prisma/schema.prisma`          | Prisma generate, API unit/integration                            |
| `.github/**`, `docker-compose*` | CI/infra review, build se aplicável                              |

## Subagents

Estrutura recomendada:

- `toqe-reviewer`: revisa diff, roda checks e dá veredito.
- `toqe-contract-sync`: propaga contrato em API, web, mobile e packages.
- `toqe-security-auditor`: foca auth, tenant, secrets, raw SQL, webhooks.
- `toqe-prisma-guardian`: schema, migrations, seeds, transactions e indexes.
- `toqe-nest-api`: módulos NestJS, DTOs, guards, queues e Swagger.
- `toqe-web-next`: App Router, BFF, React Query, Tailwind e MSW.
- `toqe-mobile-expo`: Expo Router, SecureStore, native modules e Jest Expo.
- `toqe-test-gap-closer`: integração, security, Playwright, Maestro e k6.
- `toqe-performance-analyst`: queries, rendering, cache, bundle e load.
- `toqe-docs-maintainer`: docs, decisões e onboarding técnico.

## Convenções De Commits

Formato:

```text
<type>(<scope>): <descrição em português no imperativo>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Scopes comuns: `api`, `web`, `mobile`, `contracts`, `shared`, `prisma`, `security`, `infra`, `ci`, `docs`.

Exemplos:

```text
fix(mobile): esconder rotas internas da tab cliente
feat(api): adicionar endpoint de transferência de agendamento
test(security): cobrir isolamento de tenant em slots
docs(codex): documentar workflows operacionais
```

## Automação Codex Recomendada

- Checklist automático por diff antes de finalizar tarefa.
- Scanner local de bypass: `eslint-disable`, `any`, `skip`, raw unsafe.
- Sugestão de testes relevantes por arquivo alterado.
- Geração de resumo de PR com arquivos, riscos, validação e pendências.
- Skill `toqe-contract-sync` sempre que contrato/API mudar.
- Skill `toqe-security` sempre que tocar auth, tenant, payment, webhook, API keys ou Prisma raw.

## Riscos Técnicos Atuais

- Documentação histórica extensa: sempre verificar código atual antes de confiar em doc antigo.
- `CLAUDE.md` contém regras úteis, mas era específico de outro agente; `AGENTS.md` é a referência Codex.
- Testes Expo/Jest podem exigir `--forceExit`; isso indica handles abertos e merece saneamento futuro.
- Muitos `eslint-disable-next-line no-restricted-syntax` no web por inline styles dinâmicos; manter rastreado e não expandir sem necessidade.
- Mudanças em packages compartilhados têm blast radius alto e exigem validação nos três apps.
- Mobile com módulos nativos exige distinguir Expo Go, development build e APK antigo.

## Handoff Final

Ao terminar uma tarefa, reporte:

- objetivo atendido;
- arquivos alterados;
- validação executada;
- validação não executada e motivo;
- riscos residuais;
- necessidade de migration, rebuild nativo, env ou deploy.
