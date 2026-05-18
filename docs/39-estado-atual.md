# Estado Atual do Develop

**Data:** 2026-05-18
**Branch base:** develop (últimas melhorias em `claude/field-limits-masks-XDba5`)

---

## O que está funcionando

### Backend (NestJS + Prisma)

| Módulo | Endpoints | Status |
|--------|-----------|--------|
| `auth` | POST /auth/login, /refresh, /logout, /register, /google | ✅ completo |
| `barbearia` | CRUD + `GET /barbearias/publico` | ✅ completo |
| `agendamento` | CRUD + /meus, /proximo, /atual | ✅ completo |
| `servico` | CRUD + `GET /servicos/metricas` | ✅ completo |
| `usuario` | Perfil, avatar upload | ✅ completo |
| `agenda` (walk-in) | Fila de espera | ✅ completo |
| `relatorio` | Métricas de barbearia | ✅ completo |
| `notificacao` | WebSocket em tempo real | ✅ completo |
| `push-token` | POST/DELETE /push-tokens | ✅ completo |
| `tenant` | Guard multi-tenant via `x-tenant-id` | ✅ completo |
| `health` | GET /health | ✅ completo |

### Frontend Web (Next.js + Tailwind)

| Feature | Status |
|---------|--------|
| Dashboard (stats, agenda do dia) | ✅ completo |
| Serviços (CRUD + métricas reais) | ✅ completo |
| Agenda (agendamentos + status) | ✅ completo |
| Clientes | ✅ completo |
| Barbeiros | ✅ completo |
| Relatórios (ranking barbeiros, receita) | ✅ completo |
| Configurações (perfil barbearia, tema) | ✅ completo |
| Auth (login, Google OAuth) | ✅ completo |

### Mobile (Expo SDK 54 + React Native)

| Tela | Role | Status |
|------|------|--------|
| `/(cliente)/home` | cliente | ✅ hero card próximo agendamento real |
| `/(cliente)/agendamentos` | cliente | ✅ lista real via GET /agendamentos/meus |
| `/(cliente)/buscar` | cliente | ✅ busca real via GET /barbearias/publico |
| `/(cliente)/perfil` | cliente | ✅ completo |
| `/(barbeiro)/agenda` | barbeiro | ✅ agenda do dia + card "em atendimento" |
| `/(barbeiro)/fila` | barbeiro | ✅ fila walk-in |
| `/(barbeiro)/clientes` | barbeiro | ✅ completo |
| `/(barbeiro)/perfil` | barbeiro | ✅ completo |
| Push notifications | todos | ✅ registro de token Expo no login |

### Infraestrutura

- CI/CD: GitHub Actions com lint + types + tests + build + audit + deploy
- Docker: Dockerfile API + docker-compose para desenvolvimento
- Sentry: filtro de exceções 5xx alinhado com `ApiErrorPayload`
- Observabilidade: `nestjs-pino` (logs JSON em prod)

---

## Débitos técnicos conhecidos

| # | Descrição | Branch |
|---|-----------|--------|
| 4 | `packages/config` tinha `env.ts` provisório — implementado com conteúdo real | `chore/packages-config` |
| 5 | Docs desatualizados (fases marcadas como pendentes já foram concluídas) | `docs/atualizar-status` |
| 6 | Baseline de métricas nunca foi medido formalmente | `chore/metricas-baseline` |
| 7 | `style={{}}` legados no web (`BarbeirosRanking` e outros) | `refactor/remover-style-inline` |
| 8 | `sentry.filter.ts` emitia payload diferente do `ApiErrorPayload` | `fix/sentry-filter-api-error-payload` |

---

## Qualidade

| Frente | Testes | Lint | Types |
|--------|--------|------|-------|
| API | 168 passing | ✅ | ✅ |
| Web | 123 passing | ✅ | ✅ |
| Mobile | 256 passing | ✅ | ✅ |

---

## Próximas features planejadas

Consultar `docs/toqe_plano_estrategico.md` para o roadmap completo. Itens de médio prazo ainda abertos:

- Testes de integração com Testcontainers (BD real)
- Testes E2E web (Playwright)
- Testes E2E mobile (Maestro)
- Testes de carga (k6)
- Medição formal de baseline de performance (cold start, bundle size)
