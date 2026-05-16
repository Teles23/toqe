# 32 — Tela Clientes (Mobile, Barbeiro)

**Status:** ✅ Implementado
**Branch:** `mobile/feat/barbeiro-clientes` → `mobile/base`

---

## Visão geral

Lista todos os clientes da barbearia ativa com métricas agregadas (visitas, ticket médio, total gasto, última visita, serviço favorito). Suporta busca local e ordenação. Tap em um cliente abre um modal full-screen com histórico de atendimentos concluídos.

---

## Arquitetura

```
app/(barbeiro)/clientes.tsx                                    ← tela principal
  ├── SearchInput (subheader)
  ├── DataListWrapper<ClienteCard[]> (lista)
  └── ClienteDetalheModal (overlay)
       ├── PerfilHeader interno (avatar+nome+email)
       ├── 3 métricas grandes
       └── DataListWrapper<AgendamentoResponse[]> (histórico via useHistoricoCliente)
```

### Hooks

| Hook                                      | Endpoint                             | Detalhe                                                                                                                            |
| ----------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `useClientesDaBarbearia`                  | `GET /barbearias/:codigo/clientes`   | staleTime 5min — clientes mudam pouco                                                                                              |
| `useHistoricoCliente(clienteId, enabled)` | `GET /agendamentos?status=concluido` | Lazy (só busca quando modal abre). Filtro client-side por `cliente.usrCodigo === clienteId` porque backend não expõe `?clienteId=` |

### Componentes novos

| Componente            | Arquivo                                         | Propósito                                                    |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| `ClienteCard`         | `src/features/barbeiro/ClienteCard.tsx`         | Avatar + nome + email + 4 métricas. React.memo               |
| `ClienteDetalheModal` | `src/features/barbeiro/ClienteDetalheModal.tsx` | Modal pageSheet com cabeçalho + métricas grandes + histórico |
| `SearchInput`         | `src/shared/ui/SearchInput.tsx`                 | Input shared com ícone lupa + botão clear                    |

---

## Decisões

| Decisão                                   | Justificativa                                                                                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Busca local** (sem `?q=` no backend)    | Backend retorna lista completa sem paginate. Para o tamanho atual (~dezenas a centenas), filter no array é instantâneo. Quando crescer, adicionar `?busca=&page=` no endpoint é mudança trivial |
| **Sort: nome (default) ou última visita** | Os 2 critérios mais usados; outros (mais gasto, mais visitas) podem ser adicionados ao toggle se houver demanda                                                                                 |
| **Normalização sem acentos**              | `String.normalize('NFD').replace(/[̀-ͯ]/g, '')` — "andre" encontra "André", padrão pt-BR                                                                                                          |
| **Modal de detalhe (não rota)**           | Cliente é uma "preview" — não deeplink, não rota. Modal pageSheet do iOS/Android dá UX nativa                                                                                                   |
| **Filtro client-side do histórico**       | Backend `/agendamentos?status=concluido` retorna todos da barbearia; filter no array por `cliente.usrCodigo`. Aceitável para histórico (pequeno por cliente)                                    |

---

## Acessibilidade

- Cards com `accessibilityLabel="Cliente X, N visitas"`
- SearchInput com `accessibilityLabel="Buscar"`
- Botões de sort com `accessibilityState.selected` indicando ativo
- Touch targets ≥ 44pt (cards, sort buttons, clear button)

---

## Testes

```bash
pnpm --filter mobile test
```

| Spec                                 | Cenários                                                                                            |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `use-clientes-da-barbearia.test.tsx` | enabled sem barbearia, tenantId correto, queryKey por barbearia                                     |
| `use-historico-cliente.test.tsx`     | lazy (enabled=false), status=concluido na query, filtro por usrCodigo, clienteId=0 não dispara      |
| `SearchInput.test.tsx`               | placeholder+ícone, clear button condicional, onChangeText                                           |
| `ClienteCard.test.tsx`               | nome/email/métricas formatadas (BRL), data dd/MM/yyyy, "Sem visitas", favorito condicional, onPress |
| `clientes.test.tsx`                  | loading/empty/error/lista, contagem, busca filtra, ignora acentos, sort toggle, tap abre modal      |

### Maestro

`.maestro/flows/barbeiro-clientes.yaml`:

1. Login barbeiro → Tab Clientes
2. Lista ou empty
3. Busca + clear
4. Tap no primeiro card

---

## Segurança / Performance / Escalabilidade

### Segurança

- Endpoint backend roles: `dono | gerente | recepcionista | barbeiro` (tenant scoped)
- `x-tenant-id` obrigatório — barbeiro de outra barbearia não vê estes clientes
- Histórico filtrado client-side mas o endpoint backend já é tenant-scoped (não vaza)

### Performance

- `useClientesDaBarbearia` staleTime 5min — navegar entre tabs não recarrega
- `useHistoricoCliente` enabled=false até modal abrir — evita preload desnecessário
- `ClienteCard` envolvido em `React.memo` — busca local re-renderiza só os cards filtrados
- `useMemo` em `filtered` — recalcula só quando data/busca/sort mudam

### Escalabilidade

- Hoje: ~200 clientes filter em <5ms no JS thread
- Threshold de migração para backend search: ~500 clientes (texto perceptível de delay)
- Migração trivial: adicionar `?busca=&page=` em `listClientesSchema` + `service.findClientes` + atualizar hook (mantém mesma interface)
