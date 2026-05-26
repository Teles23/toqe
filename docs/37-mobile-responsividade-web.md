# 37 — Responsividade Mobile: Onboarding + Configurações

**Status:** Done  
**Branch:** fix/mobile-responsividade  
**Base:** develop

## Arquivos modificados

| Arquivo                                                                | Mudança                                                                      |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `apps/web/src/app/globals.css`                                         | Fix `.hour-row` mobile: layout 2 linhas; `.svc-header` novo; override mobile |
| `apps/web/src/app/onboarding/page.tsx`                                 | Adiciona `.svc-header` com labels "Preço (R$)" e "Duração (min)"             |
| `apps/web/src/features/configuracoes/components/SecaoHorarios.tsx`     | `minWidth: 110` + `flex-wrap` nos inputs de hora                             |
| `apps/web/src/features/configuracoes/components/ConfiguracoesView.tsx` | Layout adaptativo mobile: lista → seção com back button                      |
| `docs/37-mobile-responsividade-web.md`                                 | Este arquivo                                                                 |

## Problemas corrigidos

### Problema 1 — Time inputs truncando (`09:0`)

**Causa:** Na tela de onboarding (step 3), `.hour-row` usava `grid-template-columns: 1fr 92px 92px 42px` no mobile, deixando apenas 92px para o `<input type="time">`. Em muitos browsers mobile o seletor de hora nativo inclui um ícone de ~30px, deixando menos de 60px para o texto `HH:MM`.

**Fix:** No breakpoint `≤680px`, `.hour-row` agora usa grid 2×2:

- Linha 1: nome do dia (col 1) + toggle (col 2, alinhado à direita)
- Linha 2: input abertura (col 1, 100%) + input fechamento (col 2, 100%)

No `SecaoHorarios.tsx`: adicionado `minWidth: 110` e `flex-wrap` no container dos inputs.

### Problema 2 — Labels ausentes nos campos de serviço (onboarding)

**Fix:** Adicionado `.svc-header` antes do `.svc-list` com as colunas:

- "Nome do serviço" (coluna 1fr)
- "Preço (R$)" (coluna 100px)
- "Duração (min)" (coluna 100px)
- Coluna vazia (botão remover, 30px)

CSS: `.svc-header` usa o mesmo `grid-template-columns` do `.svc-row`, texto em `11px uppercase`.

### Problema 3 — ConfiguracoesView quebrando no mobile

**Causa:** Layout fixo `flex` com sidebar de 200px + conteúdo. Em telas pequenas a sidebar comprimia o conteúdo e o layout ficava inutilizável.

**Fix:** Layout adaptativo:

- Desktop (`md+`): mantém duas colunas (sidebar 200px + conteúdo)
- Mobile (`<md`): navegação em lista full-width → ao clicar numa seção, exibe o conteúdo full-width com botão "← voltar" (ArrowLeft) no topo
- `ChevronRight` adicionado em cada item de navegação (só visível no mobile)
- Estado `mobileShowContent: boolean` controla qual painel é exibido
