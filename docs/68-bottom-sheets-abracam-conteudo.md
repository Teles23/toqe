# 68 — Bottom sheets abraçam o conteúdo (sem espaço vazio)

**Status:** Implementado (validação visual no device pendente — só o usuário)
**Branch:** develop
**Base:** princípio do protótipo `barbeiro-sheets.jsx` (`maxHeight`, sem altura fixa)

## Contexto

Vários sheets tinham **altura fixa** (`height={0.78}`, `0.65`, `0.45`, `auto`=80%),
reservando espaço vazio abaixo do conteúdo quando este era curto. O protótipo
define que o sheet **abraça o conteúdo** com teto (`maxHeight: 85%`) e rola
internamente quando o conteúdo é longo.

> O app **não** usa `@gorhom/bottom-sheet` nem `Modal` nativo: tem um
> `BottomSheet` próprio (`src/shared/ui/BottomSheet.tsx`) renderizado **in-screen
> acima da tab bar**. Por isso `paddingBottom` usa `spacing.xl` (a tab bar já
> cobre a safe-area inferior) — somar `insets.bottom` reintroduziria vão.

## Mudança no componente base

`BottomSheet` ganhou o comportamento de **content-hug com teto** no modo
`height="content"`: sem `height` fixa, com `maxHeight: screenHeight * 0.85`.
Conteúdo longo rola via o `ScrollView` do filho.

| Modo `height` | Comportamento                      |
| ------------- | ---------------------------------- |
| número (0–1)  | altura fixa (legado — evitar)      |
| `"auto"`      | 80% fixo (legado — evitar)         |
| `"content"`   | **abraça o conteúdo, teto 85%** ✅ |

## Sheets convertidos para `height="content"`

| Sheet                          | Antes                    | ScrollView                                 |
| ------------------------------ | ------------------------ | ------------------------------------------ |
| `ActionMenuSheet`              | `"content"` (já, doc 63) | —                                          |
| `AgendamentoCard` (long-press) | `0.45`                   | — (menu curto)                             |
| `FilaCard` (long-press)        | `0.42`                   | — (menu curto)                             |
| `TenantSwitcherSheet`          | `"auto"` (80%)           | `list`: + `flexShrink:1`                   |
| `AvaliacaoSheet`               | `0.65`                   | `root`: `flex:1`→`flexGrow:0/flexShrink:1` |
| `AppointmentDetailSheet`       | `0.78`                   | `flex:1`→`flexGrow:0/flexShrink:1`         |
| `BloqueioSheet`                | `0.78`                   | `flex:1`→`flexGrow:0/flexShrink:1`         |

**Padrão RN para "abraça curto, rola longo":** sheet com `maxHeight` (sem
`height`) + `ScrollView` com `flexGrow:0, flexShrink:1`. Curto → o scroll mede o
conteúdo (hug); longo → o `maxHeight` limita e o `flexShrink:1` deixa o scroll
encolher e rolar.

## Já conforme (sem mudança)

`AdicionarWalkInModal` ("Encaixe agora") — modal in-screen próprio que já usava
`sheet.maxHeight: "92%"` (sem altura fixa) + `scroll.flexShrink: 1`.

## Checks

mobile: tsc limpo, lint 0 erros, suíte completa verde.

## Pendente

- **Validação visual no device/simulador** (checklist da seção 6 da tarefa): só o
  usuário consegue. RN flexbox para "hug + cap + scroll" é sensível; conferir
  cada sheet com conteúdo mínimo e máximo.
