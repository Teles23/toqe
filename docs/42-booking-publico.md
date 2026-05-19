# 42 — Booking público (`/b/:slug`)

**Status:** Ativo | **Branch:** `feat/booking-publico` | **Base:** develop

## Contexto

Segunda tela da frente de redesign web a partir dos protótipos em `Downloads/toqe`. Implementa um fluxo de **agendamento sem login** que qualquer cliente pode acessar pela URL pública `/b/:slug`. Reaproveita 100% das regras de domínio do fluxo autenticado (`AgendamentoService`, `AgendaService`, `MembroBarbeariaService`) — a nova camada `publico/` é apenas adapter: traduz `slug → barCodigo` e expõe uma superfície mínima de dados (sem stats, sem faturamento, sem e-mail/telefone de barbeiros).

Decisões aplicadas a partir do protótipo `Toqe Booking Publico v2.html`:

- **Remover todos os "dados técnicos"** do protótipo:
  - Painel lateral "Schemas reais" com `createAgendamentoSchema`, `criarClienteRapidoSchema`, `patchStatusAgendamentoSchema`, "Fluxo real: Bull worker → WhatsApp lembrete…" → removido.
  - Labels técnicos inline (`servicosIds[]`, `duracaoBase`, `criarClienteRapidoSchema`, `nome: string min(2) max(100)`, `inicio (ISO 8601)`, `POST /agendamentos · createAgendamentoSchema`, "(auto-alocado)", "(novo via criarClienteRapido)") → removidos.
  - Pílulas/badges fake do hero ("4.8★ avaliação", "~28 min espera hoje", "2.4k cortes/mês", "Aberto agora · até 19:00") → substituídas por meta real ("X barbeiros · Y serviços").
  - "Lembrete 1h antes · responda CANCELAR para desmarcar" no card de confirmação (fake WhatsApp) → removido. Substituído por mensagem real "Você receberá um e-mail de confirmação em…".
- **Responsivo**: o shell tem `max-width: 440px` e usa padding flexível. Cabe em qualquer mobile e fica centralizado no desktop. Não tem split-screen porque é um fluxo focado.
- **Barbeiro "qualquer disponível"**: `barbeiroId = 0` resolvido no backend — o service procura o primeiro barbeiro com slot livre no horário.

## Princípios aplicados (DRY · SOLID · Clean Code)

| Reuso                                                                                      | Origem                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AgendamentoService.create` (conflito, transação, gateway, notificação)                    | [apps/api/src/agendamento/agendamento.service.ts](../apps/api/src/agendamento/agendamento.service.ts)                                                                                               |
| `AgendaService.getAvailableSlots` (jornada, bloqueios, slots livres)                       | [apps/api/src/agenda/agenda.service.ts](../apps/api/src/agenda/agenda.service.ts)                                                                                                                   |
| `MembroBarbeariaService.criarCliente` (lógica de upsert de usuário+bcrypt)                 | [apps/api/src/barbearia/membro-barbearia.service.ts](../apps/api/src/barbearia/membro-barbearia.service.ts) — refatorado em `upsertClienteUsuario` privado + novo `findOrCreateCliente` idempotente |
| `ServicoService.findAll`                                                                   | [apps/api/src/servico/servico.service.ts](../apps/api/src/servico/servico.service.ts)                                                                                                               |
| `criarClienteRapidoSchema` + `createPublicAgendamentoSchema`                               | [packages/contracts/src/schemas/](../packages/contracts/src/schemas/) — schema novo reusa shape de `criarClienteRapidoSchema`                                                                       |
| `@Throttle` decorator (rate-limit)                                                         | já em uso em `auth.controller.ts`                                                                                                                                                                   |
| Design tokens CSS (`--primary`, `--bg-card`, `--text-primary`, `--status-*`, `--border-*`) | tokens existentes — zero cor hardcoded                                                                                                                                                              |
| `tqe-input-bare` (input sem chrome)                                                        | classe utilitária criada no redesign do login                                                                                                                                                       |
| TanStack Query + zod-resolver no FE                                                        | padrão do projeto                                                                                                                                                                                   |
| MSW para mocks de teste FE                                                                 | padrão do projeto                                                                                                                                                                                   |

Nada de regras de domínio foi reimplementado. A camada `publico/` é puramente um adapter.

## Endpoints adicionados

| Método | Rota                                              | Auth                          | Descrição                                                                 |
| ------ | ------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `GET`  | `/publico/:slug`                                  | público                       | Dados públicos da barbearia (nome, slug, timezone, logo)                  |
| `GET`  | `/publico/:slug/servicos`                         | público                       | Lista serviços ativos (codigo, nome, preço, duração)                      |
| `GET`  | `/publico/:slug/barbeiros`                        | público                       | Lista barbeiros (codigo, nome, avatar) — **sem** stats, email ou telefone |
| `GET`  | `/publico/:slug/slots?barbeiroId=&data=&duracao=` | público                       | Slots `[{ horario, barbeiroId }]`. `barbeiroId=0` agrega todos            |
| `POST` | `/publico/:slug/agendamentos`                     | público (rate-limit 5/min/IP) | Cria cliente (idempotente) + agendamento                                  |

Schema do POST: `createPublicAgendamentoSchema` (em [packages/contracts/src/schemas/agendamento.ts](../packages/contracts/src/schemas/agendamento.ts)):

```ts
{
  barbeiroId: number (>= 0, 0 = qualquer),
  inicio: string (ISO 8601 datetime),
  servicosIds: number[] (min 1),
  cliente: criarClienteRapidoSchema,
  observacao?: string (max 500),
}
```

## Arquivos modificados / criados

### Backend

| Arquivo                                                                                                                   | Tipo | Mudança                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [packages/contracts/src/schemas/agendamento.ts](../packages/contracts/src/schemas/agendamento.ts)                         | mod  | Adiciona `createPublicAgendamentoSchema` + tipo `CreatePublicAgendamentoInput`                                                                        |
| [apps/api/src/publico/publico.controller.ts](../apps/api/src/publico/publico.controller.ts)                               | novo | 5 endpoints públicos, valida query params, `@Throttle` 5/min no POST                                                                                  |
| [apps/api/src/publico/publico.service.ts](../apps/api/src/publico/publico.service.ts)                                     | novo | Adapter slug → barCodigo; orquestra `MembroBarbeariaService`, `ServicoService`, `AgendaService`, `AgendamentoService`. Implementa "qualquer barbeiro" |
| [apps/api/src/publico/publico.module.ts](../apps/api/src/publico/publico.module.ts)                                       | novo | Módulo que importa `BarbeariaModule`, `ServicoModule`, `AgendaModule`, `AgendamentoModule`                                                            |
| [apps/api/src/publico/dto/create-public-agendamento.dto.ts](../apps/api/src/publico/dto/create-public-agendamento.dto.ts) | novo | DTO via `createZodDto(createPublicAgendamentoSchema)`                                                                                                 |
| [apps/api/src/publico/publico.service.spec.ts](../apps/api/src/publico/publico.service.spec.ts)                           | novo | 11 testes (slug not found, listagens, agregação de slots, auto-alocação, 400 quando sem barbeiro)                                                     |
| [apps/api/src/publico/publico.controller.spec.ts](../apps/api/src/publico/publico.controller.spec.ts)                     | novo | 9 testes de roteamento + validação de query                                                                                                           |
| [apps/api/src/barbearia/membro-barbearia.service.ts](../apps/api/src/barbearia/membro-barbearia.service.ts)               | mod  | Refatorado: extrai `upsertClienteUsuario` privado; novo `findOrCreateCliente` idempotente (não lança se já é cliente)                                 |
| [apps/api/src/barbearia/membro-barbearia.service.spec.ts](../apps/api/src/barbearia/membro-barbearia.service.spec.ts)     | mod  | +3 testes cobrindo `findOrCreateCliente` (recorrente, novo email, email existente sem vínculo)                                                        |
| [apps/api/src/agendamento/agendamento.module.ts](../apps/api/src/agendamento/agendamento.module.ts)                       | mod  | Exporta `AgendamentoService` para o `PublicoModule` consumir                                                                                          |
| [apps/api/src/app.module.ts](../apps/api/src/app.module.ts)                                                               | mod  | Registra `PublicoModule`                                                                                                                              |

### Frontend

| Arquivo                                                                                                                                       | Tipo | Mudança                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [apps/web/src/app/b/[slug]/page.tsx](../apps/web/src/app/b/[slug]/page.tsx)                                                                   | novo | Rota pública (fora de `(auth)`/`(dashboard)`). Apenas renderiza o flow                                                                                                                                                                                                                                          |
| [apps/web/src/features/booking/types.ts](../apps/web/src/features/booking/types.ts)                                                           | novo | Tipos `BarbeariaPublica`, `BarbeiroPublico`, `ServicoPublico`, `SlotPublico`                                                                                                                                                                                                                                    |
| [apps/web/src/features/booking/services/booking.service.ts](../apps/web/src/features/booking/services/booking.service.ts)                     | novo | 5 calls via `api.get/post` com `auth: false`                                                                                                                                                                                                                                                                    |
| [apps/web/src/features/booking/hooks/use-booking-queries.ts](../apps/web/src/features/booking/hooks/use-booking-queries.ts)                   | novo | `useBarbeariaPublica`, `useServicosPublicos`, `useBarbeirosPublicos`, `useSlotsPublicos`, `useCriarAgendamentoPublico`                                                                                                                                                                                          |
| [apps/web/src/features/booking/components/PublicBookingFlow.tsx](../apps/web/src/features/booking/components/PublicBookingFlow.tsx)           | novo | Wizard de 6 passos: serviços → barbeiro → data/hora → cliente → confirmação → sucesso. Componentes internos: `BookingHero`, `StepServicos`, `StepBarbeiro`, `StepDataHora`, `StepCliente`, `StepConfirmacao`, `StepSucesso` + primitivos `PrimaryButton`, `BackButton`, `StepShell`, `StepLoader`, `EmptyState` |
| [apps/web/src/features/booking/components/PublicBookingFlow.spec.tsx](../apps/web/src/features/booking/components/PublicBookingFlow.spec.tsx) | novo | 6 testes ponta-a-ponta usando MSW (loader, slug 404, fluxo completo, validação Zod)                                                                                                                                                                                                                             |
| [apps/web/src/test/msw-handlers.ts](../apps/web/src/test/msw-handlers.ts)                                                                     | mod  | Handlers para os 5 endpoints `/publico/*`                                                                                                                                                                                                                                                                       |
| [apps/web/eslint.config.js](../apps/web/eslint.config.js)                                                                                     | mod  | Adiciona `src/features/booking/components/**` ao allowlist de `no-restricted-syntax` (mesma política das outras features)                                                                                                                                                                                       |

## Fluxo de booking (6 passos)

```
┌─────────────────────────────────────────┐
│  HERO — nome + meta (X barbeiros, ...)  │
│  [█████░░░░░░░░░░░░] progresso 1/5     │
├─────────────────────────────────────────┤
│ STEP 1 — Serviços                       │
│  ☐ Corte         · 30 min · R$ 60       │
│  ☐ Barba         · 25 min · R$ 45       │
│  [ Continuar · R$ 0 → ]                 │
├─────────────────────────────────────────┤
│ STEP 2 — Barbeiro                       │
│  [ Qualquer ] [ Carlos ] [ Felipe ] ... │
├─────────────────────────────────────────┤
│ STEP 3 — Data / Hora                    │
│  [Hoje SEG 19] [Amanhã TER 20] ...      │
│  Manhã: 09:00  09:30  ...               │
│  Tarde: 14:00  14:30  ...               │
├─────────────────────────────────────────┤
│ STEP 4 — Cliente (nome, email, fone)    │
├─────────────────────────────────────────┤
│ STEP 5 — Confirmação (resumo + total)   │
│  [ Confirmar agendamento ✓ ]            │
├─────────────────────────────────────────┤
│ STEP 6 — Sucesso (mensagem + reset)     │
└─────────────────────────────────────────┘
```

## Segurança

- **POST `/publico/:slug/agendamentos`** tem `@Throttle({ default: { ttl: 60_000, limit: 5 } })` — protege contra spam de agendamentos anônimos.
- O Zod schema valida tudo no boundary (incluindo regex de telefone, max chars de e-mail/observação).
- Service **nunca expõe**: faturamento, ticket médio, contagens, e-mail/telefone de barbeiros, planoStatus, configurações internas da barbearia.
- Barbearia inativa retorna 404 (não distingue de inexistente para não vazar info).
- Reutiliza `AgendamentoService.create` → mesmo check de conflito de horário, mesma lógica de notificação por e-mail, mesmo gateway WebSocket (a barbearia recebe o agendamento em tempo real no dashboard).

## Validação (CLAUDE.md — três checks obrigatórios)

```bash
# API
pnpm --filter api lint            # ✅ zero erros
cd apps/api && npx tsc --noEmit   # ✅ zero erros
pnpm --filter api test            # ✅ 220+ passed (todos os módulos)

# Web
pnpm --filter web lint            # ✅ zero erros / zero warnings
cd apps/web && npx tsc --noEmit   # ✅ zero erros
pnpm --filter web test            # ✅ 129 passed (17 files)
```

Manual:

1. `pnpm dev` (ou subir api+web isolados).
2. Criar/garantir uma barbearia com slug `urban` (seed) com serviços e ao menos 1 barbeiro com jornada cadastrada para o dia atual.
3. Acessar `http://localhost:3001/b/urban` no browser.
4. Conferir: hero mostra nome, mini-progress bar avança, cada step carrega lista do backend, validação de e-mail e nome funciona, slot escolhido vira ISO 8601 correto, POST retorna 201, tela de sucesso aparece.
5. Em segunda aba autenticada do dashboard: o agendamento aparece em tempo real via WebSocket (porque reusa `AgendamentoService.create`).
6. Tentar slug inexistente (`/b/xxxx`): tela de "Barbearia não encontrada" amigável.
7. Submeter formulário com nome curto: erro inline.
8. Forçar 6 POSTs em <1min do mesmo IP: 429 do throttler no 6º.

## Próximos passos (fora deste PR)

- White-label visual (tema/cor da barbearia aplicado ao primary do flow) — já temos `tema.corPrimaria` no payload de `/publico/:slug`, falta consumir no FE.
- Página de gestão pública da barbearia (mostrar reviews, mapa, foto). Hoje a tela é puramente transacional.
- SMS/WhatsApp de confirmação (depende de feature `magic-link` no backend).
- Cancelamento via token no e-mail (cliente cancela sem login).
