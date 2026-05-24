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
| Notificações — email via Resend/BullMQ    | **Maduro**       | Confirmação de agendamento + reset de senha                                                                                            |
| Notificações — push (envio pelo servidor) | **Maduro**       | `PushNotificationService` com expo-server-sdk; consumer BullMQ envia push ao cliente e barbeiro após confirmação (Sprint A1)           |
| Notificações — WhatsApp / SMS             | **Falta no MVP** | Tabela de preferências existe (canal = 'whatsapp'/'sms'), mas zero lógica de envio implementada                                        |
| Lembretes automáticos (cron)              | **Maduro**       | `LembreteService` com `@Cron` a cada 30min; janelas 24h e 2h; push + email; flags `lembrete24hEnviado`/`lembrete2hEnviado` (Sprint A6) |
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
| Configurações — dados da barbearia        | **Maduro**  |                                                                                                     |
| Configurações — horários de funcionamento | **Maduro**  |                                                                                                     |
| Configurações — notificações              | **Parcial** | UI funcional e salva preferências, mas os canais WhatsApp/SMS não têm efeito no backend             |
| Configurações — Plano & Faturamento       | **Parcial** | UI exibe os planos disponíveis mas **não há botão de upgrade funcional** — sem gateway de pagamento |
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
| **CLIENTE — Home**                                                | **Maduro** |                                                                                        |
| **CLIENTE — Buscar barbearia**                                    | **Maduro** |                                                                                        |
| **CLIENTE — QR Code**                                             | **Maduro** |                                                                                        |
| **CLIENTE — Booking completo**                                    | **Maduro** | Serviço → Barbeiro → Slot → Confirmar                                                  |
| **CLIENTE — Histórico de agendamentos**                           | **Maduro** |                                                                                        |
| **CLIENTE — Detalhe + avaliação**                                 | **Maduro** |                                                                                        |
| **CLIENTE — Cancelar agendamento**                                | **Maduro** | PATCH /agendamentos/:codigo/status → cancelado                                         |
| **CLIENTE — Perfil (editar, senha, 2FA, sessões, notificações)**  | **Maduro** |                                                                                        |
| Push notifications — receber                                      | **Maduro** | expo-notifications + token registration funcionando                                    |
| Push notifications — servidor dispara                             | **Maduro** | API com expo-server-sdk; push ao cliente e barbeiro após confirmação (Sprint A1)       |
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

### Sprint B — Retenção e confiança (2–3 semanas)

**Objetivo:** features que fazem o cliente voltar e o dono confiar no sistema.

| #   | Feature                                                                           | Esforço | Impacto |
| --- | --------------------------------------------------------------------------------- | ------- | ------- |
| B1  | Lembrete de aniversário do cliente (data de nascimento + push/email)              | P       | Médio   |
| B2  | Histórico de atendimentos no perfil do barbeiro (quantos cortes, faturamento)     | P       | Médio   |
| B3  | Reagendamento pelo cliente (cancelar + novo slot sem sair do app)                 | M       | Alto    |
| B4  | Relatório exportável (CSV) — faturamento e agendamentos                           | P       | Médio   |
| B5  | Confirmação manual pelo barbeiro (PENDENTE → CONFIRMADO via push action)          | M       | Alto    |
| B6  | Aviso de no-show automático (agendamento passou sem ser atendido → notifica dono) | P       | Médio   |

---

### Sprint C — Monetização (2–3 semanas)

**Objetivo:** cobrar os clientes de forma autônoma.

| #   | Feature                                                                     | Esforço | Impacto |
| --- | --------------------------------------------------------------------------- | ------- | ------- |
| C1  | Integração Asaas ou Stripe (checkout de plano, webhook de pagamento)        | G       | Crítico |
| C2  | Upgrade/downgrade de plano no portal web (SecaoPlano funcional)             | M       | Alto    |
| C3  | Trial de 14 dias com bloqueio automático ao expirar                         | M       | Alto    |
| C4  | Email de cobrança (5 dias antes, no vencimento, 3 dias após)                | P       | Alto    |
| C5  | Bloqueio de acesso para plano inadimplente (já tem `planoStatus` no schema) | P       | Alto    |

---

### Sprint D — Crescimento (3–4 semanas)

**Objetivo:** viralidade e aquisição orgânica.

| #   | Feature                                                           | Esforço | Impacto |
| --- | ----------------------------------------------------------------- | ------- | ------- |
| D1  | WhatsApp Business API — notificações de confirmação e lembrete    | G       | Alto    |
| D2  | QR Code no portal web (para o dono imprimir e colar na barbearia) | P       | Médio   |
| D3  | Widget de booking embeddable (iframe para site do cliente)        | G       | Médio   |
| D4  | Avaliações públicas na página de booking (/b/:slug)               | M       | Médio   |
| D5  | Indicação: "Indique um amigo e ganhe 1 mês grátis"                | M       | Alto    |

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
