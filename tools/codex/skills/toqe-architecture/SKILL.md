---
name: toqe-architecture
description: Use para decisões arquiteturais no Toqe, análise de módulos, organização do monorepo, boundaries entre API/Web/Mobile/packages e evolução segura de um SaaS multi-tenant.
---

# Toqe Architecture

## Contexto

Leia `ARCHITECTURE.md`, `docs/INDEX.md`, `docs/39-estado-atual.md` e `docs/62-maturidade-e-roadmap.md`.

## Princípios

- Multi-tenancy e isolamento por `barCodigo` são centrais.
- `packages/contracts` e `packages/shared` são fronteiras entre apps.
- API mantém controllers magros e regras em services.
- Web usa feature-based em `src/features` e BFF para auth/cookies.
- Mobile usa Expo Router, providers compartilhados e componentes `src/shared/ui`.
- Infra local é Docker/WSL/Linux com pnpm/Turbo.

## Ao propor arquitetura

- Verifique código atual antes de recomendar.
- Prefira padrões locais a novas abstrações.
- Considere blast radius em API, web, mobile, contracts e docs.
- Separe feature, refactor e migration quando possível.
- Inclua plano de validação e rollback.

## Entrega

Forneça:

- estado atual observado;
- opção recomendada;
- alternativas rejeitadas;
- impacto por app/package;
- riscos e testes necessários.
