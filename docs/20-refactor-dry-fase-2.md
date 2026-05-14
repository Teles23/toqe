# 20 — Refactoring DRY / SOLID — Fase 2

**Status:** Completo  
**Branch:** `refactor/dry-fase-2`  
**Base:** `develop`

---

## Objetivo

Centralizar os tipos de resposta da API em `@toqe/contracts` — tornando o pacote o único source of truth para os shapes que o backend retorna e o frontend consome.

---

## Problema

Cada feature do frontend definia sua própria interface `*API` localmente. Se o backend mudasse um campo, o frontend precisaria ser atualizado em vários arquivos sem nenhuma garantia de sincronia.

---

## Arquivos criados

| Arquivo                                         | Descrição                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts/src/types/api-responses.ts` | Todos os shapes de resposta da API: `BarbeiroAPI`, `ClienteAPI`, `ServicoAPI`, `AgendamentoAPI`, tipos de relatório |

---

## Arquivos modificados

| Arquivo                                                     | Mudança                                                                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `packages/contracts/src/types/index.ts`                     | Re-exporta todos os tipos de `api-responses.ts`                                                             |
| `apps/web/src/features/barbeiros/types/barbeiro.types.ts`   | `BarbeiroAPI` importado de `@toqe/contracts`; mantém `Barbeiro` (UI) local                                  |
| `apps/web/src/features/clientes/types/cliente.types.ts`     | `ClienteAPI` importado de `@toqe/contracts`; mantém `Cliente` (UI) local                                    |
| `apps/web/src/features/servicos/types/servico.types.ts`     | `ServicoAPI` importado de `@toqe/contracts`                                                                 |
| `apps/web/src/features/agenda/types/agenda.types.ts`        | `AgendamentoAPI` e `BarbeiroAPI` de `@toqe/contracts`; remove re-export local anterior                      |
| `apps/web/src/features/relatorios/types/relatorio.types.ts` | Todos os tipos de relatório de `@toqe/contracts`; aliases `ServicoItem`/`BarbeiroItem` para compatibilidade |

---

## Arquitetura após Fase 2

```
@toqe/contracts
└── src/types/api-responses.ts   ← SOURCE OF TRUTH
    ├── BarbeiroAPI
    ├── ClienteAPI
    ├── ServicoAPI
    ├── AgendamentoAPI
    ├── Periodo
    ├── FaturamentoItem
    ├── AgendamentosItem
    ├── ServicoRelatorioItem
    ├── BarbeiroRelatorioItem
    └── HorarioPicoItem

apps/web/features/*/types/*.ts   ← importam de @toqe/contracts
    ├── Barbeiro (extends BarbeiroAPI + UI fields)
    ├── Cliente  (extends ClienteAPI  + UI fields)
    ├── Servico  (UI model)
    └── Slot     (UI model)
```

---

## Distinção: tipo API vs tipo UI

| Tipo          | Onde mora         | Critério                                                 |
| ------------- | ----------------- | -------------------------------------------------------- |
| `BarbeiroAPI` | `@toqe/contracts` | Shape exato retornado pela API                           |
| `Barbeiro`    | `barbeiros/types` | Adiciona campos calculados para UI (`initial`, `estado`) |
| `Slot`        | `agenda/types`    | Modelo de UI puro — não existe na API                    |

---

## Validação

```bash
pnpm --filter @toqe/contracts build  # ok
pnpm --filter web check-types        # sem erros
pnpm --filter web lint               # 0 warnings
pnpm --filter web vitest run         # 30/30 passed
pnpm --filter api test               # 76/76 passed
```
