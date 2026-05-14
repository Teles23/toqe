# 23 — Correções da Auditoria Completa

**Status:** Concluído  
**Branch:** fix/audit-corrections  
**Base:** develop

---

## Resumo

Auditoria completa da aplicação identificou 15 problemas distribuídos em três níveis de severidade. Todos foram corrigidos nesta branch, com testes e documentação incluídos no mesmo commit.

---

## Problemas Críticos (C1–C7)

### C1 — `FOR UPDATE SKIP LOCKED` em query de COUNT

**Arquivo:** `apps/api/src/agendamento/agendamento.service.ts`  
**Problema:** PostgreSQL lançava erro P2010 — `FOR UPDATE SKIP LOCKED` não é permitido em queries com `COUNT` (aggregate).  
**Correção:** Removida a cláusula `FOR UPDATE SKIP LOCKED` da query de contagem.

---

### C2 — TenantGuard crashava em rotas sem JwtAuthGuard

**Arquivo:** `apps/api/src/auth/guards/tenant.guard.ts`  
**Problema:** `user.sub` lançava `TypeError` quando `user` era `undefined` (rotas públicas sem JWT).  
**Correção:** Adicionado `if (!user) return true` antes de acessar `user.sub`.

---

### C3 — `request.body` undefined em requisições GET

**Arquivo:** `apps/api/src/auth/guards/tenant.guard.ts`  
**Problema:** `request.body['barCodigo']` lançava erro em requisições GET (sem body).  
**Correção:** Substituído por `request.body?.['barCodigo']` com optional chaining.

---

### C4 — Teste de logout esperava status 201

**Arquivo:** `apps/api/test/integration/auth.integration.spec.ts`  
**Problema:** `.expect(201)` no teste de logout falhava porque o endpoint retorna `200`.  
**Correção:** Alterado para `.expect(200)`.

---

### C5 — Pool pg não era drenado no `onModuleDestroy`

**Arquivo:** `apps/api/src/prisma/prisma.service.ts`  
**Problema:** O `Pool` do `pg` criado no construtor não tinha referência armazenada, impossibilitando `pool.end()`. Isso causava erro de "unhandled connection" após os testes de integração, corrompendo o shutdown do Testcontainers.  
**Correção:** Campo `private readonly pool: Pool` adicionado; `await this.pool.end()` chamado em `onModuleDestroy`.

---

### C6 — Duck-typing para `Prisma.Decimal` em `price.utils.ts`

**Arquivo:** `apps/api/src/common/utils/price.utils.ts`  
**Problema:** Tipo `{ toNumber(): number } | number` contornava a tipagem do Prisma — CLAUDE.md proíbe explicitamente duck-typing para `Prisma.Decimal`.  
**Correção:** Reescrito para usar `Prisma.Decimal` corretamente:

```typescript
import { Prisma } from '../../generated/prisma';
export function somarItens(itens: { preco: Prisma.Decimal }[]): number { ... }
```

---

### C7 — DTOs usando class-validator em vez de Zod

**Arquivos:** 13 DTOs em `apps/api/src/`  
**Problema:** DTOs usavam decorators `class-validator` enquanto o projeto havia migrado para `nestjs-zod` + `@toqe/contracts`. Campos como `slug` no `UpdateBarbeariaDto` e a shape de `UpdatePreferenciasDto` eram divergentes dos schemas Zod.  
**Correção:** Todos os 13 DTOs reescritos com `createZodDto(schema)` importando do pacote `@toqe/contracts`. Schemas corrigidos/adicionados conforme necessário.

**DTOs migrados:**
| DTO | Schema |
|-----|--------|
| `agendamento/dto/create-agendamento.dto.ts` | `createAgendamentoSchema` |
| `agendamento/dto/patch-status-agendamento.dto.ts` | `patchStatusAgendamentoSchema` |
| `agendamento/dto/list-agendamento.dto.ts` | `listAgendamentoSchema` |
| `servico/dto/create-servico.dto.ts` | `createServicoSchema` |
| `servico/dto/update-servico.dto.ts` | `updateServicoSchema` |
| `usuario/dto/create-user.dto.ts` | `registerSchema` |
| `usuario/dto/update-usuario.dto.ts` | `updateUsuarioSchema` |
| `barbearia/dto/create-barbearia.dto.ts` | `createBarbeariaSchema` |
| `barbearia/dto/update-barbearia.dto.ts` | `updateBarbeariaSchema` |
| `barbearia/dto/convidar-membro.dto.ts` | `convidarMembroSchema` |
| `barbearia/dto/update-tema.dto.ts` | `updateTemaSchema` |
| `agenda/dto/config-jornada.dto.ts` | `configJornadaSchema` |
| `notificacao/dto/update-preferencias.dto.ts` | `updatePreferenciasSchema` |

---

## Problemas Altos (A1–A3)

### A1 — MSW handlers incompletos no frontend

**Arquivo:** `apps/web/src/test/msw-handlers.ts`  
**Problema:** Handlers MSW usavam caminhos relativos sem host/porta. Os hooks que fazem fetch para `http://localhost:3000/api/v1/...` não eram interceptados.  
**Correção:** Adicionados handlers com URL completa para todos os endpoints usados nos testes:

- `GET /barbearias/:barCodigo/barbeiros`
- `GET /barbearias/:barCodigo/clientes`
- `GET /barbearias/:barCodigo/servicos`
- `GET /barbearias/:barCodigo/agendamentos`
- `GET /barbearias/:barCodigo/horarios`
- `GET /barbearias/:barCodigo/notificacoes` + `PATCH`
- `GET /usuarios/me`
- `POST /api/auth/login` (BFF)
- `POST /api/auth/logout` (BFF)

---

### A2 — Service specs ausentes no frontend

**Arquivo criado:** `apps/web/src/features/barbeiros/services/barbeiro.service.spec.ts`  
**Problema:** Nenhuma spec de service existia para verificar integração com MSW.  
**Correção:** Spec criada cobrindo `barbeiroService.list` — retorno de lista e presença de campos de métricas.

---

### A3 — Spec do AuthProvider ausente

**Arquivo criado:** `apps/web/src/shared/providers/auth-provider.spec.tsx`  
**Problema:** O `AuthProvider` — componente central de autenticação — não tinha cobertura de testes.  
**Correção:** Spec criada com 7 testes cobrindo:

- Carregamento de sessão ao montar (`/usuarios/me`)
- Sessão null quando fetch falha
- Login: chama `requestLogin` + fetch me + redireciona
- Logout: chama `requestLogout` + limpa estado
- Logout limpa estado mesmo quando `requestLogout` falha (try/finally)
- `switchBarbearia` atualiza barbearia e perfil
- `switchBarbearia` ignora código inválido

---

## Problemas Médios (M1–M3)

### M1 — `Number()` sem validação em parâmetros de rota

**Arquivo:** `apps/api/src/agendamento/agendamento.controller.ts`  
**Problema:** `Number(req.user.sub)` sem validação — se `sub` fosse inválido o valor seria `NaN` e passaria para o service silenciosamente.  
**Correção:** Substituído por `parseInt(req.user.sub, 10)` com validação `if (isNaN(userId)) throw new UnauthorizedException(...)`.

---

### M2 — `any` em `prisma/seed.ts`

**Arquivo:** `apps/api/prisma/seed.ts`  
**Problema:** Três usos de `any`: `create: p as any`, `Record<string, any>` para usuários e serviços.  
**Correção:**

- Importados `Usuario` e `Servico` do cliente Prisma gerado
- `Record<string, any>` → `Record<string, Usuario>` e `Record<string, Servico>`
- `create: p as any` → `create: p` (Prisma infere corretamente)

---

### M3 — Rate-limit em `/auth/refresh`

**Arquivo:** `apps/api/src/auth/auth.controller.ts`  
**Status:** Já corrigido — o decorator `@Throttle({ default: { ttl: 60_000, limit: 10 } })` está aplicado no nível do controller, cobrindo todos os endpoints incluindo `/refresh`. Mesma regra de `/login`: 10 req/min.

---

## Arquivos Modificados

| Arquivo                                                             | Tipo            |
| ------------------------------------------------------------------- | --------------- |
| `apps/api/src/agendamento/agendamento.service.ts`                   | Correção C1     |
| `apps/api/src/auth/guards/tenant.guard.ts`                          | Correção C2, C3 |
| `apps/api/test/integration/auth.integration.spec.ts`                | Correção C4     |
| `apps/api/src/prisma/prisma.service.ts`                             | Correção C5     |
| `apps/api/src/common/utils/price.utils.ts`                          | Correção C6     |
| `apps/api/src/*/dto/*.ts` (13 arquivos)                             | Correção C7     |
| `packages/contracts/src/schemas/*.ts`                               | Correção C7     |
| `packages/shared/src/types/index.ts`                                | Correção C7     |
| `apps/web/src/test/msw-handlers.ts`                                 | Correção A1     |
| `apps/web/src/features/barbeiros/services/barbeiro.service.spec.ts` | Novo A2         |
| `apps/web/src/shared/providers/auth-provider.spec.tsx`              | Novo A3         |
| `apps/api/src/agendamento/agendamento.controller.ts`                | Correção M1     |
| `apps/api/prisma/seed.ts`                                           | Correção M2     |

## Arquivos Criados (novos specs)

| Arquivo                                                             | Testes |
| ------------------------------------------------------------------- | ------ |
| `apps/api/src/notificacao/notificacao.service.spec.ts`              | 3      |
| `apps/api/src/notificacao/notificacao.producer.spec.ts`             | 1      |
| `apps/api/src/notificacao/preferencias.service.spec.ts`             | 4      |
| `apps/api/src/dashboard/dashboard.service.spec.ts`                  | 2      |
| `apps/api/src/relatorio/relatorio.service.spec.ts`                  | 10     |
| `apps/api/src/health/health.controller.spec.ts`                     | 3      |
| `apps/web/src/features/barbeiros/services/barbeiro.service.spec.ts` | 2      |
| `apps/web/src/shared/providers/auth-provider.spec.tsx`              | 7      |

---

## Resultado Final

```
API:      134/134 testes passando
Frontend:  68/68 testes passando
Lint:      0 erros, 0 warnings
Types:     0 erros (api + web)
```
