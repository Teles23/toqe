# 71 — Correções pós-teste: perfil do barbeiro + preços

**Status:** Implementado (validação no device pendente — só o usuário)
**Branch:** develop
**Base:** doc 70 (perfil: jornada + serviços)

## Contexto

Rodada de correções de bugs de UX/contrato vistos no uso real do app do barbeiro,
mais pequenas melhorias MVP. Um commit por item, sem push. A investigação ajustou
duas premissas:

- **"R$ 035"** não era zero à esquerda: `AgendamentoItemResponse.preco` é tipado
  `number`, mas o Prisma serializa `Decimal` como **string**. No front,
  `itens.reduce((s,i)=>s+i.preco, 0)` virava `0 + "35"` = `"035"`. Mesma classe
  do bug `cliente.usrCodigo` (contrato mentindo).
- **Senha:** o placeholder cortado era `height:30` fixo; os requisitos em tempo
  real já existiam.

## Itens

| Item               | Mudança                                                                                                                                                                                                  | Commit    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Bug 3 (API)        | `serialize-agendamento` normaliza `itens.preco/duracao` Decimal→number (só quando presentes). Fecha o bypass: `publico.service.criarAgendamento` passou a serializar (antes devolvia Prisma cru). + spec | `8b7b913` |
| Bug 3 (mobile)     | `maskCurrency` (reuso de `shared/utils/masks`) nos totais de `ClienteDetalhe`/`AgendaRow`/`AppointmentDetailSheet` → "R$ 35,00"; `Number(i.preco)` no reduce do ClienteDetalhe                           | `e50206f` |
| Bug 1              | senha: input sem `height` fixo (placeholder não corta); CTA deixa de ser `position:absolute` e vira footer em fluxo dentro do KAV (sobe com o teclado)                                                   | `e56ab01` |
| Bug 2 + M4         | `editar.tsx`: sucesso e "Upload de foto em breve" viram `showToast` (não Alert nativo); remove import `Alert`                                                                                            | `ecf4d17` |
| Bug 4              | perfil: subtítulo de "Jornada de trabalho" agora é dinâmico via `useJornada` + `resumoJornada` (ranges/lista; loading/erro)                                                                              | `abb844a` |
| Bug 5 + Bug 6 + M2 | "Push notifications"→"Notificações push"; labels do ClienteDetalhe `textDisabled`(#333)→`textMuted`(#777); remove a linha "Convites" (abria notificações por engano)                                     | `1d900e4` |

## Decisões

- **Convites (M2):** sem endpoint de "meus convites" e dado pobre pós-aceite →
  apenas removida a linha que roteava errado (sem tela/endpoint novos).
- **Foto (M4):** sem `expo-image-picker` e sem endpoint de upload de arquivo
  (só `PUT /usuarios/me` com URL) → mantido placeholder, agora via toast.
- **Já estavam prontos (sem ação):** histórico da agenda reusa o mesmo
  `ClienteDetalhe` (M1); cores/posição do pull-to-refresh já unificadas (M3).
- **Bug 6 escopo restrito** ao ClienteDetalhe (sem replace global de
  `textDisabled`, que tem usos legítimos: chevrons, placeholders).

## Checks

mobile: tsc + lint limpos, suíte verde. api: tsc + lint + specs verdes
(serialize coerção string→number + bypass público coberto).

## Pendente (validação manual — só o usuário)

Trocar senha: placeholder visível + botão acima do teclado; salvar perfil =
toast; preço "R$ 35,00" (inclusive no booking público); jornada reflete os dias
reais; "Notificações push"; labels Visitas/Ticket/Última legíveis; "Convites"
não aparece mais; botão de foto mostra toast.
