# Sprint 3 — White-label, Planos com Feature Flags e WebSocket

**Status:** ✅ Concluída  
**Data:** 2026-05-07

---

## Objetivo

Implementar personalização visual por tenant (white-label), controle de acesso por plano (feature flags) e comunicação em tempo real via WebSocket para a agenda.

---

## O que foi implementado

### 1. White-label (TemaTenant)

**Módulo:** `apps/api/src/barbearia/`

| Método | Rota | Roles | Feature Flag | Descrição |
|--------|------|-------|--------------|-----------|
| GET | `/barbearias/:barCodigo/tema` | dono, gerente | — | Retorna o tema atual |
| PUT | `/barbearias/:barCodigo/tema` | dono, gerente | `whiteLabel` | Cria ou atualiza o tema |

**Arquivos criados/modificados:**
- `dto/update-tema.dto.ts` — campos opcionais: `corPrimaria`, `corFundo` (regex `#RRGGBB`), `logoUrl` (URL), `subdominio` (regex slug)
- `barbearia.service.ts` — `getTema()` com fallback para objeto vazio; `upsertTema()` via Prisma `upsert`
- `barbearia.controller.ts` — endpoints GET e PUT com guards encadeados

**Detalhes:**
- `GET` retorna defaults `null` se ainda não configurado (não há registro obrigatório)
- `PUT` usa Prisma `upsert` — cria na primeira vez, atualiza nas demais
- `PUT` bloqueia se o plano não tiver `whiteLabel=true` (via `FeatureFlagGuard`)

---

### 2. Planos e FeatureFlagGuard

**Módulo:** `apps/api/src/auth/guards/`

**Arquivos criados:**
- `decorators/feature.decorator.ts` — `@Feature('whiteLabel')` usa `SetMetadata`
- `guards/feature-flag.guard.ts` — guard que lê o plano da barbearia e verifica o flag no `PlanoLimite`

**Fluxo do guard:**
1. Lê a feature requerida via `Reflector` (`@Feature('...')`)
2. Extrai `barCodigo` do header `x-tenant-id`
3. Busca `barbearia.plano` e `barbearia.planoStatus`
4. Retorna 403 se `planoStatus !== 'ativo'`
5. Busca `PlanoLimite` pelo plano
6. Retorna 403 se o campo da feature for `false`

**Features disponíveis no schema `PlanoLimite`:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `maxBarbeiros` | Int? | Limite de barbeiros |
| `maxAgdMes` | Int? | Limite de agendamentos/mês |
| `whiteLabel` | Boolean | Personalização visual |
| `apiPublica` | Boolean | Acesso à API pública (OAuth2) |
| `relatoriosAdv` | Boolean | Relatórios avançados |

**Como usar em qualquer endpoint:**
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, FeatureFlagGuard)
@Feature('whiteLabel')
@Put('alguma-rota')
```

**Observação:** `PlanoLimite` é populado manualmente no banco. Exemplo de seed:
```sql
INSERT INTO "TQE_PLANO_LIMITE" (plano, max_barbeiros, max_agd_mes, white_label, api_publica, relatorios_adv)
VALUES
  ('free',       3,    100, false, false, false),
  ('pro',        10,  1000, true,  false, true),
  ('enterprise', null, null, true,  true,  true);
```

---

### 3. WebSocket — Agenda em Tempo Real

**Módulo:** `apps/api/src/agenda/`

**Arquivo criado:** `agenda.gateway.ts`

**Namespace:** `/agenda`

**Eventos do cliente → servidor:**

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `join-barbearia` | `barCodigo: number` | Entra na sala da barbearia |
| `leave-barbearia` | `barCodigo: number` | Sai da sala |

**Eventos do servidor → cliente:**

| Evento | Quando | Payload |
|--------|--------|---------|
| `agendamento:criado` | POST /agendamentos | Objeto completo do agendamento |
| `agendamento:status` | PATCH /agendamentos/:id/status | `{ codigo, status }` |

**Integração com AgendamentoService:**
- `create()` chama `agendaGateway.emitAgendamentoCriado(barCodigo, agendamento)` após commit
- `patchStatus()` chama `agendaGateway.emitStatusAtualizado(barCodigo, { codigo, status })`

**Como conectar (frontend/mobile):**
```javascript
const socket = io('http://localhost:3000/agenda');

socket.emit('join-barbearia', 1); // entra na sala da barbearia 1

socket.on('agendamento:criado', (agendamento) => {
  // atualiza agenda em tempo real
});

socket.on('agendamento:status', ({ codigo, status }) => {
  // atualiza status na tela
});
```

**Pacotes instalados:**
- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`

---

## Regras de negócio aplicadas

| Regra | Onde |
|-------|------|
| White-label bloqueado por plano | `FeatureFlagGuard` + `@Feature('whiteLabel')` |
| Plano inadimplente bloqueado | `FeatureFlagGuard` checa `planoStatus !== 'ativo'` |
| Salas isoladas por `barCodigo` | Room `barbearia-{barCodigo}` no Socket.io |
| Emissão fora da transação | Emit ocorre após commit do banco, sem risco de inconsistência |

---

## Próximos passos

Com as 3 sprints concluídas, o backend está com MVP completo. O que resta é produto avançado:

- [ ] Seed de `PlanoLimite` no banco de produção
- [ ] `SubscriptionGuard` — bloquear toda a API para barbearias inadimplentes
- [ ] Relatórios: queue `relatorios` + worker PDF (Sprint 4)
- [ ] API Pública OAuth2 (Sprint 4)
- [ ] Comissões de barbeiro — modelagem e endpoints (Sprint 4)
