# 64 — Testes que exercitam o código real (Fase 2 · lote 1)

**Status:** Implementado
**Branch:** develop
**Base:** auditoria pós-sprint — seção 1 (reescrita de specs mockados)

## Contexto

Vários specs mockavam a **lógica de negócio do próprio app** (hooks de dados com
`mockReturnValue`/fixtures inventadas), violando a regra do CLAUDE.md "testes
testam o código real". Este é o **lote 1** da Fase 2: reescrever os specs
prioritários para exercitarem os hooks/serviços/telas reais, mockando apenas o
**boundary HTTP**.

Estratégia (decidida com o usuário):

- **Mobile** — mockar só `global.fetch` (roteado por URL). O `api-client` real,
  os hooks reais (React Query) e a tela real rodam de verdade. Sessão (`useAuth`)
  e infra (`expo-secure-store`, `expo-router`, `expo-constants`, `useToast`)
  seguem mockados; sheets/modais com spec próprio continuam stubados.
- **Web** — usar os **handlers MSW reais** (`apps/web/src/test/msw-handlers.ts`),
  com `server.use(...)` para casos de erro/pendente/vazio. Só `useAuth` (sessão)
  e `sonner` (toast) ficam mockados.

## Specs reescritos

| Spec                                                                | Antes                                                                | Depois                                                                                                                                                        |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/app/(cliente)/agendamentos/__tests__/index.test.tsx`   | mockava `useAgendamentosMeus` com fixtures                           | `useAgendamentosMeus` real via `fetch` mockado; cobre loading/vazio/erro 500/itens/navegação/filtro próximos×histórico (7)                                    |
| `apps/mobile/app/(barbeiro)/__tests__/agenda.test.tsx`              | mockava `useAgendaDia`/`useUpdateStatus`/`useCriarBloqueio`          | hooks reais via `fetch` roteado (GET `/agendamentos?…`, PATCH `/:codigo/status`); cobre loading/vazio/erro/navegação de dias/stats/ações aceitar+iniciar (17) |
| `apps/web/src/features/agenda/components/AgendamentoModal.spec.tsx` | `vi.mock` de `useBarbeiros`/`useClientes`/`useServicos`/`useAgenda*` | hooks reais via MSW; cobre render/validação Zod real/POST com payload correto/erro 409/slots vazios/pendente (9)                                              |

## Detalhes relevantes

- O `api-client` mobile usa `fetch` global → mockar `global.fetch` exercita
  `request`/`handleResponse`/`tenantApi` reais (mais fiel que mockar o módulo).
- Agenda do barbeiro: as ações do detail sheet passam pelo `useUpdateStatus`
  real → o teste verifica o **PATCH** (`/agendamentos/:codigo/status` com
  `status` correto) além do toast.
- `servicoService.list` usa `tenantApi("/servicos")` → `${BASE}/servicos`, rota
  sem handler MSW default. O spec registra esse handler via `server.use` no
  `beforeEach` (não alterei o arquivo compartilhado de handlers).
- `FilaSection` segue stubada na agenda (tem spec próprio, já reescrito na Fase 1).

## Checks

`mobile` e `web`: tsc limpo, lint 0 erros. Suítes completas verdes
(os 3 specs reescritos: 7 + 17 + 9). API inalterada.

## Pendente (próximos lotes da Fase 2)

- Demais specs mobile (~60) e web (~20) que ainda mockam hooks de negócio.
- Specs de hooks que já mockam só o api-client (`use-*`) podem ser mantidos.
- Testcontainers (API integração) continua não rodando no host Windows.
