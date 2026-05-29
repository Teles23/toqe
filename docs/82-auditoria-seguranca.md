# 82 — Auditoria de Segurança Sistêmica

**Status:** Implementado
**Branch:** `claude/security-audit-public-9iJ7X`
**Base:** develop

## Contexto

Auditoria sistemática de segurança cobrindo o monorepo completo (API NestJS, web Next.js, mobile React Native). Duas fases:

1. **Type safety e prevenção de regressão (Partes 1–7)** — fechou as classes de problema que causavam falhas silenciosas no CI
2. **Vulnerabilidades de segurança** — identificou e corrigiu 2 HIGH + 1 hardening defensivo

---

## Parte 1 — Mocks Prisma tipados (`jest-mock-extended`)

Mocks manuais (`{ findFirst: jest.fn() }`) não incluíam modelos novos do Prisma automaticamente. Quando um service passava a usar uma nova tabela, o spec compilava sem erro mas falhava em runtime.

**Solução:** `createPrismaMock()` → `mockDeep<PrismaClient>()`. 47 specs migrados.

| Arquivo                                    | Mudança                                                    |
| ------------------------------------------ | ---------------------------------------------------------- |
| `apps/api/src/test/prisma-mock.factory.ts` | `mockDeep<PrismaClient>()` substitui objeto literal manual |
| Todos os `*.service.spec.ts` da API        | Migrados para `createPrismaMock()`                         |

---

## Parte 2 — Serializers tipados + bug de produção

`serialize-agendamento.ts` retornava tipo inferido. Campos `usrCodigo` e `duracaoMin` estavam errados nos contratos (`codigo`/`duracao`), causando divergência silenciosa entre API, web e mobile.

**Bug de produção corrigido:** `use-agenda.ts` filtrava `a.barbeiro?.codigo` (sempre `undefined`) em vez de `a.barbeiro?.usrCodigo` — todos os barbeiros apareciam como "ociosos".

| Arquivo                                             | Mudança                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------- |
| `apps/api/src/agendamento/serialize-agendamento.ts` | Return type explícito `): AgendamentoAPI`                                        |
| `packages/contracts/src/types/api-responses.ts`     | `codigo → usrCodigo`, `duracao → duracaoMin`, `telefone`/`avatarUrl` adicionados |
| `packages/shared/src/types/index.ts`                | `email` removido de `AgendamentoResponse.cliente` (PII); `duracao → duracaoMin`  |
| `apps/web/src/features/agenda/hooks/use-agenda.ts`  | Bug `barbeiro?.codigo → barbeiro?.usrCodigo`                                     |
| 10 arquivos de test mobile + 1 web                  | Fixtures atualizados para os tipos corretos                                      |

---

## Parte 3 — MSW handlers tipados com `satisfies`

6 handlers críticos em `msw-handlers.ts` receberam `satisfies T` contra `@toqe/contracts`. Mudança no contrato agora quebra `tsc --noEmit` antes de qualquer commit.

---

## Parte 4 — Pre-push hook

`.husky/pre-push` criado:

```sh
pnpm check-types
pnpm --filter api test -- --onlyChanged
pnpm --filter web test -- --changed HEAD~1
```

Push falha localmente em ~30s se há erro de tipo ou teste quebrado.

---

## Parte 5 — Fronteiras de módulo (`no-restricted-imports`)

Cross-imports acidentais entre apps (`web←api`, `mobile←web`, etc.) são agora erro de lint nos 3 ESLint configs.

---

## Parte 6 — `no-explicit-any` habilitado na web

8 ocorrências existentes corrigidas na raiz (sem `eslint-disable`):

| Arquivo             | Correção                                                             |
| ------------------- | -------------------------------------------------------------------- |
| `stat-card.tsx`     | `IconComponent` tipado com props concretos de ícone                  |
| `use-persist-fn.ts` | `noop` constraint com `(...args: never[]) => unknown`                |
| `chart.tsx`         | `labelFormatter`/`formatter` com tipos `ChartPayloadItem` explícitos |

---

## Parte 7 — Matriz de impacto no CLAUDE.md

Tabela adicionada mapeando 9 categorias de arquivo para o que deve ser verificado no mesmo commit.

---

## Vulnerabilidades de segurança

### Vuln 1 — Webhook Asaas fail-open (HIGH)

**Arquivo:** `apps/api/src/asaas/asaas.controller.ts`

**Problema:** O endpoint `POST /asaas/webhook` só validava `asaas-access-token` quando `ASAAS_WEBHOOK_TOKEN` estava definido. Se ausente, qualquer chamante podia manipular `planoStatus` de qualquer barbearia (ativar planos gratuitamente, bloquear concorrentes).

**Correção:** Fail-closed — lança `InternalServerErrorException` quando `ASAAS_WEBHOOK_TOKEN` não está configurado.

```ts
// antes (fail-open)
if (webhookToken) {
  /* validar */
}

// depois (fail-closed)
if (!webhookToken)
  throw new InternalServerErrorException("ASAAS_WEBHOOK_TOKEN não configurado");
```

**Spec:** `apps/api/src/asaas/asaas.controller.spec.ts` — 8 testes novos.

---

### Vuln 2 — IDOR em fidelidade (HIGH)

**Arquivo:** `apps/api/src/fidelidade/fidelidade.controller.ts`

**Problema:** `POST /fidelidade/resgatar` e `GET /fidelidade/saldo/:clienteCodigo` aceitavam `clienteCodigo` externo sem verificar que o usuário autenticado era o próprio cliente. Qualquer usuário com papel `'cliente'` podia zerar o saldo de pontos de outro cliente (IDOR de escrita).

**Correção:** Ownership check para papel `'cliente'` nos dois endpoints. Staff (dono, gerente, barbeiro, recepcionista) mantém acesso irrestrito.

```ts
if (req.user.perfil === "cliente" && dto.clienteCodigo !== req.user.sub) {
  throw new ForbiddenException("Clientes só podem resgatar os próprios pontos");
}
```

**Spec:** `apps/api/src/fidelidade/fidelidade.controller.spec.ts` — 8 testes novos (IDOR bloqueado + acesso legítimo por perfil).

---

### Hardening defensivo — WebSocket null guard

**Arquivo:** `apps/api/src/agenda/agenda.gateway.ts`

O handler `handleJoin` usava `user?.sub` (optional chaining) no WHERE do Prisma. Se `user` fosse `undefined`, o campo seria ignorado pelo ORM e a query retornaria qualquer membro da barbearia. Não explorável com Socket.IO 4.x (protegido internamente), mas corrigido como defesa em profundidade.

```ts
if (!user) {
  client.emit("error", { message: "Não autenticado" });
  return;
}
```

---

## Resumo dos arquivos

| Arquivo                                                 | Tipo                           |
| ------------------------------------------------------- | ------------------------------ |
| `apps/api/src/test/prisma-mock.factory.ts`              | Modificado                     |
| `apps/api/src/agendamento/serialize-agendamento.ts`     | Modificado                     |
| `apps/api/src/asaas/asaas.controller.ts`                | Modificado — Vuln 1            |
| `apps/api/src/asaas/asaas.controller.spec.ts`           | Criado — 8 testes              |
| `apps/api/src/fidelidade/fidelidade.controller.ts`      | Modificado — Vuln 2            |
| `apps/api/src/fidelidade/fidelidade.controller.spec.ts` | Criado — 8 testes              |
| `apps/api/src/agenda/agenda.gateway.ts`                 | Modificado — null guard        |
| `packages/contracts/src/types/api-responses.ts`         | Modificado                     |
| `packages/shared/src/types/index.ts`                    | Modificado                     |
| `apps/web/src/features/agenda/hooks/use-agenda.ts`      | Modificado — bug fix           |
| `apps/web/src/test/msw-handlers.ts`                     | Modificado — satisfies         |
| `.husky/pre-push`                                       | Criado                         |
| `apps/api/eslint.config.mjs`                            | Modificado                     |
| `apps/web/eslint.config.js`                             | Modificado                     |
| `apps/mobile/eslint.config.js`                          | Modificado                     |
| `CLAUDE.md`                                             | Modificado — matriz de impacto |

## Testes após auditoria

| Suite         | Antes | Depois |
| ------------- | ----- | ------ |
| API (Jest)    | 448   | 462    |
| Web (Vitest)  | 236   | 236    |
| Mobile (Jest) | 602   | 602    |
