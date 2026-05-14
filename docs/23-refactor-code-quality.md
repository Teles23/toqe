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

## Próximas fases

| Fase       | Escopo                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------- |
| Fase 2 Web | Corrigir `setup.spec.ts` trivial no Web                                                     |
| Fase 3     | DRY API: `date.utils`, `price.utils`, `aggregation.utils`, constantes centralizadas         |
| Fase 4     | DRY Web: unificar BarbeiroCard, remover `ClientOnlyChart` duplicado, extrair `getCategoria` |
| Fase 5     | SOLID API: `BarberMetricsService`, `SlotAvailabilityChecker`, DIP em `NotificacaoService`   |
| Fase 6     | SOLID Web: separar fetch/render em Views, Context para `barCodigo`                          |
| Fase 7     | Validação final: lint + types + testes 100% nos dois apps                                   |
