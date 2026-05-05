# TOQE SaaS - Plano Estratégico Completo

## 📌 OBJETIVO
Documento estruturado para guiar implementação passo a passo de um SaaS multi-tenant de barbearia.

---

# 🔥 FASE 1 — FUNDAÇÃO (COMEÇAR AQUI)

## A3 — AUTH JWT
- JWT com payload: user_id, bar_codigo, perfil
- Access Token curto (15min)
- Refresh Token com rotação
- Web: cookie httpOnly
- Mobile: SecureStore
- Tokens persistidos no banco (hash)

## A4 — RLS (SEGURANÇA)
- RLS ativado em todas tabelas
- Policy baseada em bar_codigo
- Uso obrigatório de set_config dentro de transaction
- Prisma sempre via wrapper (nunca direto)
- Suporte a super admin via flag

## A2 — AGENDA
- Separar agendamento de serviços (AGENDAMENTO + AGENDAMENTO_ITEM)
- Duração calculada por soma
- Snapshot de duração/preço
- Considerar:
  - agendamentos
  - bloqueios
  - jornada
- Uso de generate_series inicialmente
- Concorrência com FOR UPDATE SKIP LOCKED

## A5 — MIGRATIONS
- Uso de prisma migrate deploy em produção
- Nunca alterar migration antiga
- Versionamento disciplinado
- Revisão antes de aplicar

## A1 — MONOREPO
- Turborepo com apps: api, web, mobile
- Shared package com tipos
- Config centralizada
- Padronização de scripts

---

# 🔧 FASE 2 — INFRA

## B1 — DOCKER + VPS
- docker-compose com:
  - api
  - web
  - postgres
- Nginx como reverse proxy
- Variáveis via .env

## B2 — VERSIONAMENTO API
- /api/v1, /api/v2
- Manter versões antigas por período
- Evitar breaking changes sem versionar

## B3 — CI/CD
- GitHub Actions
- Deploy automatizado
- Build separado por app
- Estratégia de rollback

---

# 🚀 FASE 3 — ESCALA

## C1 — FILAS
- Introduzir Redis + BullMQ
- Usar para:
  - notificações
  - relatórios
  - tarefas pesadas

## C2 — NOTIFICAÇÕES
- Arquitetura desacoplada
- Suporte a múltiplos canais
- Uso de eventos

## C3 — TEMPO REAL
- WebSocket para tempo real
- Push notification como fallback

## C4 — PLANOS
- Controle por feature
- Limites por tenant
- Bloqueio automático por inadimplência

## C5 — OBSERVABILIDADE
- Logs estruturados
- Monitoramento básico
- Rastreamento por tenant

---

# 💰 FASE 4 — PRODUTO

## D1 — WHITE LABEL
- Suporte a subdomínios
- Tema por tenant

## D2 — CLOUD
- Preparar para migração
- Evitar acoplamento com VPS

## D3 — ESCALABILIDADE
- Stateless (JWT)
- Separação futura de serviços

## D4 — API PÚBLICA
- OAuth2
- Rate limit

## D5 — REGRAS DE NEGÓCIO
- Comissão de barbeiro
- Pacotes de serviços
- Fidelidade
- Caixa diário
- Multi-unidade

---

# 📌 PRIORIDADE REAL

1. AUTH + RLS
2. AGENDA
3. MIGRATIONS
4. INFRA
5. ESCALA
6. PRODUTO

---

# ⚠️ PRINCÍPIOS

- Segurança no banco, não só backend
- Multi-tenant desde o início
- Evitar complexidade prematura
- Evoluir por fases
- Nunca pular fundação

---

# 🚀 RESULTADO

Seguindo isso:
- Produto escalável
- Seguro
- Pronto para monetização
