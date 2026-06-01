---
name: toqe-performance
description: Use para analisar ou melhorar performance no Toqe: queries Prisma, índices, N+1, cache React Query, bundle Next, render mobile, WebSocket, filas e load tests k6.
---

# Toqe Performance

## Backend

- Procure loops com query Prisma dentro.
- Use `select`/`include` enxutos.
- Pagine listagens.
- Confira índices para filtros (`barCodigo`, datas, status, usuário).
- Cuidado com ranges de dia e timezone `America/Sao_Paulo`.
- Jobs Bull devem carregar dados mínimos e buscar PII no DB quando necessário.

## Web

- Evite queries duplicadas.
- Use `staleTime` e invalidation específicos.
- Evite client components enormes quando Server Component basta.
- Rode bundle analyze para dependências pesadas.

## Mobile

- Evite renders em listas grandes.
- Use componentes estáveis, memoização quando comprovada.
- Cuidado com assets e módulos nativos.

## Validação

```bash
pnpm --filter web analyze
k6 run tools/load/scenarios/auth-load.js
k6 run tools/load/scenarios/agendamento-load.js
```

Para API, compare query count/latência antes e depois.
