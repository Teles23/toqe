# 19 — Refactoring DRY / SOLID — Fase 1

**Status:** Completo  
**Branch:** `refactor/dry-fase-1`  
**Base:** `develop`

---

## Objetivo

Eliminar violações DRY identificadas no frontend — código duplicado, tipos redefinidos em múltiplos lugares e rotas de API incorretas que exigiriam manutenção paralela.

---

## Problemas encontrados

| #   | Localização                                | Problema                                                                                                |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 1   | `relatorios/services/relatorio.service.ts` | 5 endpoints usando `tenantApi` + path `/barbearia/:id/relatorios/...` — path incorreto e cliente errado |
| 2   | `agenda/types/agenda.types.ts`             | `BarbeiroAPI` definido localmente, duplicando `barbeiros/types/barbeiro.types.ts`                       |
| 3   | 7 arquivos                                 | `nome.charAt(0).toUpperCase()` repetido sem tratamento de `null`/vazio                                  |

---

## Arquivos criados

| Arquivo                            | Descrição                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `apps/web/src/shared/lib/utils.ts` | Adicionada `getInitial(nome, fallback?)` — retorna inicial maiúscula com fallback seguro |

---

## Arquivos modificados

| Arquivo                                                          | Mudança                                                                      |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/web/src/features/relatorios/services/relatorio.service.ts` | Trocou `tenantApi` por `barbeariaApi`; paths corretos sem prefixo redundante |
| `apps/web/src/features/agenda/types/agenda.types.ts`             | Removeu definição local de `BarbeiroAPI`; re-exporta de `barbeiros/types`    |
| `apps/web/src/features/barbeiros/hooks/use-barbeiros.ts`         | `charAt(0).toUpperCase()` → `getInitial()`                                   |
| `apps/web/src/features/clientes/hooks/use-clientes.ts`           | `charAt(0).toUpperCase()` → `getInitial()`                                   |
| `apps/web/src/features/agenda/hooks/use-agenda.ts`               | 3 ocorrências → `getInitial()`                                               |
| `apps/web/src/app/onboarding/page.tsx`                           | 2 ocorrências → `getInitial()`                                               |
| `apps/web/src/features/agenda/hooks/use-agenda.spec.ts`          | Fixture `BarbeiroAPI` atualizado com todos os campos obrigatórios            |

---

## Padrão após refactoring

### `getInitial()`

```ts
// shared/lib/utils.ts
export function getInitial(
  nome: string | null | undefined,
  fallback = "?",
): string {
  return (nome ?? fallback).trim().charAt(0).toUpperCase() || fallback;
}
```

Uso:

```ts
initial: getInitial(b.nome); // barbeiro
initial: getInitial(c.nome); // cliente
clientInitial: getInitial(clienteNome); // slot de agenda
```

### `BarbeiroAPI` — source of truth

```ts
// agenda/types/agenda.types.ts
export type { BarbeiroAPI } from "../../barbeiros/types/barbeiro.types";
```

### Rotas de relatório

```ts
// ANTES (errado)
tenantApi(barCodigo).get(
  `/barbearia/${barCodigo}/relatorios/faturamento?periodo=${periodo}`,
);

// DEPOIS (correto)
barbeariaApi(barCodigo).get(`/relatorios/faturamento?periodo=${periodo}`);
```

`barbeariaApi(barCodigo)` já prepende `/barbearias/:barCodigo` — não duplicar no path.

---

## Validação

```bash
pnpm --filter web lint        # 0 warnings, 0 errors
pnpm --filter web check-types # sem erros
pnpm --filter web vitest run  # 30/30 passed
```

---

## Próximas fases planejadas

| Fase   | Objetivo                                                                        |
| ------ | ------------------------------------------------------------------------------- |
| Fase 2 | Centralizar tipos de API em `@toqe/contracts`                                   |
| Fase 3 | Centralizar `formatBRL()`, `DIAS_SEMANA`, `STATUS_CONFIG`                       |
| Fase 4 | Componente `<LoadingSpinner>`, padronizar `staleTime` e convenção de `queryKey` |
