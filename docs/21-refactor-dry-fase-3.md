# 21 — Refactoring DRY / SOLID — Fase 3

**Status:** Completo  
**Branch:** `refactor/dry-fase-3`  
**Base:** `develop`

---

## Objetivo

Centralizar `formatBRL()` e arrays de dias da semana — eliminando formatações de moeda inconsistentes espalhadas por ~12 arquivos e três definições duplicadas de `DIAS_SEMANA`.

---

## Problemas encontrados

| #   | Problema                                                                                                    | Ocorrências                                                   |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | Formatação de moeda inline inconsistente (`R$${v}`, `R$ ${v.toLocaleString("pt-BR")}`, `R$${v.toFixed(0)}`) | ~12 arquivos                                                  |
| 2   | Array de dias curtos (`["Dom","Seg",...]`) duplicado                                                        | `agenda/constants`, `barbeiros/components`, `barbeiros/hooks` |
| 3   | Array de dias longos (`["Segunda","Terça",...]`) definido localmente                                        | `configuracoes/constants`                                     |

---

## Arquivos criados

| Arquivo                                | Conteúdo                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/web/src/shared/lib/constants.ts` | `DIAS_SEMANA_CURTO` e `DIAS_SEMANA_LONGO` (começando em domingo, `as const`) |

---

## Arquivos modificados

| Arquivo                                                                   | Mudança                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/web/src/shared/lib/utils.ts`                                        | Adicionada `formatBRL(value)` via `Intl.NumberFormat pt-BR BRL`               |
| `apps/web/src/features/agenda/constants/agenda.constants.ts`              | `DIAS` = `DIAS_SEMANA_CURTO` de shared                                        |
| `apps/web/src/features/barbeiros/hooks/use-barbeiros.ts`                  | `diasSemana` = `[...DIAS_SEMANA_CURTO]`                                       |
| `apps/web/src/features/barbeiros/components/BarbeiroDetalhe.tsx`          | `DIAS_SEMANA` local → `DIAS_SEMANA_CURTO`; valores monetários → `formatBRL()` |
| `apps/web/src/features/barbeiros/components/BarbeiroCard.tsx`             | `R$${ticketMedio}` → `formatBRL()`                                            |
| `apps/web/src/features/clientes/components/ClienteCard.tsx`               | `R$${totalGasto}` → `formatBRL()`                                             |
| `apps/web/src/features/clientes/components/ClienteDetalhe.tsx`            | `R$${totalGasto/ticketMedio}` → `formatBRL()`                                 |
| `apps/web/src/features/servicos/components/ServicoCard.tsx`               | `R$${precoBase}` → `formatBRL()`                                              |
| `apps/web/src/features/servicos/components/ServicoDetalhe.tsx`            | `R$ ${precoBase}` → `formatBRL()`                                             |
| `apps/web/src/features/relatorios/components/BarbeirosRanking.tsx`        | `R$${faturamento}k` e `R$${ticketMedio}` → `formatBRL()`                      |
| `apps/web/src/features/dashboard/components/FaturamentoChart.tsx`         | `R$ ${v.toLocaleString("pt-BR")}` → `formatBRL()`                             |
| `apps/web/src/features/dashboard/components/ServicosPopulares.tsx`        | `R$${receita}` → `formatBRL()`                                                |
| `apps/web/src/features/configuracoes/constants/configuracao.constants.ts` | Array local `DIAS_SEMANA` → `DIAS_SEMANA_LONGO` de shared                     |

---

## O que ficou como está (intencional)

| Local                                                     | Motivo                                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `relatorios/FaturamentoChart.tsx` tickFormatter `R$${k}k` | Formato compacto de eixo Y — semântica diferente                                                       |
| `chart-utils.tsx` `toLocaleString("pt-BR")`               | Componente genérico que recebe `prefix` como prop; adicionar `formatBRL` quebraria usos não-monetários |
| `barbeiros/BarbeirosView.tsx` `unit: "R$"`                | Prop do `StatCard` — responsabilidade de formatação é do componente                                    |

---

## API pública resultante

```ts
// shared/lib/utils.ts
formatBRL(value: number): string  // "R$ 1.234"

// shared/lib/constants.ts
DIAS_SEMANA_CURTO  // ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"] as const
DIAS_SEMANA_LONGO  // ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"] as const
```

---

## Validação

```bash
pnpm --filter web lint        # 0 warnings
pnpm --filter web check-types # sem erros
pnpm --filter web vitest run  # 30/30 passed
```
