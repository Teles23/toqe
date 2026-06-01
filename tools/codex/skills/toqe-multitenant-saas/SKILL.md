---
name: toqe-multitenant-saas
description: Use para features ou auditorias multi-tenant SaaS no Toqe: barbearias, membros, planos, limites, feature flags, rede multi-unidade, isolamento de dados e billing.
---

# Toqe Multi-Tenant SaaS

## Modelo Mental

- Tenant primário: `Barbearia` (`barCodigo`).
- Usuário pode pertencer a múltiplas barbearias via `MembroBarbearia`.
- Perfil é contextual ao tenant.
- Requests autenticadas de tenant usam `x-tenant-id`.
- Planos e limites ficam em `PlanoLimite` e status no tenant.

## Checklist

- Resolver tenant ativo corretamente.
- Verificar membership/role antes de acessar dados.
- Escopar queries por `barCodigo`.
- Validar limites de plano dentro de transação quando houver concorrência.
- Feature flags por plano devem falhar fechadas.
- Super admin deve operar em rotas/admin separadas.
- Multi-unidade não pode misturar dados de unidades sem autorização do dono.

## Testes

Crie cenários com pelo menos dois tenants:

- dado de A não aparece em B;
- usuário sem membership recebe 403/404;
- limite de plano bloqueia;
- staff e cliente têm permissões diferentes.
