# 80 — Redesign Landing, Minha Rede e Auditoria de Responsividade

**Status:** Concluído (entregas 1, 2 e 3)
**Branch:** develop
**Base:** main

---

## Arquivos criados / modificados

### Entrega 2 — Minha Rede

| Arquivo                                                   | Tipo       | O que mudou                                                                                                                                                                      |
| --------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/features/rede/components/RedeTotaisBar.tsx` | Modificado | Redesign completo: KPIs com ícones lucide, glow dinâmico por cor, barra de progresso de conclusão, header com dot pulsante                                                       |
| `apps/web/src/features/rede/components/UnidadeCard.tsx`   | Modificado | Redesign: hierarquia clara com nome + ícone âmbar, grid 2×2 de métricas com ícones, progress bar de conclusão colorida (verde/amarelo/vermelho), footer com botão "Ver detalhes" |
| `apps/web/src/app/(dashboard)/rede/page.tsx`              | Modificado | Loading skeleton com animação stagger, estado de erro com botão "Tentar novamente" visual, empty state com ícone, botão "Atualizar" no header                                    |

### Entrega 3 — Auditoria de Responsividade

| Arquivo                                                          | Tipo      | Correção                                                                                                                                                                                                                  |
| ---------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/features/clientes/components/ClientesView.tsx`     | Corrigido | `ClienteDetalhe` estava renderizado sem `hidden md:flex` — causava squeeze do layout em mobile. Adicionado `hidden md:flex` no desktop panel e bottom-sheet mobile (pattern consistente com BarbeirosView e ServicosView) |
| `apps/web/src/features/barbeiros/components/BarbeirosView.tsx`   | Corrigido | Botão "Novo barbeiro" sem truncação — adicionado `hidden sm:inline` no label, exibindo só ícone em mobile                                                                                                                 |
| `apps/web/src/features/agenda/components/AgendaFilters.tsx`      | Corrigido | Input de busca com `width: 160` fixo — trocado por `width: 100%` no mobile (w-full sm:w-auto)                                                                                                                             |
| `apps/web/src/features/relatorios/components/RelatoriosView.tsx` | Corrigido | Container de botões de período sem `flex-wrap` — adicionado para evitar overflow em viewports < 480px                                                                                                                     |

---

## Detalhes das entregas

### Entrega 1 — Landing page

A landing `apps/web/src/app/page.tsx` já possuía implementação completa e correta do redesign (hero com parallax, grid de features com ícones e cards, planos com destaque visual, depoimentos, menu mobile com AnimatePresence, footer). Não foram necessárias alterações — o arquivo já atendia todos os requisitos do brief.

### Entrega 2 — Minha Rede

**RedeTotaisBar** redesenhada com:

- Header com dot pulsante "Ao vivo" e pill de taxa de conclusão (% concluídos / agendamentos)
- KPIs com ícone contextual (Building2, TrendingUp, DollarSign, Calendar, CheckCircle2)
- Glow radial por KPI usando cor do status
- Grid responsivo: 2 colunas em mobile → 5 em sm+

**UnidadeCard** redesenhado com:

- Header: ícone âmbar da unidade + nome + subtítulo "unidade da rede"
- Progress bar de taxa de conclusão com cor semântica (verde ≥75%, amarelo ≥40%, vermelho <40%)
- Grid 2×2 de métricas com ícones
- Footer com botão "Ver detalhes" com hover âmbar
- Hover no card: borda elevada + shadow

**RedePage** melhorada com:

- Skeleton com stagger delay nos cards
- Estado de erro com ícone e botão retry
- Empty state com ícone Network
- Botão "Atualizar" no header para refetch manual

### Entrega 3 — Responsividade

**Problemas corrigidos:**

1. **`/clientes` — ClienteDetalhe sem isolamento mobile** (bug crítico): O painel de detalhe era renderizado diretamente dentro do flex container sem `hidden md:flex`, causando squeeze do layout da lista em mobile. Corrigido com o pattern já usado em Barbeiros e Serviços: `hidden md:flex` no desktop + bottom-sheet mobile.

2. **`/barbeiros` — Botão "Novo barbeiro" sem truncação**: O texto aparecia completo em mobile dentro da toolbar já apertada. Adicionado `hidden sm:inline` no label.

3. **`/agenda` — Input de busca com width fixo**: `width: 160` em mobile deixava pouco espaço no container flex. Trocado por `width: 100% / w-full sm:w-auto`.

4. **`/relatorios` — Period selector sem flex-wrap**: Em viewports muito estreitos os botões (7d, 30d, 90d, 1a) podiam causar overflow horizontal. Adicionado `flex-wrap` no container.

**Pendências (refactor maior):**

- `/agenda — BarbeiroPanel`: Coluna lateral de 240px some em mobile (`lg:grid-cols-[1fr_240px]`), mas o painel `BarbeiroPanel` não tem bottom-sheet — informações dos barbeiros ficam inacessíveis em mobile. Refactor médio: adicionar accordion ou bottom-sheet toggle.
- `/relatorios — Charts em mobile`: Vários charts (FaturamentoChart, AgendamentosChart) têm altura fixa (260px, 220px) que em 375px pode parecer grande. Funcional, mas poderia ter altura adaptativa via `clamp`.

---

## Checks

```
pnpm --filter web lint        → 0 warnings, 0 errors
npx tsc --noEmit              → 0 erros
pnpm --filter web test        → 236 passed (35 test files)
```
