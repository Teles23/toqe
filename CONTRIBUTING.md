# Guia de Contribuição — `toqe`

Bem-vindo(a)! Este guia padroniza como contribuímos com o monorepo. Leia antes do seu primeiro PR.

## Pré-requisitos

- **Node.js** ≥ 20 (LTS recomendado)
- **pnpm** 9.0.0 (forçado pelo `packageManager`)
- **Docker** + **Docker Compose** (para banco/Redis local)
- Git com suporte a hooks (Husky)

## Setup inicial

```bash
git clone <repo>
cd toqe
pnpm install        # instala deps e ativa Husky (script "prepare")
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d postgres redis
pnpm dev            # sobe api + web + mobile em paralelo (Turbo)
```

Para subir apenas um app:

```bash
pnpm dev:api        # NestJS em http://localhost:3000
pnpm dev:web        # Next.js em http://localhost:3001
pnpm --filter mobile dev
```

## Fluxo de branches

Modelo trunk-based com branches de feature curtas:

| Prefixo          | Quando usar                           |
| ---------------- | ------------------------------------- |
| `feature/<slug>` | Nova funcionalidade do produto.       |
| `arch/<slug>`    | Mudança arquitetural / reorganização. |
| `fix/<slug>`     | Correção de bug.                      |
| `chore/<slug>`   | Tarefas de manutenção, deps, infra.   |
| `docs/<slug>`    | Documentação isolada.                 |

**Reorganização arquitetural em curso** (ver [`docs/10-arquitetura-reorganizacao.md`](./docs/10-arquitetura-reorganizacao.md)):

- Branch-mãe: `feature/arquitetura-reorganizacao` (a partir de `feature/frontend-web`).
- Sub-branches: `arch/fase-1-tooling-ci`, `arch/fase-2-contracts`, etc.
- Cada sub-branch abre PR contra a branch-mãe; PR final da branch-mãe → `main`.

## Conventional Commits

Mensagens validadas por `commitlint` (hook `commit-msg`). Formato:

```
<type>(<scope>): <subject>

<body opcional, máx 120 chars/linha>

<footer opcional — BREAKING CHANGE, refs>
```

**Types permitidos:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

**Scopes sugeridos (não obrigatórios):** `web`, `api`, `mobile`, `contracts`, `shared`, `ui`, `config`, `infra`, `docker`, `ci`, `docs`, `arch`, `deps`.

Exemplos:

```
feat(web): adicionar página de relatórios mensais
fix(api): corrigir refresh token rotation
chore(arch): scaffolding fase 1 (Husky, CI, gitleaks)
docs(arch): atualizar status da fase 2
```

## Hooks de pré-commit

- `pre-commit` → roda `lint-staged` (Prettier nos arquivos staged).
- `commit-msg` → valida mensagem via `commitlint`.

Para emergência (uso muito raro): `git commit --no-verify`. Justifique no PR.

## Padrão de Pull Request

- **Título** segue Conventional Commits (igual à mensagem do commit principal).
- **Descrição** deve conter:
  - O que mudou e por quê.
  - Como testar (passos manuais ou comando de teste).
  - Screenshots / GIFs para UI.
  - Links para issues, docs ou tickets relacionados.
- **Checklist:**
  - [ ] CI verde (lint, type-check, tests).
  - [ ] Documentação atualizada quando aplicável (`docs/`, `README.md`, `ARCHITECTURE.md`).
  - [ ] Sem `console.log` ou TODOs sem owner.
  - [ ] Sem segredos commitados (`gitleaks` deve passar).

## Rodando lint, types, tests

```bash
pnpm lint           # ESLint em todos os apps
pnpm check-types    # tsc --noEmit em todos os workspaces
pnpm --filter api test
pnpm --filter api test:cov
pnpm --filter api test:e2e
pnpm format         # Prettier
```

## Padrões de código

- **TypeScript strict** em todos os workspaces.
- **Composition over inheritance**; SRP nas funções/componentes.
- **Frontend**: hooks por entidade (`useUsuario`, `useAgenda`), services em `features/<feat>/services/`, primitivos em `shared/ui/`. Sem `style={{}}` para cores/spacing — use tokens.
- **Backend**: cada feature em um módulo NestJS; controller magro; lógica em services; DTOs com `nestjs-zod` (após Fase 2).
- **Schemas Zod** em `packages/contracts` são a fonte da verdade — backend (via `nestjs-zod`) e frontend importam direto.

## Reportando bugs

Abra issue com:

- Passos para reproduzir.
- Comportamento esperado vs. observado.
- Versão do app/branch.
- Logs ou screenshots relevantes.

## Segurança

- **Não commite** `.env`, credenciais, chaves privadas. `gitleaks` roda em todo push/PR.
- Reporte vulnerabilidades em particular para o mantenedor antes de abrir issue pública.

## Dúvidas?

Consulte [`docs/`](./docs/) ou abra uma discussion no repo.
