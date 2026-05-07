# Relatório de Correções e Validação — Fases 1 a 3

Este documento registra os gaps identificados durante a auditoria das Fases 1-3 e as correções aplicadas.

---

## Gaps Identificados e Corrigidos

### 🔴 Gap 1 — `TenantGuard` implementado
**Problema:** Qualquer usuário logado conseguia acessar dados de qualquer barbearia apenas passando um `x-tenant-id` qualquer.

**Correção:**
- Criado `src/auth/guards/tenant.guard.ts`
- O guard consulta `TQE_MEMBRO_BARBEARIA` para verificar se o usuário tem vínculo com a barbearia
- Se não encontrar membro, lança `ForbiddenException`
- Injeta `req.user.perfil` e `req.user.barCodigo` para uso posterior no `RolesGuard`

---

### 🔴 Gap 2 — Roles do PostgreSQL criados via migration
**Problema:** A aplicação conectava como superuser, que ignora RLS por definição.

**Correção:**
- Migration `add_pg_roles` com `CREATE ROLE toqe_app LOGIN PASSWORD '...'`
- `GRANT SELECT, INSERT, UPDATE, DELETE` ao `toqe_app`
- `CREATE ROLE toqe_admin BYPASSRLS` para operações administrativas internas
- Aplicado via `prisma migrate dev`

---

### 🟡 Gap 3 — RBAC aplicado em todos os controllers
**Problema:** Um cliente poderia chamar `POST /servicos` ou configurar jornadas.

**Correção:**
- Criado `src/auth/decorators/roles.decorator.ts` (`@Roles`)
- Criado `src/auth/guards/roles.guard.ts` (`RolesGuard`)
- Aplicado nos controllers conforme a matriz de permissões:

| Endpoint | Perfis Permitidos |
|---|---|
| `POST /servicos` | dono, gerente |
| `GET /servicos` | todos os membros |
| `POST /agenda/jornada` | dono, gerente, barbeiro |
| `GET /agenda/disponibilidade` | todos os membros |
| `POST /agendamentos` | todos os membros |
| `POST /barbearias` | qualquer usuário logado (pré-tenant) |

---

### 🟡 Gap 4 — Duração correta por barbeiro (`BarbeiroServico`)
**Problema:** O agendamento usava `duracaoBase` do serviço, ignorando se aquele barbeiro específico tinha uma duração própria.

**Correção:**
- `AgendamentoService` agora faz `include: { barbeiros: { where: { barbeiroId } } }` na busca dos serviços
- Lógica de fallback: se `BarbeiroServico.duracaoMin` existir → usa; senão → usa `Servico.duracaoBase`
- Mesma lógica aplicada ao preço: usa `precoProprio` do barbeiro ou `precoBase` do serviço

---

### 🟡 Gap 5 — `FOR UPDATE SKIP LOCKED` no agendamento
**Problema:** A checagem de conflito com `findFirst` não garantia segurança em concorrência alta.

**Correção:**
- Substituído por query raw com `FOR UPDATE SKIP LOCKED`
- Conta os conflitos dentro da transação antes de inserir
- Se houver conflito, lança `ConflictException` (409), sem deadlock

---

## Status Final da Auditoria

| Gap | Criticidade | Status |
|---|---|---|
| TenantGuard ausente | 🔴 Crítico | ✅ Corrigido |
| Roles PostgreSQL não criados | 🔴 Crítico | ✅ Corrigido |
| RBAC nos controllers | 🟡 Médio | ✅ Corrigido |
| Duração por BarbeiroServico | 🟡 Médio | ✅ Corrigido |
| FOR UPDATE SKIP LOCKED | 🟡 Médio | ✅ Corrigido |
