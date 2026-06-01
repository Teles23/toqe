---
name: toqe-tests
description: Use para criar, corrigir ou selecionar testes no Toqe: Jest API, Vitest/MSW Web, Jest Expo Mobile, Testcontainers, security tests, Playwright, Maestro e k6.
---

# Toqe Tests

## Princípios

- Teste código real; não duplique implementação no spec.
- Cubra sucesso, erro, edge cases, permissão, dados ausentes e tenant isolation.
- Mock é aceitável em unit, mas fluxo crítico precisa de teste real.
- Nada de `.skip`, `--passWithNoTests` ou specs vazios.

## Camadas

- API unit: `apps/api/src/**/*.spec.ts`, comando `pnpm --filter api test`.
- API integration: `apps/api/test/integration`, comando `pnpm --filter api test:integration`.
- API security: `apps/api/test/security`, comando `pnpm --filter api test:security`.
- Web unit: Vitest + MSW, comando `pnpm --filter web test`.
- Web E2E: Playwright em `apps/web/e2e`.
- Mobile unit: Jest Expo em `apps/mobile`.
- Mobile E2E: Maestro em `apps/mobile/.maestro/flows`.
- Load: k6 em `tools/load`.

## Seleção Rápida

- Mudou service API: unit do service + integração se regra crítica.
- Mudou controller: controller spec + consumer.
- Mudou web hook: MSW + Vitest.
- Mudou mobile screen: Jest Expo com `testID`.
- Mudou auth/tenant/payment: security/integration obrigatório.

## Comandos

```bash
pnpm --filter api test
pnpm --filter web test
pnpm --filter mobile test
pnpm --filter api test:integration
pnpm --filter api test:security
```
