---
name: toqe-refactor
description: Use para refactors no Toqe que preservam comportamento, reduzem duplicação, melhoram organização ou removem dívida sem alterar contratos públicos desnecessariamente.
---

# Toqe Refactor

## Regras

- Leia testes existentes antes de mexer.
- Não misture refactor com feature.
- Não altere contrato API sem sincronizar web/mobile/packages.
- Preserve `testID`, rotas, DTOs e response shapes.
- Não remova comportamento para fazer lint/test passar.
- Evite abstração nova sem redução real de complexidade.

## Processo

1. Identifique duplicação ou acoplamento real.
2. Escolha o menor escopo.
3. Rode teste atual se houver.
4. Extraia helper/componente/service seguindo padrões locais.
5. Atualize testes que importam código real.
6. Rode validação afetada.

## Validação

- API: `pnpm --filter api test`
- Web: `pnpm --filter web test`
- Mobile: `pnpm --filter mobile test`
- Tipos: `pnpm check-types`

Para refactor cross-package, valide os três apps.
