# Sprint 2 — Perfil do Usuário, Logout e Preferências de Notificação

**Status:** ✅ Concluída  
**Data:** 2026-05-07

---

## Objetivo

Completar o ciclo de sessão do usuário (perfil + logout) e permitir que cada usuário controle seus canais de notificação por barbearia.

---

## O que foi implementado

### 1. Perfil do Usuário Autenticado

**Módulo:** `apps/api/src/usuario/`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/usuarios/me` | JWT | Retorna perfil + lista de barbearias vinculadas |
| PUT | `/usuarios/me` | JWT | Atualiza nome, telefone ou avatarUrl |

**Arquivos criados/modificados:**
- `dto/update-usuario.dto.ts` — campos opcionais: `nome`, `telefone` (regex E.164), `avatarUrl` (URL válida)
- `usuario.service.ts` — adicionados `me()` e `update()`; `SELECT_PERFIL` como constante reutilizável (exclui `senhaHash`)
- `usuario.controller.ts` — implementado controller completo com `JwtAuthGuard`

**Detalhes do `GET /usuarios/me`:**
- Retorna: `codigo, nome, email, telefone, avatarUrl, ativo, criadoEm`
- Inclui array `membros` com `perfil + criadoEm + barbearia (codigo, nome, slug)`
- Útil para o app mobile montar o menu de barbearias do usuário

---

### 2. Logout

**Módulo:** `apps/api/src/auth/`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/logout` | JWT | Revoga o refresh token informado no body |

**Arquivos criados/modificados:**
- `dto/logout.dto.ts` — campo `refreshToken: string`
- `auth.service.ts` — método `logout()`: busca tokens ativos do usuário, compara hash, revoga
- `auth.controller.ts` — adicionado endpoint com `JwtAuthGuard`

**Detalhes:**
- Requer JWT válido no header (garante que só o próprio usuário pode revogar)
- Compara `refreshToken` recebido com os hashes no banco (bcrypt)
- Retorna 401 se o token não for encontrado ou já estiver revogado
- Tokens expirados são ignorados automaticamente pelo filtro `expiraEm > now`

---

### 3. Preferências de Notificação

**Módulo:** `apps/api/src/notificacao/`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/notificacoes/preferencias` | JWT + x-tenant-id | Retorna preferências do usuário nesta barbearia |
| PUT | `/notificacoes/preferencias` | JWT + x-tenant-id | Atualiza todos os canais de uma vez |

**Arquivos criados:**
- `dto/update-preferencias.dto.ts` — 4 campos booleanos: `email`, `push`, `whatsapp`, `sms`
- `preferencias.service.ts` — `find()` com defaults; `update()` via `deleteMany + createMany` em transação
- `preferencias.controller.ts` — endpoints com `JwtAuthGuard + TenantGuard`
- `notificacao.module.ts` — registra `PreferenciasService` e `PreferenciasController`

**Detalhes:**
- Preferências são **por usuário + por barbearia** (um cliente pode ter configs diferentes em cada barbearia)
- Defaults retornados quando não há registro: `email=true`, demais `false`
- PUT substitui todos os 4 canais atomicamente (deleteMany + createMany em transação)
- Resposta do GET e PUT é sempre: `{ email: bool, push: bool, whatsapp: bool, sms: bool }`

---

## Regras de negócio aplicadas

| Regra | Onde |
|-------|------|
| `senhaHash` nunca exposto na API | `SELECT_PERFIL` constante sem o campo |
| Logout requer JWT válido | `JwtAuthGuard` em `/auth/logout` |
| Preferências isoladas por tenant | `barCodigo` + `usrCodigo` na query |
| Canal `email` tem default `true` | `find()` inicializa com `email: true` |
| Substituição atômica de preferências | `$transaction([deleteMany, createMany])` |

---

## Próximos passos — Sprint 3

- [ ] White-label: controller `GET /barbearias/:codigo/tema` e `PUT /barbearias/:codigo/tema`
- [ ] Planos e `FeatureFlagGuard`: leitura de `PlanoLimite` + guard aplicado nos controllers
- [ ] WebSocket: salas por tenant para agenda em tempo real
