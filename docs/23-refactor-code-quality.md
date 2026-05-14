# 23 — Refactoring Code Quality — Fases 1 e 2

**Status:** Em andamento (Fases 1–2 concluídas)  
**Branch:** `refactor/code-quality`  
**Base:** `develop`

---

## Objetivo

Auditoria e correção sistemática do projeto para conformidade com DRY, SOLID e Clean Code:

- **Fase 1 API**: Eliminar todos os padrões de bypass (`as any`, `eslint-disable`, `@ts-ignore`) — corrigir na raiz
- **Fase 1 Web**: Remover `/* eslint-disable */` em 34 arquivos e todos `as any` no Web
- **Fase 2 API**: Reescrever specs vazias ("should be defined") com testes funcionais reais

---

## Fase 1 — API: Zero `any`, lint e tipos limpos

### Problemas corrigidos

| #   | Problema                                | Arquivo                                                                                                           |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | `as any` em guards/interceptors         | `roles.guard.ts`, `tenant.guard.ts`, `feature-flag.guard.ts`, `tenant.interceptor.ts`                             |
| 2   | `Observable<any>` em interceptor        | `tenant.interceptor.ts`                                                                                           |
| 3   | `(req as any).user` em serializers Pino | `observabilidade.module.ts`                                                                                       |
| 4   | 4× `as any` em SentryFilter             | `sentry.filter.ts`                                                                                                |
| 5   | `as any` em specs (DTOs sem tipo)       | `preferencias.service.spec.ts`, `relatorio.service.spec.ts`, `servico.service.spec.ts`, `usuario.service.spec.ts` |
| 6   | `$transaction` sem tipo no mock         | `agendamento.service.spec.ts`, `barbearia.service.spec.ts`                                                        |
| 7   | `mock.calls[0][0]` sem tipo             | `notificacao.service.spec.ts`                                                                                     |
| 8   | `client.join(room)` sem `void`          | `agenda.gateway.ts`                                                                                               |
| 9   | `bootstrap()` sem `void`                | `main.ts`                                                                                                         |
| 10  | Bug timezone: `getHours()` em UTC       | `relatorio.service.ts` → `getUTCHours()`                                                                          |

### Novos tipos criados

| Arquivo                                    | Conteúdo                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| `apps/api/src/common/types/jwt-request.ts` | `JwtRequest` e `TenantRequest` — tipos para req tipado nos guards/interceptors |

### Resultado

- 0 erros ESLint (`no-explicit-any`)
- 76/76 testes passando

---

## Fase 1 — Web: Remove eslint-disable e `as any`

### Problemas corrigidos

| #   | Problema                                                   | Solução                                                      |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | `/* eslint-disable no-restricted-syntax */` em 34 arquivos | Mover para override no `eslint.config.js` por padrão de glob |
| 2   | `(e as any).isComposing`                                   | `e.isComposing` — `KeyboardEvent` já tem a propriedade       |
| 3   | `(e.nativeEvent as any).isComposing`                       | `(e.nativeEvent as KeyboardEvent).isComposing`               |

### Resultado

- 0 `eslint-disable` inline nos arquivos de feature/shared
- 30/30 testes passando

---

## Fase 2 — API: Specs reais substituindo scaffolding

### Specs reescritas

| Arquivo                          | Testes antes          | Testes depois       |
| -------------------------------- | --------------------- | ------------------- |
| `agenda.controller.spec.ts`      | 1 "should be defined" | 4 testes funcionais |
| `agenda.service.spec.ts`         | 1 "should be defined" | 7 testes funcionais |
| `agendamento.controller.spec.ts` | 1 "should be defined" | 5 testes funcionais |
| `auth.controller.spec.ts`        | 1 "should be defined" | 4 testes funcionais |
| `barbearia.controller.spec.ts`   | 1 "should be defined" | 5 testes funcionais |
| `prisma.service.spec.ts`         | 1 "should be defined" | 2 testes funcionais |
| `servico.controller.spec.ts`     | 1 "should be defined" | 4 testes funcionais |
| `tenant-context.service.spec.ts` | 1 "should be defined" | 3 testes funcionais |
| `tenant.interceptor.spec.ts`     | 1 "should be defined" | 4 testes funcionais |
| `usuario.controller.spec.ts`     | 1 "should be defined" | 2 testes funcionais |

### Problemas técnicos resolvidos

| Problema                                                                         | Solução                                                                                                  |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `jest.mock('pg')` quebra `@prisma/adapter-pg` na inicialização                   | Mockar `'../generated/prisma'` com classe MockPrismaClient que ignora adapter                            |
| Timezone: `'2025-01-06'` parseia como UTC midnight, causando dia errado em UTC-3 | Usar `'2025-01-06T15:00:00'` (local ISO) e `new Date(2025, 0, 6, ...)` (Date constructor = always local) |
| `$transaction` mock sem tipo                                                     | `(fn: (tx: unknown) => unknown) => fn({})`                                                               |

### Arquivos auxiliares atualizados

| Arquivo                                    | Mudança                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `apps/api/src/test/prisma-mock.factory.ts` | Adicionados: `jornadaTrabalho`, `bloqueioAgenda`, `planoLimite`, `$executeRawUnsafe` |

### Resultado

- 108/108 testes passando (era 76 antes da Fase 2)
- Nenhum spec com "should be defined" restante na API

---

---

## Fase 3 — DRY API: utilitários centralizados

### Arquivos criados

| Arquivo                                               | Conteúdo                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/api/src/common/constants/agendamento-status.ts` | `StatusAgendamento` enum + `STATUSES_ENCERRADOS`, `STATUSES_ATIVOS`, `STATUSES_BLOQUEANTES` |
| `apps/api/src/common/utils/date.utils.ts`             | `startOfDay`, `endOfDay`, `toDateString`, `currentMonthRange`                               |
| `apps/api/src/common/utils/price.utils.ts`            | `somarItens`, `somarAgendamentos`                                                           |
| `apps/api/src/common/constants/prisma-selects.ts`     | `SELECT_USUARIO_COM_AVATAR`, `SELECT_USUARIO_PERFIL`, `INCLUDE_ITENS_PRECO`                 |

### Resultado

- 26 string literals de status → enum tipado
- 5 padrões `setHours(0,0,0,0)` → `startOfDay()`/`endOfDay()`
- 3 padrões `toISOString().split('T')[0]` → `toDateString()`
- 3 nested-reduces de faturamento → `somarAgendamentos()`
- 2 monthRange duplicados → `currentMonthRange()`

---

## Fase 4 — DRY Web

### Arquivos modificados

| Arquivo                                                           | Mudança                                                                |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/web/src/shared/components/chart-utils.tsx`                  | Adicionado prop `formatter?` ao `ChartTooltip`                         |
| `apps/web/src/features/dashboard/components/FaturamentoChart.tsx` | Remove `ClientOnlyChart` e `CustomTooltip` locais — importa dos shared |
| `apps/web/src/features/servicos/constants/servico.constants.ts`   | Extrai `getCategoria()` helper                                         |
| `apps/web/src/features/servicos/components/ServicoCard.tsx`       | Usa `getCategoria()`                                                   |
| `apps/web/src/features/servicos/components/ServicoDetalhe.tsx`    | Usa `getCategoria()`                                                   |

---

## Fase 5 — SOLID API: extrai isTimeOverlap

### Problema

`isBusy()` em `AgendaService` repetiria o mesmo padrão de 3 condições (início, fim, contenção) para 3 domínios (almoço, agendamentos, bloqueios) — 56 linhas repetitivas.

### Solução

Extraído `isTimeOverlap(slotStart, slotEnd, rangeStart, rangeEnd)` em `date.utils.ts` com 6 testes unitários. `isBusy()` reduzido de 56 → 7 linhas usando `isTimeOverlap` + `.some()`.

### Arquivos criados/modificados

| Arquivo                                        | Mudança                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/api/src/common/utils/date.utils.ts`      | + `isTimeOverlap()`                                                                        |
| `apps/api/src/common/utils/date.utils.spec.ts` | 11 testes unitários (isTimeOverlap, startOfDay, endOfDay, toDateString, currentMonthRange) |
| `apps/api/src/agenda/agenda.service.ts`        | `isBusy()` simplificado                                                                    |

---

## Fase 6 — SOLID Web

**Avaliação:** Nenhuma violação significativa encontrada.

- Views já separam fetch (hooks) de render (JSX) idiomaticamente
- `barCodigo` tem apenas 2 níveis de prop drilling (Page → View → Secao) — Context seria premature optimization
- Componentes grandes (`app/page.tsx`, onboarding) são landing pages intencionalmente monolíticas
- `shared/ui/` são componentes gerados (shadcn/ui) — não tocar

---

## Resultado Final

**Status:** Completo ✓

| Métrica                   | Antes       | Depois |
| ------------------------- | ----------- | ------ |
| Testes API                | 76          | 119    |
| Testes Web                | 30          | 35     |
| Erros ESLint API          | muitos      | 0      |
| Erros TypeScript          | muitos      | 0      |
| `as any` em produção      | muitos      | 0      |
| `eslint-disable` inline   | 34 arquivos | 0      |
| String literals de status | 26          | 0      |
| `isBusy()` linhas         | 56          | 7      |
