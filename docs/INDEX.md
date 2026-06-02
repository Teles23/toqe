# Índice de Documentação — toqe

> Atualizado em: 2026-05-29

## Como navegar

Os arquivos com prefixo numérico (`XX-nome.md`) documentam entregas de sprint em ordem cronológica. Os arquivos sem número são referências permanentes (setup, design system, arquitetura). Para entender o estado atual do produto, comece por [39-estado-atual.md](39-estado-atual.md) e [62-maturidade-e-roadmap.md](62-maturidade-e-roadmap.md).

---

## Referências permanentes

- [../ARCHITECTURE.md](../ARCHITECTURE.md) — visão geral da arquitetura do monorepo (stack, módulos, fluxo de dados, decisões)
- [checklist-desenvolvimento.md](checklist-desenvolvimento.md) — checklist obrigatório antes de cada commit e PR (lint, tipos, testes, segurança, Prisma, sync API↔web)
- [codex-operacional.md](codex-operacional.md) — workflows operacionais para agentes Codex, validação inteligente, subagents e automações recomendadas
- [cowork-agent.md](cowork-agent.md) — instruções do ambiente para agentes Claude operando no projeto
- [toqe-doc-completo.md](toqe-doc-completo.md) — documento de referência completo do produto (regras de negócio, contratos, fluxos)
- [toqe_plano_estrategico.md](toqe_plano_estrategico.md) — plano estratégico inicial do SaaS (fases A1–E4)
- [toqe-postman-collection.json](toqe-postman-collection.json) — coleção Postman com todos os endpoints da API

---

## Autenticação & Usuários

- [01-setup-inicial.md](01-setup-inicial.md) — setup inicial do projeto (estrutura, deps, primeiro endpoint)
- [29-auth-seguranca-upload-logo.md](29-auth-seguranca-upload-logo.md) — alterar senha, sessões ativas, 2FA TOTP e upload de logo da barbearia
- [31-auth-google.md](31-auth-google.md) — Google OAuth (endpoint real, dependency inversion, `senhaHash` nullable, mobile bootstrap)
- [57-convite-auto-login.md](57-convite-auto-login.md) — convite de barbeiro com auto-login após aceite, tela de boas-vindas e endpoint de rejeitar
- [78-convite-barbeiro-email.md](78-convite-barbeiro-email.md) — envio de email de convite via Resend com template HTML
- [mobile-auth.md](mobile-auth.md) — fluxo de autenticação no mobile (JWT, SecureStore, Google Sign-In, refresh)

---

## Agendamento & Serviços

- [02-implementacao-fase-1-e-2.md](02-implementacao-fase-1-e-2.md) — fases 1 e 2: entidades base, CRUD de agendamento
- [03-implementacao-fase-3.md](03-implementacao-fase-3.md) — fase 3: ciclo de status, validações
- [28-funcionalidade-novo-agendamento.md](28-funcionalidade-novo-agendamento.md) — endpoint de novo agendamento, slots, conflitos
- [30-fila-walk-in.md](30-fila-walk-in.md) — fila walk-in (cliente sem agendamento prévio, tipo `WALK_IN`)
- [56-status-em-andamento.md](56-status-em-andamento.md) — adição do estado `em_andamento` ao ciclo de status do agendamento
- [61-jornada-semanal-transacional.md](61-jornada-semanal-transacional.md) — PUT transacional de jornada semanal (7 dias atômicos)
- [73-fila-filtragem-servico.md](73-fila-filtragem-servico.md) — filtragem de fila por serviço
- [76-fuso-agenda-saopaulo.md](76-fuso-agenda-saopaulo.md) — fuso horário America/Sao_Paulo na geração de slots e comparações

---

## Barbeiro & Barbearia

- [07-sprint-1-crud-e-membros.md](07-sprint-1-crud-e-membros.md) — CRUD de barbearia e membros
- [08-sprint-2-perfil-logout-preferencias.md](08-sprint-2-perfil-logout-preferencias.md) — perfil do usuário, logout, preferências de notificação
- [09-sprint-3-whitelabel-planos-websocket.md](09-sprint-3-whitelabel-planos-websocket.md) — white-label (tema por tenant), planos, WebSocket
- [58-link-publico-barbeiro.md](58-link-publico-barbeiro.md) — link público do barbeiro (pré-seleciona barbeiro no booking)
- [70-perfil-barbeiro-jornada-servicos.md](70-perfil-barbeiro-jornada-servicos.md) — perfil completo do barbeiro: edição de jornada e serviços
- [71-correcoes-pos-teste-perfil-precos.md](71-correcoes-pos-teste-perfil-precos.md) — correções pós-teste: perfil e preços por barbeiro
- [72-correcoes-pos-teste-clientes-senha.md](72-correcoes-pos-teste-clientes-senha.md) — correções pós-teste: clientes e alteração de senha

---

## Cliente & Booking Público

- [42-booking-publico.md](42-booking-publico.md) — booking público `/b/:slug`: fluxo sem login, adapter `publico/`, barbeiro "qualquer disponível"
- [59-notas-privadas-cliente.md](59-notas-privadas-cliente.md) — notas privadas por cliente (TQE_CLIENTE_NOTA, API + web + mobile)
- [74-contato-walk-in-pessoa-api.md](74-contato-walk-in-pessoa-api.md) — contato de walk-in e campos de pessoa na API
- [79-onboarding-minimal-cliente.md](79-onboarding-minimal-cliente.md) — onboarding minimal do cliente no mobile (fluxo slide 02)

---

## Rede (Multi-tenant / Super Admin)

- [45-super-admin.md](45-super-admin.md) — painel Super Admin `/admin/*`: MRR, barbearias, plano, status, bootstrap via `SUPER_ADMIN_EMAIL`
- [48-mobile-sprint3-multi-tenant-qr.md](48-mobile-sprint3-multi-tenant-qr.md) — multi-tenant no mobile: `SplashTenantPicker`, `TenantSwitcherSheet`, QR scan
- [77-plano-bloqueado-integracao.md](77-plano-bloqueado-integracao.md) — integração de bloqueio por plano inadimplente (`PlanoAtivoGuard`)
- [80-redesign-landing-rede-responsividade.md](80-redesign-landing-rede-responsividade.md) — redesign Minha Rede e auditoria de responsividade web

---

## Mobile

- [mobile-setup.md](mobile-setup.md) — setup e desenvolvimento local do app mobile (pré-requisitos, variáveis, EAS)
- [mobile-navegacao.md](mobile-navegacao.md) — estrutura de navegação Expo Router (tabs, grupos de rota, deep links)
- [mobile-branding.md](mobile-branding.md) — branding: ícones, splash screen, geração de assets
- [mobile-design-system.md](mobile-design-system.md) — design system do mobile: tokens, paleta, spacing, componentes UI compartilhados
- [mobile-diagnostico.md](mobile-diagnostico.md) — diagnóstico de problemas comuns no desenvolvimento mobile
- [mobile-barbeiro-agenda.md](mobile-barbeiro-agenda.md) — agenda do barbeiro no mobile: layout, cards, pull-to-refresh
- [mobile-test-coverage.md](mobile-test-coverage.md) — cobertura de testes do mobile (specs por tela)
- [32-clientes-mobile.md](32-clientes-mobile.md) — tela de clientes no mobile
- [33-perfil-mobile.md](33-perfil-mobile.md) — tela de perfil no mobile
- [35-redesign-mobile-urban-flow.md](35-redesign-mobile-urban-flow.md) — redesign mobile com design system Urban Flow
- [37-mobile-responsividade-web.md](37-mobile-responsividade-web.md) — responsividade web e ajustes mobile
- [38-telas-cliente-metricas-push.md](38-telas-cliente-metricas-push.md) — telas do cliente, métricas e push notifications
- [46-redesign-mobile-barbeiro.md](46-redesign-mobile-barbeiro.md) — redesign pixel-accurate das telas do barbeiro
- [47-api-endpoints-mobile-barbeiro.md](47-api-endpoints-mobile-barbeiro.md) — endpoints de API consumidos pelo mobile do barbeiro
- [49-mobile-sprint4-full-fidelity.md](49-mobile-sprint4-full-fidelity.md) — Sprint 4 mobile: fidelidade completa com protótipos
- [50-mobile-login-v2-pixel.md](50-mobile-login-v2-pixel.md) — login v2 pixel-accurate (Urban Flow)
- [51-mobile-onboarding-v2-pixel.md](51-mobile-onboarding-v2-pixel.md) — onboarding v2 pixel-accurate
- [52-mobile-quickbook-home-v2.md](52-mobile-quickbook-home-v2.md) — home do cliente v2: quick book e próximo agendamento
- [53-mobile-barbeiro-v2-fidelity.md](53-mobile-barbeiro-v2-fidelity.md) — fidelidade v2 das telas do barbeiro
- [54-mobile-safe-area-sweep.md](54-mobile-safe-area-sweep.md) — auditoria de safe area em todas as telas mobile
- [55-eas-build-lockfile-types-react.md](55-eas-build-lockfile-types-react.md) — EAS Build: lockfile, tipos React 19, configuração de build profiles
- [60-mobile-api-url-por-ambiente.md](60-mobile-api-url-por-ambiente.md) — URL da API por ambiente (dev/staging/prod) via `EXPO_PUBLIC_API_URL`
- [68-bottom-sheets-abracam-conteudo.md](68-bottom-sheets-abracam-conteudo.md) — bottom sheets que abraçam o conteúdo (altura dinâmica, sem scroll desnecessário)

---

## Web (Frontend)

- [13-fase-3-frontend-piloto.md](13-fase-3-frontend-piloto.md) — estrutura `src/features/`, design tokens, piloto auth, RBAC, TanStack Query
- [14-fase-4-replicacao-perf.md](14-fase-4-replicacao-perf.md) — replicação para todas as features + otimização de performance
- [36-field-limits-masks.md](36-field-limits-masks.md) — limites de campo e máscaras de input (CPF, telefone, CEP)
- [41-redesign-login-web.md](41-redesign-login-web.md) — redesign da tela de login web (Urban Flow, dark-first)
- [43-redesign-onboarding.md](43-redesign-onboarding.md) — redesign do onboarding web (criar barbearia)
- [44-redesign-add-barbeiro.md](44-redesign-add-barbeiro.md) — redesign do modal de adicionar barbeiro
- [63-auditoria-ux-bugs-senha.md](63-auditoria-ux-bugs-senha.md) — auditoria de UX e correção de bugs de senha no web
- [69-auditoria-pos-sprint-2.md](69-auditoria-pos-sprint-2.md) — auditoria pós Sprint 2: responsividade, acessibilidade, polish

---

## Infraestrutura & CI

- [11-fase-1-tooling-ci.md](11-fase-1-tooling-ci.md) — Fase 1: Husky, lint-staged, commitlint, GitHub Actions, gitleaks
- [17-fase-5-docker-deploy.md](17-fase-5-docker-deploy.md) — Docker (Dockerfiles, docker-compose), healthchecks, pipeline de release
- [25-sentry-nextjs-deprecations.md](25-sentry-nextjs-deprecations.md) — integração Sentry no Next.js, filtro `ApiErrorPayload`
- [26-cd-vps-deploy.md](26-cd-vps-deploy.md) — deploy contínuo em VPS via GitHub Actions
- [27-correcoes-ci-cd-https.md](27-correcoes-ci-cd-https.md) — correções no pipeline CI/CD e configuração HTTPS
- [32-ci-deploy-fixes.md](32-ci-deploy-fixes.md) — correções no workflow de CI e deploy
- [40-metricas-baseline.md](40-metricas-baseline.md) — métricas de baseline (cold start, bundle size, tempos de CI)
- [75-seed-demo-idempotente.md](75-seed-demo-idempotente.md) — seed de demonstração idempotente (corrige acúmulo no Docker e divergência entre `seed.ts` e `seed-runner.js`)

---

## Testes

- [18-testes.md](18-testes.md) — estratégia de testes: unit, integração (Testcontainers), security (supertest), E2E, carga
- [24-real-integration.md](24-real-integration.md) — testes de integração reais com Testcontainers (banco real, sem mocks)
- [64-testes-codigo-real-lote-1.md](64-testes-codigo-real-lote-1.md) — Lote 1: testes que importam do módulo real (sem duplicar lógica)
- [65-testes-codigo-real-lote-2.md](65-testes-codigo-real-lote-2.md) — Lote 2: continuação da migração para testes do código real
- [66-testes-codigo-real-lote-3-4.md](66-testes-codigo-real-lote-3-4.md) — Lotes 3 e 4: cobertura de edge cases e isolamento de tenant
- [67-testes-codigo-real-lote-5.md](67-testes-codigo-real-lote-5.md) — Lote 5: finalização da campanha de testes reais
- [81-e2e-playwright-correcoes.md](81-e2e-playwright-correcoes.md) — correções nos specs E2E Playwright (seletores alinhados com app real)

---

## Segurança

- [82-auditoria-seguranca.md](82-auditoria-seguranca.md) — auditoria sistêmica de segurança: type safety (Partes 1–7), 2 vulns HIGH corrigidas (webhook fail-open, IDOR fidelidade), hardening WebSocket, fix TenantInterceptor crash em GET (PR #106)
- [83-auditoria-seguranca-rounds-2-3.md](83-auditoria-seguranca-rounds-2-3.md) — Rounds 2 e 3: tokenHash, PII em Redis, JWT tokenVersion, 2FA secret, cross-tenant slots, $executeRaw, ValidationPipe, INTERNAL_API obrigatória, /admin privada (PR #111)
- [84-pendencias-seguranca.md](84-pendencias-seguranca.md) — Gaps pendentes: rate limit no login, cleanup de refresh tokens expirados, Helmet HTTP headers, 2FA obrigatório para donos
- [85-correcoes-pos-teste-onboarding-auth-dashboard.md](85-correcoes-pos-teste-onboarding-auth-dashboard.md) — 10 bugs corrigidos: onboarding, login Google, refresh token ruidoso, convite barbeiro, nota cliente, descricao serviço, rota /rede, status EM_ANDAMENTO, logo CSP, sidebar ao vivo

---

## Refactor & Qualidade de Código

- [12-fase-2-contracts.md](12-fase-2-contracts.md) — `packages/contracts` com schemas Zod como source of truth
- [15-fase-4-ci-lint-fixes.md](15-fase-4-ci-lint-fixes.md) — correções de lint no CI (Fase 4)
- [16-fase-4e-configuracoes.md](16-fase-4e-configuracoes.md) — configurações (Fase 4e)
- [19-refactor-dry.md](19-refactor-dry.md) — Refactor DRY: eliminação de duplicação de código (Fase 1)
- [20-refactor-dry-fase-2.md](20-refactor-dry-fase-2.md) — Refactor DRY Fase 2
- [21-refactor-dry-fase-3.md](21-refactor-dry-fase-3.md) — Refactor DRY Fase 3
- [22-refactor-dry-fase-4.md](22-refactor-dry-fase-4.md) — Refactor DRY Fase 4
- [23-audit-corrections.md](23-audit-corrections.md) — auditoria e correções gerais
- [23-refactor-code-quality.md](23-refactor-code-quality.md) — refactor de qualidade de código
- [04-validacao-e-correcoes.md](04-validacao-e-correcoes.md) — validações e correções gerais

---

## Notificações & Integrações

- [05-implementacao-notificacoes.md](05-implementacao-notificacoes.md) — notificações (email via Resend, push via Expo)
- [06-ambiente-docker-e-testes.md](06-ambiente-docker-e-testes.md) — ambiente Docker e testes integrados

---

## Roadmap & Status

- [39-estado-atual.md](39-estado-atual.md) — **estado atual do develop** (tabela de módulos, qualidade, débitos técnicos) — ponto de partida recomendado
- [56-status-em-andamento.md](56-status-em-andamento.md) — status `em_andamento` no ciclo do agendamento
- [62-maturidade-e-roadmap.md](62-maturidade-e-roadmap.md) — **maturidade do produto e roadmap** (Sprints A–E, o que está maduro, o que falta)
- [10-arquitetura-reorganizacao.md](10-arquitetura-reorganizacao.md) — reorganização arquitetural do monorepo (decisões, 5 fases, status)
