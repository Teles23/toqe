# 22 — Refactoring DRY / SOLID — Fase 4

**Status:** Completo  
**Branch:** `refactor/dry-fase-4`  
**Base:** `develop`

---

## Objetivo

Eliminar padrão de loading duplicado em 4 views, centralizar `staleTime` como constantes nomeadas e padronizar `queryKey` para convenção nested em todos os hooks.

---

## Problemas encontrados

| #   | Problema                                                                                           | Locais                                                        |
| --- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | Bloco `<div>Carregando...</div>` de 8 linhas repetido identicamente                                | `AgendaView`, `BarbeirosView`, `ClientesView`, `ServicosView` |
| 2   | Magic numbers `10_000`, `30_000`, `60_000` espalhados sem semântica                                | 7 hooks                                                       |
| 3   | `queryKey` com strings flat inconsistentes (`"barbeiros-detail"`, `"relatorios-faturamento"`)      | 7 hooks                                                       |
| 4   | `barbeiros` na agenda com queryKey `["barbeiros"]` colide com `["barbeiros-detail"]` dos barbeiros | potencial bug de cache                                        |

---

## Arquivos criados

| Arquivo                                              | Conteúdo                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/web/src/shared/components/loading-spinner.tsx` | `<LoadingSpinner message? className?>` — componente único de estado de carregamento |

---

## Arquivos modificados

| Arquivo                                                           | Mudança                                                                                       |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `apps/web/src/shared/lib/constants.ts`                            | `STALE_TIME` (`REALTIME=10s`, `DEFAULT=60s`) e `QUERY_KEYS` (factory functions typed)         |
| `apps/web/src/features/agenda/components/AgendaView.tsx`          | Loading inline → `<LoadingSpinner>`; remove `eslint-disable` que ficou sobrando               |
| `apps/web/src/features/barbeiros/components/BarbeirosView.tsx`    | Loading inline → `<LoadingSpinner>`                                                           |
| `apps/web/src/features/clientes/components/ClientesView.tsx`      | Loading inline → `<LoadingSpinner>`                                                           |
| `apps/web/src/features/servicos/components/ServicosView.tsx`      | Loading inline → `<LoadingSpinner>`                                                           |
| `apps/web/src/features/agenda/hooks/use-agenda.ts`                | `STALE_TIME.REALTIME/DEFAULT`; `QUERY_KEYS.agendamentos/barbeirosAgenda`                      |
| `apps/web/src/features/barbeiros/hooks/use-barbeiros.ts`          | `staleTime: 30_000` → `STALE_TIME.DEFAULT`; key `"barbeiros-detail"` → `QUERY_KEYS.barbeiros` |
| `apps/web/src/features/clientes/hooks/use-clientes.ts`            | `STALE_TIME.DEFAULT`; `QUERY_KEYS.clientes`                                                   |
| `apps/web/src/features/servicos/hooks/use-servicos.ts`            | `STALE_TIME.DEFAULT`; `QUERY_KEYS.servicos`                                                   |
| `apps/web/src/features/relatorios/hooks/use-relatorios.ts`        | `STALE_TIME.DEFAULT`; `QUERY_KEYS.relatorios.*` (nested)                                      |
| `apps/web/src/features/configuracoes/hooks/use-configuracao.ts`   | `STALE_TIME.DEFAULT`; `QUERY_KEYS.configuracoes.*` (nested)                                   |
| `apps/web/src/features/dashboard/hooks/use-dashboard-overview.ts` | `QUERY_KEYS.dashboard()`                                                                      |

---

## Convenção de queryKey resultante

```ts
// Factory functions tipadas — evita typos e facilita invalidateQueries
QUERY_KEYS.agendamentos(barCodigo, date); // ["agendamentos", barCodigo, date]
QUERY_KEYS.barbeiros(barCodigo); // ["barbeiros", barCodigo]
QUERY_KEYS.barbeirosAgenda(barCodigo); // ["barbeiros-agenda", barCodigo]
QUERY_KEYS.relatorios.faturamento(bar, periodo); // ["relatorios", "faturamento", bar, periodo]
QUERY_KEYS.configuracoes.notificacoes(bar); // ["configuracoes", "notificacoes", bar]
```

---

## Validação

```bash
pnpm --filter web lint        # 0 warnings
pnpm --filter web check-types # sem erros
pnpm --filter web vitest run  # 30/30 passed
```
