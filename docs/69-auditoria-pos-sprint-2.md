# 69 — Auditoria pós-sprint (segunda rodada): UX do barbeiro

**Status:** Implementado (validação visual no device pendente — só o usuário)
**Branch:** develop

## Contexto

Segunda auditoria do app barbeiro (8 itens). Itens 1, 3c e 8 já estavam
concluídos em rodadas anteriores (fila invalida `["fila"]`; "no-show"→"Não
compareceu"; `AgendamentoModal.spec` só mocka infra). Os demais foram corrigidos,
um commit por item.

## Itens corrigidos

| Item                          | Mudança                                                                                                                                                                                   | Arquivos-chave                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 3 — termos técnicos           | removido "Será inserido como WALK_IN…"; empty da agenda "walk-in"→"encaixe"                                                                                                               | `AdicionarWalkInModal.tsx`, `agenda.tsx`                                                                          |
| 4 — "Não compareceu"          | sai de `em_andamento` (cliente já veio) e vai p/ `confirmado`; em_andamento mostra só "Concluir"                                                                                          | `AppointmentDetailSheet.tsx`                                                                                      |
| 7 — tab inativa               | token `tabInactive` (#888888 dark, ≈5.3:1 — passa WCAG AA) substitui `textDisabled` (#333)                                                                                                | `theme/tokens.ts`, `ui/tab-bar-options.tsx`                                                                       |
| 5 — Ver histórico / Reagendar | histórico reabre `ClienteDetalhe` na agenda (montado do agendamento; stats ausentes → "—"); reagendar abre o Encaixe pré-preenchido (props `prefillNome`/`prefillServicoId`)              | `agenda.tsx`, `AdicionarWalkInModal.tsx`                                                                          |
| 2 — email do encaixe          | `email` opcional no walk-in (só no contrato walk-in); servidor gera um único `@toqe.internal` quando ausente e pula o dedup por email                                                     | `contracts/agendamento.ts`, `api/membro-barbearia.service.ts`, `AdicionarWalkInModal.tsx`, `use-criar-walk-in.ts` |
| 6 — arrastar p/ fechar        | `GestureHandlerRootView` no root; `Gesture.Pan` no handle do `BottomSheet` e do `AdicionarWalkInModal` (fecha além do limiar/velocidade, senão volta); handle com `testID="sheet-handle"` | `app/_layout.tsx`, `ui/BottomSheet.tsx`, `AdicionarWalkInModal.tsx`, `jest.setup.js`                              |

## Notas

- **Item 2 (server-side email):** `Usuario.email` é `@unique NOT NULL`; o
  contrato apenas torna o campo opcional na entrada — quem garante unicidade é o
  servidor (`upsertClienteUsuario`). O `criarClienteRapidoSchema` base (usado por
  "criar cliente rápido" e booking público) permanece com email obrigatório.
- **Item 6 (testes):** simulação de gesto no Jest é inviável; adicionado
  `react-native-gesture-handler/jestSetup` ao `jest.setup.js` (para os
  `GestureDetector` renderizarem) + Maestro `.maestro/flows/sheet-drag-close.yaml`.
  O fechamento por backdrop e por back do Android foram preservados.
- **Decisão de produto mantida:** navegação de dias (← →) na agenda.

## Follow-up (feedback de tela — fila do barbeiro)

Após validação visual, dois ajustes na seção de fila (`FilaSection`):

| Ponto                               | Problema                                                                                                   | Correção                                                                                                                                                                                | Arquivos-chave                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Cliente não saía da fila ao iniciar | a lista renderizava **todos** os itens da fila (inclusive `em_andamento`); o contador só somava `pendente` | a fila agora filtra **só quem aguarda** (`pendente`/`confirmado`); ao iniciar (`em_andamento`) o item sai da lista e o contador bate com o que aparece                                  | `FilaSection.tsx`                 |
| Bloco redundante                    | cada item mostrava nome/serviço/tempo **duas vezes** (linha `WalkInCard` + `FilaCard` logo abaixo)         | removido o `WalkInCard`; renderiza só o `FilaCard` (ordem + barra de espera). O CTA "Atender →" migrou para o header do `FilaCard` (nova prop `onAtender`), no lugar do badge de status | `FilaCard.tsx`, `FilaSection.tsx` |
| Pull-to-refresh não atualizava fila | o pull só refazia `useAgendaDia`; a fila (`useFilaDia`, query key `["fila"]`) ficava com cache stale       | o `refetch` do pull agora também invalida `["fila"]` (via `queryClient.invalidateQueries`) — puxar a agenda recarrega agenda **e** fila                                                 | `agenda.tsx`                      |

> **Por que o item já saía no backend mas continuava na tela:** `useUpdateStatus`
> já invalidava `["fila"]` ao atender, mas a `FilaSection` exibia o item
> `em_andamento` que voltava no GET (`tipo=WALK_IN` retorna todos os status). O
> filtro client-side resolve sem novo endpoint.

### "Ver histórico" mostra os mesmos dados da aba Clientes

O `ClienteDetalhe` lia `totalVisitas`/`ticketMedio`/`ultimaVisita`/`servicoFav`
**direto da prop `cliente`** (só histórico/nota eram buscados por id). Aberto
pela agenda, o objeto vinha do agendamento com zeros → stats em branco ("—"),
divergindo da aba Clientes.

**Correção (enriquecimento dentro do `ClienteDetalhe`):** o próprio componente
agora busca os stats pela **mesma** fonte da aba Clientes
(`useClientesDaBarbearia()` → `GET /barbearias/:id/clientes`, query key
`["clientes"]`) e casa por `codigo`. O caller só precisa passar `codigo`/`nome`;
os campos exibidos usam `enriched ?? cliente`. Como o componente **assina** a
query, ele re-renderiza sozinho quando ela resolve — **sem corrida de cache**
(diferente de resolver no `onPress` da agenda, que fixava os dados uma vez).
Backend confirma o casamento de id: `findClientes` retorna `usuario.codigo`, e o
`cliente.usrCodigo` do agendamento é o mesmo código. Arquivos:
`ClienteDetalhe.tsx`, `agenda.tsx` (passa só o parcial).

### Pull-to-refresh padronizado (DRY) + refresh de todas as abas

Havia **3** implementações soltas de `RefreshControl` (agenda/clientes com
spinner preto `palette.text`; perfis com âmbar; agendamentos sem cor) — falta de
reuso. Centralizado no hook `usePullToRefresh(refetch?, isRefetching?, offset?)`:

- **Cor única (âmbar `palette.primary`)** em iOS e Android, em todas as abas.
- **Refresh global:** ao puxar, além do `refetch` da tela, faz
  `queryClient.invalidateQueries()` (sem filtro) → a aba atual recarrega na hora
  e as inativas ficam stale e recarregam **ao abrir** (lazy). Um gesto cobre o
  app inteiro sem disparar N requisições de uma vez. Removeu o `handleRefresh`
  manual da agenda (que só invalidava `["fila"]`).
- **Posição:** a agenda tem o header **dentro** da lista (rola junto), então o
  spinner aparecia colado no topo (sob a status bar). Passando
  `refreshProgressViewOffset={insets.top}` o spinner desce para baixo da status
  bar — alinhado com as telas de header fixo (perfil/clientes/agendamentos), cujo
  scroll já começa abaixo do header. Único caso que precisou de offset.

Arquivos: `hooks/use-pull-to-refresh.ts` (novo), `ui/DataListWrapper.tsx`,
`(barbeiro)/agenda.tsx`, `(barbeiro)/perfil/index.tsx`,
`(cliente)/perfil/index.tsx`, `(cliente)/agendamentos/index.tsx`.

### Causa raiz do histórico zerado: API não honrava o contrato `cliente`

Investigando por que o "Ver histórico" continuava zerado mesmo após o
enriquecimento: a API retornava `agendamento.cliente` como `{ codigo, nome,
email }`, mas o contrato `AgendamentoResponse.cliente` (@toqe/shared, consumido
pelo mobile) é `{ usrCodigo, nome, telefone }`. Em runtime,
`cliente.usrCodigo` era **`undefined`** → a agenda passava código indefinido →
o enriquecimento por código nunca casava. O `telefone` (ligar/WhatsApp do
detalhe) também vinha `undefined` (nem era selecionado).

**Correção (API honra o contrato):** `INCLUDE_COMPLETO` passa a selecionar
`telefone`/`avatarUrl` (mantendo `codigo`/`email` para uso interno — checks de
ownership e job de notificação), e um serializador (`serialize-agendamento.ts`)
mapeia, na **saída do controller**, `cliente.codigo → usrCodigo` (+ telefone,
descartando email) e `barbeiro.codigo → usrCodigo` (+ avatarUrl). Aplicado em
todos os endpoints que retornam agendamento(s). O service segue retornando o
objeto cru (internamente usa `.cliente.codigo`). Zero mudança no mobile.
Arquivos: `agendamento.service.ts` (select), `serialize-agendamento.ts` (novo +
spec), `agendamento.controller.ts`.

### Healthcheck do dev no path errado (404 + flood de WARN)

`main.ts` exclui `health/*path` do prefixo `api/v1` → a rota real é
`/health/ready`. O `docker-compose.dev.yml` fazia o probe em
`/api/v1/health/ready` (404 a cada 30s, agora logado como WARN pela melhoria de
observabilidade 4xx). Corrigido para `/health/ready`, alinhando com
`docker-compose.yml` e `docker-compose.prod.yml`. Arquivo: `docker-compose.dev.yml`.

## Checks

mobile: tsc + lint limpos, suíte completa verde. api: tsc + specs verdes. web: tsc verde.

## Pendente (validação manual no device — só o usuário)

Atender→some da fila; CONFIRMADO mostra "Não compareceu" / EM_ANDAMENTO não;
"Ver histórico" abre o cliente certo; "Reagendar" abre Encaixe pré-preenchido;
arrastar p/ baixo fecha os 5 sheets; tab inativa legível.
