---
name: toqe-prisma
description: Use para mudanças Prisma/PostgreSQL no Toqe: schema, migrations, RLS, tenant context, transações, seeds, índices, Decimal e testes de integração.
---

# Toqe Prisma

## Checklist Schema

- Alterar `apps/api/prisma/schema.prisma`.
- Gerar migration SQL.
- Rodar `prisma generate`.
- Revisar `seed-runner.js` e seeds.
- Atualizar services/specs e mocks.
- Documentar impacto em `docs/` quando comportamento muda.

## Regras

- Tabelas usam prefixo `TQE_`.
- Datas persistidas como `TIMESTAMPTZ` quando timestamp.
- Tenant data exige `barCodigo`.
- Índices parciais SQL não viram unique constraints Prisma.
- Não use `upsert` baseado em índice parcial.
- `Decimal` deve ser `Prisma.Decimal` ou tipo gerado.
- Raw SQL só com tagged template.

## Validação

```bash
pnpm --filter api exec prisma generate
pnpm --filter api test
pnpm --filter api test:integration
```

Para isolamento, adicione teste com dois tenants reais.
