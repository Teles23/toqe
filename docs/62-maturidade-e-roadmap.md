# 62 — Maturidade do produto e roadmap de sprints

**Documento:** Referência viva — atualizar a cada sprint concluída  
**Data base:** 24/05/2026  
**Branch de referência:** claude/header-refresh-standardize-opHyl

---

## Como ler este documento

- **Maduro** — código implementado, testado, rodando em produção. Pode ser vendido.
- **Parcial** — código existe, a feature é visível, mas tem uma lacuna técnica clara que a deixa incompleta.
- **Falta no MVP** — ausente ou stub. Precisa ser entregue antes de o produto ser considerado completo para o primeiro cliente pagante real.
- **Pós-MVP / Roadmap** — desejável mas não bloqueia o MVP.

---

## 1. Backend — API NestJS

| Módulo                                    | Status           | Observação                                                                                                                             |
| ----------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Auth (login, register, Google OAuth)      | **Maduro**       | JWT, refresh rotativo, bcrypt                                                                                                          |
| Auth — 2FA TOTP                           | **Maduro**       | Setup, enable, disable, verify                                                                                                         |
| Auth — sessões múltiplas e revogação      | **Maduro**       | GET/DELETE /auth/sessions                                                                                                              |
| Auth — reset de senha por email           | **Maduro**       | Resend + token com expiração                                                                                                           |
| Barbearia — CRUD + horários + logo        | **Maduro**       | Upload via multipart                                                                                                                   |
| Barbearia — membros + convite             | **Maduro**       | Convite com auto-login (doc 57)                                                                                                        |
| Tema/White-label                          | **Maduro**       | Cores, logo, subdomínio por tenant                                                                                                     |
| Agendamento — CRUD + ciclo de status      | **Maduro**       | PENDENTE→CONFIRMADO→EM_ANDAMENTO→CONCLUIDO                                                                                             |
| Agendamento — Walk-in transacional        | **Maduro**       | Endpoint dedicado, atomic                                                                                                              |
| Agendamento — avaliação pós-atendimento   | **Maduro**       | AvaliacaoAgendamento 1–5                                                                                                               |
| Agenda — jornada semanal transacional     | **Maduro**       | PUT 7 dias, atomic (doc 61)                                                                                                            |
| Agenda — bloqueios de agenda              | **Maduro**       | BloqueioAgenda com recorrência flag                                                                                                    |
| Agenda — disponibilidade + slots          | **Maduro**       | GET /disponibilidade/:barbeiroId                                                                                                       |
| Agenda — WebSocket gateway                | **Maduro**       | Gateway emite `agendamento:criado` e `agendamento:status`; web e mobile consomem eventos (Sprint A2/A3)                                |
| Serviços — CRUD + preços por barbeiro     | **Maduro**       | BarbeiroServico com preço/duração próprios                                                                                             |
| Dashboard — KPIs + live metrics           | **Maduro**       | Faturamento, agendamentos, barbeiros ativos, serviços populares                                                                        |
| Relatórios — 5 tipos                      | **Maduro**       | Faturamento, agendamentos, serviços, barbeiros, horários pico                                                                          |
| Relatórios — exportação CSV               | **Maduro**       | `?formato=csv` em todos os 5 endpoints; Content-Disposition header (Sprint B4)                                                         |
| Notificações — email via Resend/BullMQ    | **Maduro**       | Confirmação de agendamento + reset de senha                                                                                            |
| Notificações — push (envio pelo servidor) | **Maduro**       | `PushNotificationService` com expo-server-sdk; consumer BullMQ envia push ao cliente e barbeiro após confirmação (Sprint A1)           |
| Notificações — push deep-link (barbeiro)  | **Maduro**       | Payload `{ barCodigo, dataAgendamento }` no push do barbeiro; mobile navega para agenda na data certa ao tocar (Sprint B5)             |
| Notificações — WhatsApp / SMS             | **Falta no MVP** | Tabela de preferências existe (canal = 'whatsapp'/'sms'), mas zero lógica de envio implementada                                        |
| Lembretes automáticos (cron)              | **Maduro**       | `LembreteService` com `@Cron` a cada 30min; janelas 24h e 2h; push + email; flags `lembrete24hEnviado`/`lembrete2hEnviado` (Sprint A6) |
| Push de aniversário (cron)                | **Maduro**       | `@Cron('0 9 * * *')` filtra `dataNascimento` de hoje e envia push (Sprint B1)                                                          |
| Detecção de no-show (cron)                | **Maduro**       | `@Cron('0 */30 * * * *')` marca PENDENTE/CONFIRMADO expirados como NO_SHOW e notifica barbeiro (Sprint B6)                             |
| Histórico de atendimentos do barbeiro     | **Maduro**       | `GET /agendamentos/meus-atendimentos?limit=N` filtra por barbearia e barbeiro (Sprint B2)                                              |
| Reagendamento pelo cliente                | **Maduro**       | `PATCH /agendamentos/:codigo/reagendar` com verificação de ownership, status, conflito de horário (Sprint B3)                          |
| Gateway de pagamento Asaas                | **Maduro**       | `AsaasService` + `POST /asaas/checkout/:barCodigo` + `POST /asaas/webhook` (Sprint C1)                                                |
| Trial de 14 dias                          | **Maduro**       | `planoStatus='trial'` e `trialFim=now+14d` em barbearia.create(); cron `expirarTrials()` às 00:05 (Sprint C3)                         |
| Bloqueio de acesso por plano              | **Maduro**       | `PlanoAtivoGuard` global bloqueia requests quando `planoStatus ∉ {ativo, trial}` (Sprint C5)                                          |
| Emails de cobrança (cron)                 | **Maduro**       | `enviarEmailsCobranca()` diário às 09h: 5 dias antes, no vencimento, 3 dias após bloqueio (Sprint C4)                                 |
| Avaliações públicas no booking            | **Maduro**       | `GET /b/:slug/avaliacoes` — média, total e últimas 20 sem dado pessoal (Sprint D4)                                                    |
| Push Token — registro/delete              | **Maduro**       | Upsert por (usrCodigo, token)                                                                                                          |
| Cliente Nota — notas privadas             | **Maduro**       | TQE_CLIENTE_NOTA (doc 59)                                                                                                              |
| Booking público (/b/:slug)                | **Maduro**       | Servicos, barbeiros, slots, criar agendamento                                                                                          |
| Link público do barbeiro                  | **Maduro**       | Pré-seleciona barbeiro no booking público                                                                                              |
| Super Admin                               | **Maduro**       | MRR, barbearias, plano, status                                                                                                         |
| Feature flag por plano                    | **Maduro**       | FeatureFlagGuard — bloqueia `relatoriosAdv`, `whiteLabel`, `apiPublica`                                                                |
| Enforcement de limites numéricos          | **Maduro**       | `MembroBarbeariaService` verifica `maxBarbeiros`; `AgendamentoService` verifica `maxAgdMes` dentro da transação (Sprint A5)            |
| Gateway de pagamento                      | **Falta no MVP** | Plano é alterado manualmente via admin. Sem Stripe/Asaas/Pix                                                                           |
| Health checks                             | **Maduro**       | /health/live, /health/ready, /health/stats                                                                                             |
| Observabilidade (logs pino + Sentry)      | **Maduro**       | Structured logs + error tracking                                                                                                       |

---

## 2. Frontend Web — Next.js

| Feature / Página                          | Status      | Observação                                                                                          |
| ----------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| Login + Google OAuth                      | **Maduro**  |                                                                                                     |
| Onboarding (criar barbearia)              | **Maduro**  |                                                                                                     |
| Reset de senha                            | **Maduro**  |                                                                                                     |
| Dashboard                                 | **Maduro**  | KPIs, gráficos, live metrics                                                                        |
| Agenda — visualização + AgendamentoModal  | **Maduro**  |                                                                                                     |
| Agenda — tempo real (WebSocket)           | **Maduro**  | `useAgendaSocket` invalida query de agendamentos nos eventos `criado`/`status` (Sprint A2)          |
| Barbeiros — cadastro + jornada + serviços | **Maduro**  |                                                                                                     |
| Clientes — listagem + histórico           | **Maduro**  |                                                                                                     |
| Clientes — notas privadas (web)           | **Maduro**  | `ClienteDetalhe.tsx` com editor de nota via `useClienteNota` hook + MSW handlers (Sprint A4)        |
| Serviços — CRUD                           | **Maduro**  |                                                                                                     |
| Relatórios — 5 charts                     | **Maduro**  |                                                                                                     |
| Relatórios — botão Exportar CSV           | **Maduro**  | `handleExportar()` faz fetch autenticado + download via Blob/URL.createObjectURL (Sprint B4)        |
| Configurações — dados da barbearia        | **Maduro**  |                                                                                                     |
| Configurações — horários de funcionamento | **Maduro**  |                                                                                                     |
| Configurações — notificações              | **Parcial** | UI funcional e salva preferências, mas os canais WhatsApp/SMS não têm efeito no backend             |
| Configurações — Plano & Faturamento       | **Maduro**  | SecaoPlano mostra plano atual, trial countdown, botão de upgrade funcional via Asaas checkout (Sprint C2) |
| Booking público (/b/[slug])               | **Maduro**  |                                                                                                     |
| Super Admin                               | **Maduro**  | Overview, revenue, tenants, health                                                                  |

---

## 3. App Mobile — React Native / Expo

| Feature / Tela                                                    | Status     | Observação                                                                             |
| ----------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| Login email/senha + Google OAuth                                  | **Maduro** |                                                                                        |
| Cadastro                                                          | **Maduro** |                                                                                        |
| Onboarding (escolha de perfil)                                    | **Maduro** |                                                                                        |
| Convite com auto-login                                            | **Maduro** |                                                                                        |
| **BARBEIRO — Agenda diária**                                      | **Maduro** | Walk-in, iniciar/concluir, EM_ANDAMENTO                                                |
| **BARBEIRO — Clientes + notas privadas**                          | **Maduro** | Nota persistida via API (doc 59)                                                       |
| **BARBEIRO — Jornada semanal**                                    | **Maduro** | PUT transacional 7 dias (doc 61)                                                       |
| **BARBEIRO — Serviços e preços**                                  | **Maduro** |                                                                                        |
| **BARBEIRO — Perfil (editar, senha, 2FA, sessões, notificações)** | **Maduro** |                                                                                        |
| **BARBEIRO — Perfil — campo dataNascimento**                       | **Maduro** | Campo "DATA DE NASCIMENTO" na tela de edição; cron de push de aniversário (Sprint B1)  |
| **BARBEIRO — Histórico de atendimentos no perfil**                 | **Maduro** | Seção "Últimos atendimentos" via `useMeusAtendimentos` no perfil do barbeiro (Sprint B2)|
| **CLIENTE — Home**                                                | **Maduro** |                                                                                        |
| **CLIENTE — Buscar barbearia**                                    | **Maduro** |                                                                                        |
| **CLIENTE — QR Code**                                             | **Maduro** |                                                                                        |
| **CLIENTE — Booking completo**                                    | **Maduro** | Serviço → Barbeiro → Slot → Confirmar                                                  |
| **CLIENTE — Histórico de agendamentos**                           | **Maduro** |                                                                                        |
| **CLIENTE — Detalhe + avaliação**                                 | **Maduro** |                                                                                        |
| **CLIENTE — Cancelar agendamento**                                | **Maduro** | PATCH /agendamentos/:codigo/status → cancelado                                         |
| **CLIENTE — Reagendar agendamento**                               | **Maduro** | Tela de seleção de dia/hora; PATCH `/reagendar`; wired no detalhe (Sprint B3)          |
| **CLIENTE — Perfil (editar, senha, 2FA, sessões, notificações)**  | **Maduro** |                                                                                        |
| Push notifications — receber                                      | **Maduro** | expo-notifications + token registration funcionando                                    |
| Push notifications — servidor dispara                             | **Maduro** | API com expo-server-sdk; push ao cliente e barbeiro após confirmação (Sprint A1)       |
| Push notifications — deep-link barbeiro                           | **Maduro** | Tap na notificação navega para agenda na data do agendamento (Sprint B5)               |
| Tempo real (WebSocket)                                            | **Maduro** | `useAgendaSocket` conecta ao namespace `/agenda`, invalida cache na agenda (Sprint A3) |

---

## 4. O que falta para o MVP estar completo

~~Estes são os 5 itens que impedem considerar o produto "completo" para o primeiro cliente pagante.~~

**✅ Sprint A concluída em 24/05/2026 — todos os gaps do MVP foram fechados.**

| #   | Item                            | Status                                         |
| --- | ------------------------------- | ---------------------------------------------- |
| A1  | Push notifications end-to-end   | ✅ `PushNotificationService` + expo-server-sdk |
| A2  | WebSocket no web                | ✅ `useAgendaSocket` em `AgendaView`           |
| A3  | WebSocket no mobile             | ✅ `useAgendaSocket` na agenda do barbeiro     |
| A4  | Notas privadas no portal web    | ✅ `ClienteDetalhe` + `useClienteNota`         |
| A5  | Enforcement de limites de plano | ✅ `maxBarbeiros` + `maxAgdMes` verificados    |
| A6  | Lembretes automáticos (cron)    | ✅ `LembreteService` @Cron 30min               |

O produto agora tem ciclo de vida completo: cliente agenda → recebe push → aparece → é atendido → avalia → dono vê em tempo real. O próximo foco é Sprint B (retenção) ou Sprint C (monetização).

---

## 5. Roadmap por sprints — pós-MVP

### ~~Sprint A — Completar o núcleo~~ ✅ Concluída em 24/05/2026

**Objetivo:** fechar os gaps do MVP listados acima.

| #   | Feature                                                           | Esforço | Impacto | Status |
| --- | ----------------------------------------------------------------- | ------- | ------- | ------ |
| A1  | Push notifications end-to-end (expo-server-sdk na API + consumer) | M       | Alto    | ✅     |
| A2  | WebSocket no web — hook `useAgendaSocket` na tela de agenda       | P       | Alto    | ✅     |
| A3  | WebSocket no mobile — barbeiro vê agenda atualizar em tempo real  | P       | Alto    | ✅     |
| A4  | Notas privadas do cliente no portal web                           | P       | Médio   | ✅     |
| A5  | Enforcement `maxBarbeiros` e `maxAgdMes` no service               | P       | Médio   | ✅     |
| A6  | Cron de lembretes automáticos (24h antes + 2h antes)              | M       | Alto    | ✅     |

---

### ~~Sprint B — Retenção e confiança~~ ✅ Concluída em 24/05/2026

**Objetivo:** features que fazem o cliente voltar e o dono confiar no sistema.

| #   | Feature                                                                           | Esforço | Impacto | Status |
| --- | --------------------------------------------------------------------------------- | ------- | ------- | ------ |
| B1  | Lembrete de aniversário do cliente (data de nascimento + push/email)              | P       | Médio   | ✅     |
| B2  | Histórico de atendimentos no perfil do barbeiro                                   | P       | Médio   | ✅     |
| B3  | Reagendamento pelo cliente (novo slot sem sair do app)                            | M       | Alto    | ✅     |
| B4  | Relatório exportável (CSV) — todos os 5 endpoints + botão no web                 | P       | Médio   | ✅     |
| B5  | Push deep-link ao barbeiro com barCodigo + dataAgendamento                        | M       | Alto    | ✅     |
| B6  | Aviso de no-show automático (cron a cada 30min)                                   | P       | Médio   | ✅     |

---

### ~~Sprint C — Monetização~~ ✅ Concluída em 25/05/2026

**Objetivo:** cobrar os clientes de forma autônoma.

| #   | Feature                                                                     | Esforço | Impacto | Status |
| --- | --------------------------------------------------------------------------- | ------- | ------- | ------ |
| C1  | Integração Asaas (checkout de plano, webhook de pagamento)                  | G       | Crítico | ✅     |
| C2  | Upgrade/downgrade de plano no portal web (SecaoPlano funcional)             | M       | Alto    | ✅     |
| C3  | Trial de 14 dias com bloqueio automático ao expirar                         | M       | Alto    | ✅     |
| C4  | Email de cobrança (5 dias antes, no vencimento, 3 dias após)                | P       | Alto    | ✅     |
| C5  | Bloqueio de acesso para plano inadimplente (`PlanoAtivoGuard` global)       | P       | Alto    | ✅     |

---

### Sprint D — Crescimento (3–4 semanas)

**Objetivo:** viralidade e aquisição orgânica.

| #   | Feature                                                           | Esforço | Impacto | Status           |
| --- | ----------------------------------------------------------------- | ------- | ------- | ---------------- |
| D1  | WhatsApp Business API — notificações de confirmação e lembrete    | G       | Alto    | Pós-MVP / futuro |
| D2  | QR Code no portal web (para o dono imprimir e colar na barbearia) | P       | Médio   | ✅               |
| D3  | Widget de booking embeddable (iframe para site do cliente)        | G       | Médio   | Pós-MVP / futuro |
| D4  | Avaliações públicas na página de booking (/b/:slug)               | M       | Médio   | ✅               |
| D5  | Indicação: "Indique um amigo e ganhe 1 mês grátis"                | M       | Alto    | Pós-MVP / futuro |

---

### Sprint E — Escala (4–6 semanas)

**Objetivo:** expandir de barbearia unitária para redes.

| #   | Feature                                                               | Esforço | Impacto |
| --- | --------------------------------------------------------------------- | ------- | ------- |
| E1  | Multi-unidade — mesma conta, várias barbearias, dashboard consolidado | GG      | Alto    |
| E2  | Transferência de agendamento entre barbeiros                          | M       | Médio   |
| E3  | Programa de fidelidade (pontos por atendimento, resgate de desconto)  | G       | Alto    |
| E4  | API pública + webhooks documentados (para integrações externas)       | G       | Médio   |
| E5  | App para o gestor (hoje o dono só tem o portal web)                   | GG      | Médio   |

---

## 6. Legenda de esforço

| Sigla | Significado               |
| ----- | ------------------------- |
| P     | Pequeno — até 2 dias      |
| M     | Médio — 3 a 5 dias        |
| G     | Grande — 1 a 2 semanas    |
| GG    | Muito grande — 3+ semanas |

---

## 7. Decisão de prioridade recomendada

```
Sprint A (fechar MVP) → Sprint B (retenção) → Sprint C (monetização)
```

**Não investir em Sprint D ou E antes do Sprint C estar done.** Crescimento orgânico não adianta se o churn acontece por falta de lembrete automático ou se a cobrança ainda é manual.

O produto já tem tudo para ser vendido e demonstrado. O que falta é o ciclo de vida completo: cliente agenda → recebe push → aparece → é atendido → avalia → dono é cobrado automaticamente.

---

# Sprint E3 — Programa de Fidelidade

**Status:** Implementado
**Branch:** `claude/header-refresh-standardize-opHyl`
**Base:** `main`

## Objetivo

Implementar programa de pontos de fidelidade: clientes acumulam pontos por atendimento concluído e podem resgatá-los como desconto.

## Regra de Negócio

- **Ganho:** 1 ponto por R$ 10,00 de valor dos serviços; mínimo de 1 ponto por atendimento
- **Resgate:** mínimo de 10 pontos; cada ponto vale R$ 0,50 de desconto
- **Idempotência:** o ganho de pontos é verificado por `agendamentoCodigo` — re-processar não duplica

## Arquivos Criados

| Arquivo | Descrição |
|---|---|
| `apps/api/prisma/schema.prisma` | Modelo `PontoFidelidade` + campo `pontosAcumulados` em `Usuario` |
| `apps/api/prisma/migrations/20260525010000_fidelidade/migration.sql` | DDL: `TQE_PONTO_FIDELIDADE` + ALTER em `TQE_USUARIO` |
| `apps/api/src/fidelidade/fidelidade.module.ts` | Módulo NestJS de fidelidade |
| `apps/api/src/fidelidade/fidelidade.service.ts` | Service: `getSaldo`, `registrarGanho`, `getRanking`, `resgatar` |
| `apps/api/src/fidelidade/fidelidade.controller.ts` | Controller: rotas REST |
| `apps/api/src/fidelidade/dto/resgatar-pontos.dto.ts` | DTO de resgate |
| `apps/api/src/fidelidade/fidelidade.service.spec.ts` | Testes unitários (12 cenários) |
| `apps/mobile/src/features/cliente/FidelidadeCard.tsx` | Card React Native com saldo e botão de resgate |
| `apps/web/src/features/configuracoes/components/SecaoFidelidade.tsx` | Tabela Next.js com top clientes por pontos |
| `apps/web/app/fidelidade/page.tsx` | Página web de fidelidade |
| `apps/web/src/test/msw-handlers.ts` | Handlers MSW para testes frontend |

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `apps/api/src/agendamento/agendamento.service.ts` | Integração: chama `fidelidadeService.registrarGanho` quando status → `CONCLUIDO` |
| `apps/api/src/agendamento/agendamento.module.ts` | Importa `FidelidadeModule` |
| `apps/api/src/app.module.ts` | Registra `FidelidadeModule` |
| `apps/api/src/generated/prisma/` | Prisma client regenerado com `PontoFidelidade` |

## Endpoints

| Método | Rota | Roles | Descrição |
|---|---|---|---|
| `GET` | `/fidelidade/ranking?limit=10` | dono, gerente, barbeiro, recepcionista | Top clientes por pontos |
| `GET` | `/fidelidade/saldo/:clienteCodigo` | todos | Saldo + histórico do cliente |
| `POST` | `/fidelidade/resgatar` | todos | Resgata pontos por desconto |

## Schema Prisma

```prisma
model PontoFidelidade {
  codigo            Int       @id @default(autoincrement()) @map("TQE_PF_CODIGO")
  barCodigo         Int       @map("TQE_PF_BAR_CODIGO")
  clienteCodigo     Int       @map("TQE_PF_CLI_CODIGO")
  pontos            Int       @map("TQE_PF_PONTOS")
  tipo              String    @map("TQE_PF_TIPO") @db.VarChar(20) // 'ganho' | 'resgate'
  agendamentoCodigo Int?      @map("TQE_PF_AGD_CODIGO")
  criadoEm          DateTime  @default(now()) @map("TQE_PF_CRIADO_EM") @db.Timestamptz

  barbearia   Barbearia    @relation(fields: [barCodigo], references: [codigo])
  cliente     Usuario      @relation(fields: [clienteCodigo], references: [codigo])
  agendamento Agendamento? @relation(fields: [agendamentoCodigo], references: [codigo])

  @@map("TQE_PONTO_FIDELIDADE")
}
```

Campo adicionado em `Usuario`:
```prisma
pontosAcumulados Int @default(0) @map("TQE_USR_PONTOS_ACUMULADOS")
```

## Testes

```bash
# API unit tests
pnpm --filter api test -- src/fidelidade/fidelidade.service.spec.ts

# Cenários cobertos:
# getSaldo: sucesso, cliente não encontrado
# registrarGanho: sucesso, cálculo de pontos, mínimo 1 ponto, idempotência, agendamento não encontrado
# resgatar: sucesso, pontos < 10, saldo insuficiente, cliente não encontrado, decremento correto
```
