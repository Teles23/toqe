# 73 — Fila de encaixe: filtragem por compatibilidade de serviço

**Status:** Implementado (validação no device pendente — só o usuário)
**Branch:** develop
**Base:** doc 72 (correções Clientes + senha)

## Decisão de produto

A **fila de encaixe (walk-in) não tem escolha de barbeiro** — qualquer barbeiro
disponível pode atender. Mas nem todo barbeiro faz todo serviço. Então:

1. A **fila visual** de cada barbeiro mostra **apenas** encaixes compatíveis com
   os serviços que ele realiza.
2. Ao tocar **"Atender →"**, o backend **valida** que o barbeiro realiza o
   serviço do encaixe. Se não realiza, retorna **403** com mensagem clara.

## Regra de negócio (BarbeiroServico / `TQE_BARBEIRO_SERVICO`)

A compatibilidade vem de `BarbeiroServico` (`@@unique([barbeiroId, srvCodigo])`,
campo `ativo` default `true`):

| Estado do registro                    | Pode atender?                      |
| ------------------------------------- | ---------------------------------- |
| **Sem registro** (nunca configurou)   | ✅ sim (usa o padrão da barbearia) |
| `ativo = true`                        | ✅ sim                             |
| `ativo = false` (desativou o serviço) | ❌ não → 403                       |

Ou seja, só um registro **explícito** com `ativo=false` bloqueia. Encaixes com
múltiplos serviços: basta **um** serviço desativado para bloquear/filtrar.

## Itens

| Item   | Mudança                                                                                                                                                       | Commit    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Item 1 | Guard no `patchStatus`: `WALK_IN` → `em_andamento` valida `BarbeiroServico.ativo` do executor (`req.user.sub`); incompatível → 403. + specs                   | `e46c9e0` |
| Item 2 | `findAll` ganha modo `barbeiroCompativel`: com `barbeiroId`, exclui encaixes com serviço `ativo=false` do barbeiro (em vez de filtrar por designado). + specs | `f015a2a` |
| Item 3 | `useFilaDia` anexa `barbeiroCompativel=true` quando há `barbeiroId`; `FilaSection` passa `user.codigo` do barbeiro logado. + specs do hook                    | `71f1c63` |
| Item 4 | `FilaSection.handleAtender` mostra a mensagem REAL do backend (`err.body.message`) no toast de erro (ex.: 403); fallback genérico. + spec 403 na tela         | —         |
| Item 5 | Indicador visual de incompatibilidade — **pulado** (filtro no backend + toast já cobrem o MVP).                                                               | —         |

## Detalhes técnicos

### Item 1 — Guard ao iniciar encaixe (`agendamento.service.ts` / `.controller.ts`)

- `patchStatus(codigo, dto, barCodigo, executorId?)` ganha o `executorId` (vem do
  JWT via `req.user.sub`, passado pelo controller).
- Quando `dto.status === 'em_andamento'` **e** `agendamento.tipo === 'WALK_IN'`
  **e** há `executorId`: busca `BarbeiroServico` do executor com
  `srvCodigo IN (itens.srvCodigo)` e `ativo=false`. Se achar → `ForbiddenException`
  com "Você não realiza este serviço. Outro barbeiro deve atender."
- Demais transições (NORMAL, ou status ≠ em_andamento) **não** consultam
  `BarbeiroServico`.
- Specs (`agendamento.service.spec.ts`): sem registro → ok; ativo (sem inativo) →
  ok; `ativo=false` → 403 (sem `update`); NORMAL em_andamento → ok sem consulta;
  `confirmado` em WALK_IN → ok sem consulta. Controller spec passa `req.user.sub`.

### Item 2 — Fila compatível (`findAll` + `listAgendamentoSchema`)

- Contract: `listAgendamentoSchema` ganha `barbeiroCompativel: z.enum(["true","false"]).optional()`
  (string de query param; comparado com `=== 'true'` — sem `coerce`, que trataria
  `"false"` como truthy).
- `findAll` vira `async`. Quando `barbeiroId` **e** `barbeiroCompativel === 'true'`:
  busca os `BarbeiroServico` do barbeiro com `ativo=false`, e filtra
  `where.itens = { none: { srvCodigo: { in: [...] } } }` — exclui encaixes que
  tenham **algum** serviço desativado. Sem desativados → sem restrição.
  Sem `barbeiroCompativel`, `barbeiroId` mantém o filtro por barbeiro **designado**
  (comportamento anterior, usado fora da fila).
- Specs: exclui por itens quando há desativados; sem desativados não restringe;
  `barbeiroId` puro mantém filtro por designado.

## Endpoints afetados

- `PATCH /agendamentos/:codigo/status` — passa a validar compatibilidade ao
  iniciar um encaixe (403 quando incompatível).
- `GET /agendamentos?tipo=WALK_IN&barbeiroId=:id&barbeiroCompativel=true` —
  retorna a fila compatível com o barbeiro.

### Item 4 — Toast com a mensagem do backend (`FilaSection`)

- `mensagemBackend(err)` extrai `err.body.message` de um `ApiError` (string ou
  array do Nest). O `ApiError.message` é genérico ("HTTP 403: …"); a mensagem
  amigável vem no corpo.
- `handleAtender` `onError` → `showToast(mensagemBackend(err) ?? fallback, "error")`.
- Spec: PATCH 403 com `{ message }` → `showToast` chamado com a mensagem exata.

### Item 5 — Indicador visual (pulado)

Sem UI de "incompatível": o filtro no backend (item 3) tira os encaixes que o
barbeiro não faz, e o toast (item 4) cobre o caso de borda. Suficiente p/ o MVP.

## Comportamento no mobile

- A fila (`FilaSection`) só lista encaixes compatíveis (filtro no backend, item 3).
- Se ainda assim um encaixe incompatível for atendido, o toast mostra a mensagem
  real do backend (item 4).

## Checks

- api: `pnpm --filter api test -- agendamento` (45 verdes), `tsc` + `lint` limpos.
- mobile: `use-fila-dia` + `FilaSection` (11 verdes), `tsc` + `lint` limpos.

## Pendente (validação manual — só o usuário)

- Barbeiro **sem** `BarbeiroServico` → pode atender qualquer encaixe.
- Barbeiro com serviço **ativo** → atende o encaixe desse serviço.
- Barbeiro com serviço **desativado** → "Atender →" mostra toast com a mensagem.
- A fila só mostra encaixes compatíveis com o barbeiro logado.
