# 70 — Perfil do barbeiro: Jornada de Trabalho + Serviços e Preços

**Status:** Implementado (validação no device/web pendente — só o usuário)
**Branch:** develop
**Base:** doc 69 (auditoria pós-sprint 2)

## Contexto

Implementação das duas seções do Perfil do barbeiro que estavam incompletas:
**Jornada de Trabalho** (não carregava nem editava horários) e **Serviços e
Preços** (não havia preço por barbeiro, nem permissões, nem serviços exclusivos).
Backend + mobile + web, um commit por item, sem push.

---

## Bloco 1 — Jornada de Trabalho (mobile)

| Item                     | Mudança                                                                                                                                                                                                                                                                             | Commit    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1.1 carregar estado real | `useJornada` (GET `/agenda/jornada/:barbeiroId`) + `mergeJornadaComSemana` hidrata os 7 dias; a tela trocou `INITIAL_JORNADA` hardcoded por skeleton/erro/dados reais                                                                                                               | `9268b60` |
| 1.2/1.3 editar           | `TimeChip` read-only → `TimeField` (TextInput máscara `HH:mm`); toggle de dia inicializa defaults e revela os campos; validação client-side (HH:mm, início<fim, almoço dentro do expediente) espelhando o schema; `useSalvarJornada` envia o almoço **real** (não mais placeholder) | `2c1f1e2` |

Backend já existia (`GET`/`PUT /agenda/jornada/:id`, `configJornadaSemanalSchema`
exige almoço) — só faltava o mobile carregar e coletar.

---

## Bloco 2 — Serviços e Preços (schema + api + mobile + web)

### 2.1 — Migration (`604faeb`)

`add_permissoes_barbeiro_servico` (aditiva, defaults — sem reset/seed):

- `TQE_BARBEIRO_SERVICO.ativo` (barbeiro liga/desliga um serviço)
- `TQE_BARBEARIA.barbeiroCriaServico` / `barbeiroAlteraPreco` (permissões do dono)
- `TQE_SERVICO.exclusivoBarbeiroId` (FK→Usuario, ON DELETE SET NULL)
- Tipos `@toqe/shared`: flags em `BarbeariaResponse` + `ServicoBarbeiroResponse`

### 2.2/2.3 — Endpoints (`28acf43`)

- `GET /servicos/barbeiro/:barbeiroId` — lista consolidada (serviços da barbearia
  - exclusivos do barbeiro) com `precoEfetivo`/`duracaoEfetiva`/`ativo`/`exclusivo`
- `PATCH /servicos/barbeiro/:barbeiroId/:srvCodigo` `{ativo}` — upsert (nunca deleta)
- `PUT  /servicos/barbeiro/:barbeiroId/:srvCodigo` `{precoProprio?, duracaoMin}`
  — guard `barbeiroAlteraPreco` (dono/gerente sempre podem); 403 caso contrário
- `POST /servicos/barbeiro/:barbeiroId` — exclusivo; guard `barbeiroCriaServico`
  - 409 em nome duplicado
- **Ownership:** barbeiro só gerencia os próprios serviços; dono/gerente, qualquer um

### 2.4 — Tela mobile (`7da686d`)

`servicos.tsx` reescrita: preço efetivo (+ base riscado quando personalizado),
badge **EXCLUSIVO**, badge **"NÃO REALIZO"** no card desativado (permanece na
lista), toggle via PATCH (otimista), sheet de edição de preço/duração (PUT, só
com `barbeiroAlteraPreco`), FAB "+" só com `barbeiroCriaServico`. 5 hooks novos +
`CriarServicoModal` ganhou modo `exclusivo`.

### 2.5 — Painel web do dono (`c75d25c`)

Seção "Permissões dos barbeiros" em `SecaoBarbearia` com 2 toggles. Contrato
`updateBarbeariaSchema` aceita as flags. **Bug latente corrigido:**
`configuracao.service.updateBarbearia` usava `PATCH` numa rota que só existe como
`@Put` → trocado para `PUT` (o salvar de configurações estava quebrado).

---

## Blocos 3 + 4 — Preço/duração e disponibilidade por barbeiro (`c8c4cc5`)

- **Snapshot do agendamento** já usava `precoProprio`/`duracaoMin` do barbeiro
  (`buildItensData`) — adicionado teste de regressão.
- **`getAvailableSlots`** aceita `srvCodigo` opcional: se o barbeiro desativou o
  serviço → sem slots; sem registro = valores base.
- **`listarBarbeiros` (público)** aceita `srvCodigo` e exclui barbeiros que não
  realizam aquele serviço.
- Controllers (agenda `disponibilidade`, público `barbeiros`) repassam `srvCodigo`.

---

## Decisões

- **Permissões na Barbearia** (não no membro): valem para todos os barbeiros do
  tenant; o dono controla no painel web.
- **Serviço exclusivo** = `TQE_SERVICO.exclusivoBarbeiroId` preenchido (não some
  da barbearia; aparece só para aquele barbeiro na lista consolidada).
- **Campo de hora** = `TextInput` com máscara `HH:mm` (sem nova dependência de
  date/time picker).
- **Desativar serviço nunca deleta** o registro `TQE_BARBEIRO_SERVICO` — só marca
  `ativo=false`; o card continua na lista, esmaecido.

## Checks

api: tsc + lint + 296+ specs verdes (migration aplicada no banco de dev).
mobile: tsc + lint limpos, suíte verde. web: tsc + lint + specs verdes.

## Pendente (validação manual — só o usuário)

Jornada: abrir → ver horários salvos; editar/ativar dia → salvar → reabrir
reflete. Serviços: toggle some/volta; editar preço (se permitido); FAB cria
exclusivo só se permitido. Web: toggles de permissão salvam. Booking: barbeiro
que desativou um serviço não aparece para ele.
