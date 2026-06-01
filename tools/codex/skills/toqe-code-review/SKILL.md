---
name: toqe-code-review
description: Use para revisar mudanças no monorepo Toqe antes de commit ou PR, priorizando bugs, regressões, segurança multi-tenant, sincronização API-Web-Mobile, testes reais e ausência de bypass.
---

# Toqe Code Review

## Workflow

1. Leia `AGENTS.md`, `ARCHITECTURE.md` e `docs/INDEX.md`.
2. Inspecione `git status --short`, `git diff --stat`, `git diff` e `git diff --staged`.
3. Para cada arquivo tocado, leia o código ao redor e o teste correspondente.
4. Priorize achados por severidade, com arquivo e linha.

## Checklist

- Sem `@ts-ignore`, `@ts-expect-error`, `any` casting, `eslint-disable` indevido, `.skip`, `--passWithNoTests`.
- Contratos API alterados propagam para `packages`, web, mobile e testes.
- Queries Prisma de tenant filtram por `barCodigo` ou usam tenant context.
- Clientes só acessam dados próprios; staff exige RBAC explícito.
- Testes importam código real e cobrem sucesso, erro, edge cases, permissões e dados ausentes.
- Mudança Prisma inclui migration, seed review e specs.
- UI preserva `testID` e rotas/navegação esperadas.

## Validação

Rode checks afetados. Para revisão completa:

```bash
pnpm lint
pnpm check-types
pnpm --filter api test
pnpm --filter web test
pnpm --filter mobile test
```

## Formato

Responda com:

- Achados primeiro, por severidade.
- Perguntas/assunções.
- Checks executados.
- Veredito: `APROVADO`, `APROVADO COM RESSALVAS` ou `BLOQUEADO`.
