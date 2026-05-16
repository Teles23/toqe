# 30 — Fila do Barbeiro (Walk-in)

**Status:** ✅ Implementado
**Branch:** `feat/fila-walk-in` → `mobile/base`
**Base:** Sequência canônica do projeto (após `28-funcionalidade-novo-agendamento.md` e `29-auth-seguranca-upload-logo.md`)

---

## Contexto

Walk-in = cliente chega na barbearia **sem agendamento prévio** e entra na fila. O barbeiro/recepcionista/dono adiciona o cliente à fila pelo app, escolhendo:

- Quem é o cliente (nome + e-mail; telefone opcional)
- Qual barbeiro vai atender (dropdown "Atender com:")
- Qual serviço (dropdown)

O cliente entra com status `PENDENTE` e o backend modela isso como `Agendamento.tipo = 'WALK_IN'` (campo já existia no Prisma, agora exposto via contracts/API/mobile).

---

## Mudanças backend

| Arquivo                                                     | Mudança                                                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts/src/schemas/agendamento.ts`             | `tipoAgendamentoSchema` exportado; `createAgendamentoSchema` ganha `tipo` opcional; `listAgendamentoSchema` ganha filtro `tipo` |
| `apps/api/src/agendamento/agendamento.service.ts`           | `create()`: aceita `tipo`, pula conflict check quando `WALK_IN`, status inicial `pendente`; `findAll()`: filtra por `tipo`      |
| `apps/api/test/integration/agendamento.integration.spec.ts` | +5 cenários walk-in (criação, conflito skip, tipo inválido, list filter, tenant isolation)                                      |

### Por que skip conflict para WALK_IN?

Walk-ins são uma **fila paralela ao calendário**. Não é raro um cliente chegar enquanto outro agendamento está marcado para o mesmo horário — o barbeiro decide manualmente a ordem (geralmente atende o agendado primeiro, depois o walk-in). Forçar conflict check bloquearia o caso de uso real.

`AGENDADO` e `ENCAIXE` continuam fazendo conflict check (têm horário marcado).

### API

```http
# Criar walk-in
POST /agendamentos
Header: x-tenant-id: 7
Authorization: Bearer <token>

{
  "barbeiroId": 99,
  "clienteId": 42,
  "servicosIds": [1, 3],
  "inicio": "2026-05-15T13:00:00.000Z",
  "tipo": "WALK_IN"
}

→ 201
{
  "codigo": 555,
  "tipo": "WALK_IN",
  "status": "pendente",
  ...
}
```

```http
# Listar fila do dia
GET /agendamentos?data=2026-05-15&tipo=WALK_IN[&barbeiroId=99]
Header: x-tenant-id: 7

→ 200 [Agendamento, Agendamento, ...]
```

---

## Mudanças mobile

### Hooks (`apps/mobile/src/shared/hooks/barbeiro/`)

| Hook                            | Responsabilidade                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `use-fila-dia.ts`               | TanStack Query → `GET /agendamentos?data=&tipo=WALK_IN[&barbeiroId=]`. staleTime 30s (fila muda rápido)                                                                                                            |
| `use-criar-walk-in.ts`          | Orquestra POST `/barbearias/:codigo/clientes` (se cliente novo) → POST `/agendamentos` `{ tipo: 'WALK_IN', ... }`. Reusa `criarClienteRapidoSchema` de `@toqe/contracts`. Invalida `['fila']` + `['agendamentos']` |
| `use-barbeiros-da-barbearia.ts` | `GET /barbearias/:codigo/barbeiros` — popula dropdown "Atender com:"                                                                                                                                               |
| `use-servicos.ts`               | `GET /servicos` — popula dropdown de serviços (filtrado por `ativo`)                                                                                                                                               |

### Componentes

| Componente             | Path                                             | Função                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Select<T>`            | `src/shared/ui/Select.tsx`                       | Picker padrão (faltava no design system). Pressable + Modal nativo + FlatList. Tipado em T qualquer                                                                               |
| `FilaCard`             | `src/features/barbeiro/FilaCard.tsx`             | Card com posição "1º, 2º, 3º", nome, serviço, horário de chegada, badge de status. Long-press → ActionSheet (Chamar / Concluído / No-show / Cancelar). Memoizado com `React.memo` |
| `AdicionarWalkInModal` | `src/features/barbeiro/AdicionarWalkInModal.tsx` | Modal full-screen com react-hook-form + zod: nome, email, telefone (opcional), 2 `Select`s (barbeiro, serviço). Submit chama `useCriarWalkIn`                                     |

### Tela

`apps/mobile/app/(barbeiro)/fila.tsx`:

- Header "Fila de atendimento"
- FlatList ordenada por `inicio` (com posição derivada do index)
- Pull-to-refresh, loading state, empty state ("Fila vazia. Toque em + para adicionar um walk-in.")
- FAB (+) abre `AdicionarWalkInModal`

---

## Testes

```bash
# Mobile (Jest + RNTL)
pnpm --filter mobile test

# Backend integração (requer Docker — usa Testcontainers)
pnpm --filter api test:integration
```

### Matriz de cobertura

| Suite                                                       | Cenários                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `use-fila-dia.test.tsx`                                     | enabled condicional, query string com `tipo=WALK_IN`, filtro `barbeiroId` opcional, queryKey muda com barbeiroId                |
| `use-criar-walk-in.test.tsx`                                | orquestração 2-calls, pula POST cliente quando clienteId fornecido, rejeita sem input, invalida `['fila']` + `['agendamentos']` |
| `Select.test.tsx`                                           | placeholder, label selecionado, abre modal + dispara onChange, `accessibilityRole='combobox'`, erro com `role=alert`            |
| `FilaCard.test.tsx`                                         | posição "1º/2º/3º", nome cliente, serviço, status traduzido (Aguardando/Em atendimento), multi-itens com "+N"                   |
| `AdicionarWalkInModal.test.tsx`                             | render condicional (visible), todos os campos, validação Zod impede submit, submit com payload correto, erro de mutation        |
| `fila.test.tsx`                                             | loading/empty/error, lista de FilaCards com posição ascendente, FAB abre modal                                                  |
| `agendamento.integration.spec.ts` (backend, Testcontainers) | criação WALK_IN, tipo inválido → 400, WALK_IN no mesmo horário de AGENDADO → sem 409, GET com filtro tipo, tenant isolation     |

**Mobile total:** 23 suites, 112 testes (de 17/83 antes).

### Maestro E2E

`.maestro/flows/barbeiro-fila.yaml`:

1. Login como barbeiro → aba "Fila"
2. Tap FAB +
3. Preenche nome, email, escolhe barbeiro + serviço
4. Tap "Adicionar à fila"
5. Verifica cliente na lista

---

## Segurança / Performance / Escalabilidade

### Segurança

- Walk-in herda toda a camada de auth/RBAC do agendamento existente (`@Roles('dono', 'gerente', 'barbeiro', 'recepcionista')` no controller)
- `x-tenant-id` obrigatório — testado em `tenant-isolation.integration.spec.ts` para garantir que walk-ins da barbearia A não vazam para B
- Form mobile valida com Zod antes de enviar (não confia no input do usuário)

### Performance

- `useFilaDia` staleTime 30s → recarrega só se ficar mais que isso parado
- `FilaCard` envolvido em `React.memo` → re-render apenas quando muda
- `useUpdateStatus` invalida cache só na queryKey relevante
- Mutation onSuccess invalida `['fila']` + `['agendamentos']` (cobre ambas as telas)

### Escalabilidade

- Backend: `tipo` é VARCHAR(20) — suporta novos tipos futuros (ENCAIXE já reservado) sem migration
- Mobile: `Select<T>` é genérico — reusa para qualquer dropdown novo
- Estrutura `tipoAgendamentoSchema` permite expansão (novo tipo = 1 entrada no enum + 0 mudanças no consumer)

---

## Conhecidos / TODO futuro

- Se o POST `/agendamentos` falhar após o POST `/clientes`, o cliente fica órfão. Mitigar criando endpoint transacional `POST /walk-ins` no backend (envelope cliente+agendamento atômico) numa próxima fase.
- "Fila geral" (sem barbeiro fixo, próximo barbeiro disponível pega da fila) não é suportada — precisa migration de `barbeiroId` para nullable + endpoint "pegar próximo". Não há demanda atual.
