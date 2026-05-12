# 11. Fase 1 — Fundação de Tooling e Qualidade

> **Status:** em execução · **Branch:** `arch/fase-1-tooling-ci` · **PR alvo:** `feature/arquitetura-reorganizacao` · **Documento-mãe:** [`10-arquitetura-reorganizacao.md`](./10-arquitetura-reorganizacao.md).

## Objetivo

Estabelecer guarda-corpos de qualidade e CI **antes** de qualquer mudança estrutural. Tudo nesta fase é aditivo — nenhum código de feature é movido.

## Entregáveis

### 1. Hooks de pré-commit (Husky + lint-staged + commitlint)

- `.husky/pre-commit` — roda `lint-staged` (Prettier + ESLint nos arquivos staged).
- `.husky/commit-msg` — valida mensagem via `commitlint` (Conventional Commits).
- `commitlint.config.cjs` na raiz, estende `@commitlint/config-conventional`.
- `package.json` (raiz):
  - Script `prepare`: `husky` (instala hooks no `git init`).
  - Bloco `lint-staged` com targets para `*.{ts,tsx,js,jsx}` (ESLint + Prettier) e `*.{md,json,yml,yaml}` (Prettier).

**Como testar localmente:**

```bash
pnpm install         # ativa hooks
git commit -m "msg ruim"   # → bloqueado
git commit -m "chore(arch): mensagem boa"  # → passa
```

### 2. CI/CD com GitHub Actions

- `.github/workflows/ci.yml` — roda em push/PR para `main`, `feature/**`, `arch/**`:
  - Job único `quality` matricial por app: install (pnpm cache) → lint → type-check → test (apenas onde houver) → build.
  - Usa `pnpm/action-setup@v4` + `actions/setup-node@v4` com cache pnpm.
- `.github/workflows/docker.yml` — em push para `main` ou tag `v*`:
  - Build de `apps/api` e `apps/web` via `docker/build-push-action@v6` com cache de layers.
  - Push para GHCR (`ghcr.io/<org>/toqe-api`, `ghcr.io/<org>/toqe-web`).
- `.github/workflows/gitleaks.yml` — em push/PR; scan de segredos vazados.

### 3. Atualizações automáticas

- `.github/dependabot.yml` — npm (raiz + cada app/package), docker, github-actions.
  - Schedule semanal, máx 5 PRs abertos por ecossistema.
  - Agrupar atualizações `minor`/`patch` em um único PR (`groups`).

### 4. Documentação na raiz

- `ARCHITECTURE.md` (raiz) — visão geral do monorepo com diagrama Mermaid mostrando fluxo `web → nginx → api → postgres/redis` e dependências entre packages.
- `CONTRIBUTING.md` (raiz) — fluxo de branches (`feature/*`, `arch/*`, `fix/*`), Conventional Commits, padrão de PRs, como rodar localmente, como rodar os testes, como abrir issues.
- Atualizar `README.md` raiz (substituir template Turborepo padrão por descrição do projeto + quickstart).
- Atualizar `apps/web/README.md` e `apps/api/README.md` apontando para os docs.

## Arquivos a criar

```
.husky/
  pre-commit
  commit-msg
.github/
  workflows/
    ci.yml
    docker.yml
    gitleaks.yml
  dependabot.yml
commitlint.config.cjs
ARCHITECTURE.md
CONTRIBUTING.md
docs/10-arquitetura-reorganizacao.md   (já criado)
docs/11-fase-1-tooling-ci.md           (este arquivo)
```

## Arquivos a modificar

- `package.json` (raiz) — adicionar `scripts.prepare`, `lint-staged`, `devDependencies` (husky, lint-staged, @commitlint/cli, @commitlint/config-conventional, prettier).
- `README.md` (raiz) — substituir template Turborepo.
- `apps/web/README.md`, `apps/api/README.md` — link para docs centralizados.

## Critérios de aceite

- [x] Branches `feature/arquitetura-reorganizacao` e `arch/fase-1-tooling-ci` criadas.
- [ ] `pnpm install` instala hooks Husky.
- [ ] `git commit -m "foo"` (sem prefixo) é bloqueado pelo commitlint.
- [ ] `git commit -m "feat: x"` passa.
- [ ] PR aberto contra `feature/arquitetura-reorganizacao` dispara workflow `ci.yml` e fica verde.
- [ ] `gitleaks.yml` roda sem detectar segredos.
- [ ] `ARCHITECTURE.md` e `CONTRIBUTING.md` revisados pelo time.

## Próximos passos (Fase 2)

Após merge desta fase na branch-mãe:

- Criar branch `arch/fase-2-contracts`.
- Renomear `packages/validators` → `packages/contracts`.
- Introduzir `nestjs-zod` no módulo `auth` do backend.
