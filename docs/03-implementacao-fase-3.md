# Relatório de Implementação — Fase 3: Agenda e Serviços

Este documento registra o que foi desenvolvido na Fase 3, focada na lógica central de negócio do sistema Toqe.

---

## Módulo de Serviços (`ServicoModule`)

**Arquivos:**
- `src/servico/servico.module.ts`
- `src/servico/servico.service.ts`
- `src/servico/servico.controller.ts`
- `src/servico/dto/create-servico.dto.ts`

**Funcionalidades:**
- Endpoint `POST /servicos`: Cria um serviço vinculado ao tenant (`x-tenant-id`).
- Endpoint `GET /servicos`: Lista todos os serviços ativos da barbearia.
- Campos: `nome`, `precoBase` (Decimal), `duracaoBase` (em minutos).
- Ambos os endpoints são protegidos por `JwtAuthGuard`.

---

## Configuração de Slots por Barbearia

**Migration:** `20260507021449_add_slot_interval`

- Adicionado o campo `slotInterval` (inteiro, padrão 30 min) na tabela `TQE_BARBEARIA`.
- Cada barbearia pode definir sua própria grade de horários (ex: 15, 30 ou 60 minutos).
- Esse valor é consumido pelo motor de disponibilidade na hora de calcular os slots livres.

---

## Módulo de Agenda (`AgendaModule`)

**Arquivos:**
- `src/agenda/agenda.module.ts`
- `src/agenda/agenda.service.ts`
- `src/agenda/agenda.controller.ts`
- `src/agenda/dto/config-jornada.dto.ts`
- `src/agenda/dto/create-bloqueio.dto.ts`

### 1. Jornada de Trabalho

- **Endpoint:** `POST /agenda/jornada/:barbeiroId`
- Cada barbeiro configura sua jornada para cada dia da semana (`0=Dom` até `6=Sab`).
- Campos: `diaSemana`, `inicio`, `fim`, `almocoIni` (opcional), `almocoFim` (opcional).
- Lógica: `findFirst + update` ou `create` (upsert manual, necessário pois não há `@@unique` composto na migration atual).

- **Endpoint:** `GET /agenda/jornada/:barbeiroId`

### 2. Bloqueios de Agenda

- **Endpoint:** `POST /agenda/bloqueios/:barbeiroId`
- Permite marcar folgas, feriados ou pausas pontuais que impedem o agendamento.
- Campos: `inicio`, `fim` (timestamps), `motivo` (opcional).

### 3. Motor de Disponibilidade (Cálculo de Horários Livres)

- **Endpoint:** `GET /agenda/disponibilidade/:barbeiroId?data=YYYY-MM-DD&duracao=50`
- O cliente informa a data desejada e a duração total dos serviços.
- O sistema calcula os slots disponíveis cruzando:
  1. **Jornada de Trabalho** do dia da semana.
  2. **Horário de Almoço** (se configurado).
  3. **Agendamentos existentes** no dia (exceto cancelados/no_show).
  4. **Bloqueios manuais** existentes no dia.
- Retorna um array de horários livres no formato `HH:mm`.
- Dependência adicionada: `date-fns`.

---

## Módulo de Agendamentos (`AgendamentoModule`)

**Arquivos:**
- `src/agendamento/agendamento.module.ts`
- `src/agendamento/agendamento.service.ts`
- `src/agendamento/agendamento.controller.ts`
- `src/agendamento/dto/create-agendamento.dto.ts`

### Criação de Agendamento

- **Endpoint:** `POST /agendamentos` (protegido por JWT)
- O cliente envia: `barbeiroId`, `clienteId`, `inicio` (timestamp) e `servicosIds[]`.
- **Cálculo de Fim:** O sistema soma a `duracaoBase` de todos os serviços selecionados e define o horário de término automaticamente.
- **Snapshot de Preço/Tempo:** O preço e a duração são copiados para `TQE_AGENDAMENTO_ITEM` no momento do agendamento. Mudanças futuras nos serviços não afetam agendamentos já realizados.
- **Transação Atômica:** Todo o processo (validação de serviços, checagem de conflito, criação do agendamento e itens) ocorre dentro de uma única `$transaction`.
- **Validação de Conflito:** Antes de criar, verifica se o barbeiro não possui agendamentos ativos que conflitem com o horário solicitado.
- **Isolamento de Tenant:** Os serviços são validados dentro do `barCodigo` informado — não é possível usar serviços de outra barbearia.

---

## Commits Gerados

1. `feat(servico): implementa CRUD básico de serviços com isolamento de tenant`
2. `feat(agenda): implementa bloqueios manuais e motor de cálculo de horários disponíveis`
3. `feat(agendamento): implementa criação de agendamento transacional com múltiplos serviços e snapshot de preços`
4. `fix(agenda): resolve erros de tipagem e atualiza service de agenda para usar findFirst em jornada`
