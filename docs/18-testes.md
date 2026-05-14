# Camadas de Testes

## Diagrama das 6 Camadas

```
┌─────────────────────────────────────────────────────────────┐
│  Camada 6 — Load Testing (k6)         tools/load/           │
├─────────────────────────────────────────────────────────────┤
│  Camada 5 — E2E Mobile (Maestro)      apps/mobile/.maestro/ │
├─────────────────────────────────────────────────────────────┤
│  Camada 4 — E2E Web (Playwright)      apps/web/e2e/         │
├─────────────────────────────────────────────────────────────┤
│  Camada 3 — Integration BE (Testcontainers) apps/api/test/  │
├─────────────────────────────────────────────────────────────┤
│  Camada 2 — Unit FE (Vitest + Testing Library) apps/web/src │
├─────────────────────────────────────────────────────────────┤
│  Camada 1 — Unit BE (Jest)            apps/api/src          │
└─────────────────────────────────────────────────────────────┘
```

## Como rodar cada camada

### Camada 1 — Unit BE
```bash
pnpm --filter api test
pnpm --filter api test:cov
```

### Camada 2 — Unit FE
```bash
pnpm --filter web test
pnpm --filter web test:watch
```

### Camada 3 — Integration BE
> Requer Docker em execução (Testcontainers sobe um container PostgreSQL automaticamente)
```bash
pnpm --filter api test:integration
```

### Camada 4 — E2E Web
> Requer a aplicação web em execução em `http://localhost:3001`
```bash
pnpm --filter web dev          # em outro terminal
pnpm --filter web test:e2e
pnpm --filter web test:e2e:ui  # modo interativo
```

### Camada 5 — E2E Mobile
> Requer Maestro CLI instalado globalmente e emulador ativo
```bash
# Instalar Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Rodar flows
cd apps/mobile
maestro test .maestro/flows
```

### Camada 6 — Load Testing
> Requer k6 instalado globalmente
```bash
# Instalar k6: https://k6.io/docs/get-started/installation/

k6 run tools/load/scenarios/auth-load.js
k6 run tools/load/scenarios/agendamento-load.js
k6 run tools/load/scenarios/barbearia-load.js
```

## Cobertura alvo por módulo

| Módulo | Unit BE | Integration | E2E |
|--------|---------|-------------|-----|
| auth | ✅ login, register, refresh, logout | ✅ fluxo completo | ✅ |
| agendamento | ✅ create, findAll, findOne, cancel | ✅ conflito + cancel | ✅ |
| barbearia | ✅ create, convidar, remover | ✅ create + membros | — |
| servico | ✅ CRUD + soft delete | — | ✅ |
| usuario | ✅ create, me, update | — | — |
| agenda | ✅ defined | — | — |
| tenant isolation | — | ✅ dados por barbearia | — |

## CI

Para adicionar CI no futuro, usar os pipelines Turbo:

```yaml
# .github/workflows/ci.yml (exemplo)
- name: Unit tests
  run: pnpm test

- name: Integration tests
  run: pnpm --filter api test:integration

- name: E2E tests
  run: pnpm --filter web test:e2e
```
