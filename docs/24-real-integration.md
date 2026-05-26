# 24 — Integração real API ↔ Web

**Status:** Completo  
**Branch:** `feat/real-integration` (a partir de `develop`)  
**Base:** após `23-audit-corrections`

---

## Objetivo

Conectar todas as telas do frontend à API real, eliminando 100% dos dados mockados nas telas e garantindo que cada feature consome e persiste dados reais.

---

## Gaps resolvidos

| Gap | Descrição                                           | Status |
| --- | --------------------------------------------------- | ------ |
| G1  | Dashboard 100% mock → endpoint real                 | ✅     |
| G2  | Serviços sem mutations → CRUD completo              | ✅     |
| G3  | Barbeiros sem convidar/remover → modal + mutations  | ✅     |
| G4  | Clientes sem criação → modal + endpoint novo na API | ✅     |
| G5  | Agenda sem criar agendamento → modal + mutation     | ✅     |

---

## G1 — Dashboard

### API

- `DashboardService.getOverview()` expandido para retornar o shape completo:
  `{ kpis, liveMetrics, barbeiros, faturamento, servicos, atividade }`
- Cálculos reais via Prisma: faturamento hoje/mês, ticket médio, barbeiros ao vivo, serviços populares, feed de atividade

### Frontend

- `dashboard.service.ts`: removido mock completo, conectado a `barbeariaApi(barCodigo).get('/dashboard')`
- `use-dashboard-overview.ts`: aceita `barCodigo` como argumento
- `QUERY_KEYS.dashboard(barCodigo)`: chave agora inclui `barCodigo`
- `dashboard/page.tsx`: passa `barbearia?.codigo` para o hook via `useAuth`

### Arquivos modificados

| Arquivo                                                                | Mudança                                        |
| ---------------------------------------------------------------------- | ---------------------------------------------- |
| `apps/api/src/dashboard/dashboard.service.ts`                          | Reescrito com métodos privados para cada seção |
| `apps/api/src/dashboard/dashboard.service.spec.ts`                     | Spec atualizado para novo shape                |
| `apps/web/src/features/dashboard/services/dashboard.service.ts`        | Mock removido, chama API real                  |
| `apps/web/src/features/dashboard/hooks/use-dashboard-overview.ts`      | Aceita `barCodigo`                             |
| `apps/web/src/features/dashboard/hooks/use-dashboard-overview.spec.ts` | Spec atualizado                                |
| `apps/web/src/shared/lib/constants.ts`                                 | `QUERY_KEYS.dashboard` aceita `barCodigo`      |
| `apps/web/src/app/(dashboard)/dashboard/page.tsx`                      | Passa `barCodigo`                              |

---

## G2 — Serviços

### Frontend

- `useServicoMutations(barCodigo)`: create/update/remove com invalidação de query
- `ServicoModal`: reescrito com `react-hook-form` + `zodResolver(createServicoSchema)`
- `ServicoDetalhe`: recebe `onDelete` prop, botão Trash2 funcional
- `ServicosView`: passa `onDelete` via `useServicoMutations`
- `servico.service.ts`: tipos corrigidos para `CreateServicoInput`/`UpdateServicoInput`

### Testes

- 4 novos testes em `use-servicos.spec.ts` para `useServicoMutations`
- Handlers MSW: `POST/PUT/DELETE /barbearias/:id/servicos`

---

## G3 — Barbeiros

### Frontend

- `barbeiroService.convidar/remover`: novos métodos
- `useBarbeiroMutations(barCodigo)`: mutations `convidar` e `remover`
- `BarbeiroModal`: criado com `react-hook-form` + `zodResolver(convidarMembroSchema)`
- `BarbeirosView`: botão "Novo barbeiro" abre modal

### Testes

- 2 novos testes em `use-barbeiros.spec.ts` para `useBarbeiroMutations`
- Handlers MSW: `POST/DELETE /barbearias/:id/membros`

---

## G4 — Clientes

### API (novo endpoint)

- `criarClienteRapidoSchema` em `@toqe/contracts`: `{ nome, email, telefone? }`
- `MembroBarbeariaService.criarCliente()`: cria usuário com senha temporária se não existir, vincula como cliente
- `POST /barbearias/:id/clientes`: roles `dono | gerente | recepcionista`
- `CriarClienteRapidoDto` via `createZodDto`

### Frontend

- `clienteService.criar(barCodigo, data)`: chama novo endpoint
- `useClienteMutations(barCodigo)`: mutation `criar`
- `ClienteModal`: criado com `react-hook-form` + `zodResolver(criarClienteRapidoSchema)`
- `ClientesView`: botão "Novo cliente" abre modal

### Testes

- 1 novo teste em `use-clientes.spec.ts` para `useClienteMutations`
- Handler MSW: `POST /barbearias/:id/clientes`

---

## G5 — Agenda

### Frontend

- `agendaService.criar(barCodigo, data)`: `POST /agendamentos`
- `useAgendaMutations(barCodigo, date)`: mutation `criar` com invalidação da query do dia
- `AgendamentoModal`: selects de barbeiro/cliente, datetime-local, checkboxes de serviços
- `AgendaView`: botão "+ Novo agendamento" com `AnimatePresence`

### Testes

- 1 novo teste em `use-agenda.spec.ts` para `useAgendaMutations`
- Handler MSW: `POST /barbearias/:id/agendamentos`

---

## Verificação final

```bash
pnpm --filter api lint      # ✅ 0 erros
pnpm --filter web lint      # ✅ 0 erros
cd apps/api && npx tsc --noEmit   # ✅ limpo
cd apps/web && npx tsc --noEmit   # ✅ limpo
pnpm --filter api test      # ✅ 134/134
pnpm --filter web exec vitest run  # ✅ 81/81
```

---

## Dados mockados remanescentes

| Tela                   | Campo                                                       | Motivo                                                                                                 |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `ServicosView`         | Pedidos este mês, Receita do mês, Ticket médio (stat cards) | API não expõe métricas de pedidos de serviço separadas — virão do relatórios endpoint em sprint futura |
| `requestPasswordReset` | Stub em auth                                                | Endpoint de redefinição de senha não implementado na API ainda                                         |
