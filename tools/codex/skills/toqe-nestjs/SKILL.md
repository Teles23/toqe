---
name: toqe-nestjs
description: Use para implementar ou revisar API NestJS no Toqe: modules, controllers, services, DTOs, guards, interceptors, queues Bull, Swagger, Prisma e testes Jest.
---

# Toqe NestJS

## Padrões

- Um módulo por domínio em `apps/api/src/<dominio>`.
- Controller fino, service com regra de negócio.
- DTOs validados por Zod/class-validator conforme padrão do módulo.
- `APP_PIPE` usa `ZodValidationPipe`.
- Guards para JWT/RBAC/feature/plano quando necessário.
- Tenant via `x-tenant-id`, `barCodigo` e tenant interceptor/context.
- Logs via Pino; erros 5xx via filtro Sentry.

## Ao criar endpoint

1. Confirme rota e prefixo `/api/v1`.
2. Defina DTO/response shape.
3. Implemente controller/service.
4. Proteja com guards/roles.
5. Adicione Swagger.
6. Teste controller/service; integration/security se crítico.
7. Sincronize contracts, web e mobile.

## Prisma

- Use `select` enxuto.
- Evite N+1.
- Sempre escopo tenant em dados multi-tenant.
- Use transação com timeout/maxWait quando alterar múltiplas entidades relacionadas.

## Comandos

```bash
pnpm --filter api lint
pnpm --filter api test
pnpm --filter api test:integration
pnpm --filter api test:security
```
