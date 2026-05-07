# Sprint 1 — CRUD Completo e Gestão de Membros

**Status:** ✅ Concluída  
**Data:** 2026-05-07

---

## Objetivo

Fechar os CRUDs incompletos que bloqueavam o MVP: serviços, agendamentos e gestão de membros da barbearia.

---

## O que foi implementado

### 1. CRUD Completo de Serviços

**Arquivo:** `apps/api/src/servico/`

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| POST | `/servicos` | dono, gerente | Cria serviço ✅ (já existia) |
| GET | `/servicos` | todos | Lista serviços ativos ✅ (já existia) |
| GET | `/servicos/:codigo` | todos | Detalha um serviço ✅ **novo** |
| PUT | `/servicos/:codigo` | dono, gerente | Atualiza nome/preço/duração/ativo ✅ **novo** |
| DELETE | `/servicos/:codigo` | dono, gerente | Desativa (soft delete via `ativo: false`) ✅ **novo** |

**Arquivos criados/modificados:**
- `dto/update-servico.dto.ts` — campos opcionais: nome, precoBase, duracaoBase, ativo
- `servico.service.ts` — adicionados `findOne`, `update`, `remove`
- `servico.controller.ts` — adicionados GET `:codigo`, PUT, DELETE

**Detalhes:**
- `DELETE` usa soft delete — o serviço não é removido do banco, apenas `ativo: false`
- `findAll` agora filtra apenas `ativo: true` e ordena por nome

---

### 2. CRUD Completo de Agendamentos

**Arquivo:** `apps/api/src/agendamento/`

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| POST | `/agendamentos` | todos | Cria agendamento transacional ✅ (já existia) |
| GET | `/agendamentos` | dono, gerente, barbeiro, recepcionista | Lista com filtros ✅ **novo** |
| GET | `/agendamentos/:codigo` | todos | Detalha um agendamento ✅ **novo** |
| PATCH | `/agendamentos/:codigo/status` | dono, gerente, barbeiro, recepcionista | Muda status ✅ **novo** |
| DELETE | `/agendamentos/:codigo` | todos | Cancela (soft delete) ✅ **novo** |

**Arquivos criados/modificados:**
- `dto/list-agendamento.dto.ts` — filtros opcionais: `data` (YYYY-MM-DD), `barbeiroId`, `status`
- `dto/patch-status-agendamento.dto.ts` — enum: `confirmado | cancelado | concluido | no_show`
- `agendamento.service.ts` — adicionados `findAll`, `findOne`, `patchStatus`, `cancel`
- `agendamento.controller.ts` — adicionados GET, GET `:codigo`, PATCH `:codigo/status`, DELETE

**Detalhes:**
- `GET /agendamentos` aceita query params: `?data=2026-05-10&barbeiroId=1&status=confirmado`
- `DELETE` muda status para `cancelado` (não remove do banco)
- `DELETE` retorna 400 se agendamento já estiver cancelado
- `INCLUDE_COMPLETO` reutilizado em todas as queries: itens com serviço, cliente, barbeiro, barbearia

---

### 3. Gestão de Membros da Barbearia

**Arquivo:** `apps/api/src/barbearia/`

| Método | Rota | Roles | Descrição |
|--------|------|-------|-----------|
| POST | `/barbearias` | autenticado | Cria barbearia ✅ (já existia) |
| GET | `/barbearias/:barCodigo/membros` | dono, gerente | Lista membros com dados do usuário ✅ **novo** |
| POST | `/barbearias/:barCodigo/membros` | dono, gerente | Convida membro por e-mail ✅ **novo** |
| DELETE | `/barbearias/:barCodigo/membros/:usrCodigo` | dono, gerente | Remove membro ✅ **novo** |

**Arquivos criados/modificados:**
- `dto/convidar-membro.dto.ts` — `email` (string) + `perfil` (enum: gerente | barbeiro | recepcionista | cliente)
- `barbearia.service.ts` — adicionados `findMembros`, `convidarMembro`, `removerMembro`
- `barbearia.controller.ts` — adicionados GET/POST/DELETE de membros

**Detalhes:**
- Convite é por e-mail — o usuário precisa ter conta criada (`/auth/register`)
- Retorna 404 se o e-mail não existir no sistema
- Retorna 409 se o usuário já for membro
- Retorna 400 se tentar remover o `dono` da barbearia
- `dono` não pode ser atribuído via convite (enum exclui esse perfil)

---

## Regras de negócio aplicadas

| Regra | Onde |
|-------|------|
| Soft delete em serviços | `ServicoService.remove` → `ativo: false` |
| Soft delete em agendamentos | `AgendamentoService.cancel` → `status: cancelado` |
| Dono não pode ser removido | `BarbeariaService.removerMembro` → throw 400 |
| Dono não pode ser convidado | `ConvidarMembroDto.perfil` → enum sem `dono` |
| Tenant isolation em todos os métodos | `barCodigo` validado no `findOne` antes de qualquer mutação |

---

## Próximos passos — Sprint 2

- [ ] `GET /usuarios/me` — perfil do usuário autenticado
- [ ] `PUT /usuarios/me` — editar nome, telefone, avatar
- [ ] `POST /auth/logout` — revogar refresh token
- [ ] `GET/PUT /notificacoes/preferencias` — canais de notificação por usuário
