# 47 — API: Endpoints para Mobile Barbeiro

**Status:** Implementado  
**Branch:** `feat/mobile-barbeiro-screens`  
**Base:** `feat/mobile-barbeiro-screens`  
**PR:** para `develop`

---

## Contexto

Implementação dos 4 endpoints que faltavam no backend para suportar as telas mobile do barbeiro (doc 46). Cada endpoint foi criado com serviço, controller, module, testes unitários e migration Prisma.

---

## Arquivos Criados

| Arquivo                                                                         | Descrição                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/api/src/me/me.service.ts`                                                 | Lógica de `getStats` por período                                   |
| `apps/api/src/me/me.controller.ts`                                              | `GET /me/stats?periodo=mes\|semana`                                |
| `apps/api/src/me/me.module.ts`                                                  | Módulo NestJS do Me                                                |
| `apps/api/src/me/me.service.spec.ts`                                            | Testes unitários (4 cenários)                                      |
| `apps/api/src/convite/convite.service.ts`                                       | Lógica obterConvite + aceitarConvite                               |
| `apps/api/src/convite/convite.controller.ts`                                    | `GET /convite/:token` + `POST /convite/:token/aceitar`             |
| `apps/api/src/convite/convite.module.ts`                                        | Módulo NestJS do Convite                                           |
| `apps/api/src/convite/convite.service.spec.ts`                                  | Testes unitários (6 cenários)                                      |
| `apps/api/src/convite/dto/aceitar-convite.dto.ts`                               | DTO via nestjs-zod                                                 |
| `apps/api/src/agendamento/dto/create-avaliacao.dto.ts`                          | DTO via nestjs-zod                                                 |
| `packages/contracts/src/schemas/convite.ts`                                     | Schema Zod `aceitarConviteSchema`                                  |
| `apps/api/prisma/migrations/20260521000000_add_avaliacao_convite/migration.sql` | DDL: tabelas `TQE_AVALIACAO_AGENDAMENTO` e `TQE_CONVITE_BARBEARIA` |

## Arquivos Modificados

| Arquivo                                                | Alteração                                                                                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                        | Adicionou `AvaliacaoAgendamento`, `ConviteBarbearia`, relação `avaliacao` em `Agendamento`, relação `convites` em `Barbearia` |
| `packages/contracts/src/schemas/agendamento.ts`        | Adicionou `createAvaliacaoSchema` e `CreateAvaliacaoInput`                                                                    |
| `packages/contracts/src/schemas/index.ts`              | Exporta `./convite`                                                                                                           |
| `apps/api/src/agendamento/agendamento.service.ts`      | Adicionou `avaliarAgendamento()`                                                                                              |
| `apps/api/src/agendamento/agendamento.controller.ts`   | Adicionou `POST /agendamentos/:codigo/avaliacao`                                                                              |
| `apps/api/src/agendamento/agendamento.service.spec.ts` | Adicionou `describe('avaliarAgendamento')` com 5 cenários                                                                     |
| `apps/api/src/agenda/agenda.service.ts`                | Adicionou `getProximosSlots()`                                                                                                |
| `apps/api/src/agenda/agenda.controller.ts`             | Adicionou `GET /agenda/proximos?dias=7`                                                                                       |
| `apps/api/src/agenda/agenda.service.spec.ts`           | Adicionou `describe('getProximosSlots')` com 3 cenários                                                                       |
| `apps/api/src/app.module.ts`                           | Registra `MeModule` e `ConviteModule`                                                                                         |
| `apps/api/src/test/prisma-mock.factory.ts`             | Adicionou `avaliacaoAgendamento` e `conviteBarbearia`                                                                         |

---

## Endpoints

### `GET /me/stats`

```
GET /me/stats?periodo=mes
Authorization: Bearer <jwt>
```

Retorna estatísticas do barbeiro autenticado para o período.

**Response:**

```json
{
  "atendimentos": 12,
  "faturamento": 48000,
  "presenca": 0.92,
  "ticketMedio": 4000
}
```

- `faturamento` e `ticketMedio` em centavos
- `presenca` = `concluido / (concluido + no_show)`, 1.0 se ambos zero

---

### `POST /agendamentos/:codigo/avaliacao`

```
POST /agendamentos/42/avaliacao
Authorization: Bearer <jwt>
x-tenant-id: 1
```

**Body:**

```json
{ "nota": 5, "comentario": "Ótimo atendimento!" }
```

**Validações:** agendamento deve pertencer ao cliente autenticado e ter status `concluido`. Retorna 409 se já avaliado.

---

### `GET /agenda/proximos`

```
GET /agenda/proximos?dias=7
Authorization: Bearer <jwt>
x-tenant-id: 1
```

Retorna os primeiros 6 slots disponíveis na barbearia.

**Response:**

```json
{
  "barbeiroNome": "João",
  "barbeiroInicial": "J",
  "servicoNome": "Corte",
  "servicoDuracao": 30,
  "servicoPreco": 4000,
  "slots": [
    { "inicio": "2026-05-22T14:30:00.000Z", "hora": "14:30", "dia": "Hoje" }
  ]
}
```

---

### `GET /convite/:token` + `POST /convite/:token/aceitar`

Endpoints públicos (sem autenticação).

`GET` retorna dados do convite incluindo `isNew` (se o email já tem conta).

`POST` aceita o convite: cria usuário se `isNew=true` (requer `nome` + `senha`), adiciona como membro da barbearia, marca `usadoEm`.

---

## Schema Prisma

```prisma
model AvaliacaoAgendamento {
  codigo            Int         @id @default(autoincrement())
  agendamentoCodigo Int         @unique
  nota              Int         @db.SmallInt
  comentario        String?
  criadoEm          DateTime    @default(now())
  agendamento       Agendamento @relation(...)
}

model ConviteBarbearia {
  codigo    Int       @id @default(autoincrement())
  token     String    @unique @default(cuid())
  barCodigo Int
  email     String
  perfil    String    @default("barbeiro")
  criadoEm  DateTime  @default(now())
  expiresAt DateTime
  usadoEm   DateTime?
  barbearia Barbearia @relation(...)
}
```
