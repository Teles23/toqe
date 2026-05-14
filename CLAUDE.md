# Regras do projeto toqe

## Sempre que implementar qualquer coisa

### 1. Documentar

- Atualizar o arquivo `docs/` correspondente **sem precisar ser pedido**
- Seguir o padrão da pasta: cabeçalho `Status/Branch/Base`, tabelas de arquivos criados/modificados, diagramas, comandos
- Documentação, código e testes vão juntos no mesmo commit — nunca desalinhados

### 2. Validar antes de commitar

- Rodar os testes após cada mudança: `pnpm --filter api test` e `pnpm --filter web test`
- Garantir que nada quebrou na aplicação antes de fazer commit
- Se houver falha, corrigir antes de prosseguir

### 3. Testes reais e completos

- Cobrir **todos os cenários possíveis**: sucesso, erro, edge cases, dados ausentes, permissões, isolamento de tenant
- Todas as frentes: unit BE (Jest), unit FE (Vitest + MSW), integration (Testcontainers), security (supertest), E2E web (Playwright), E2E mobile (Maestro), load (k6)
- Nenhum arquivo de spec pode ser scaffolding vazio — testes devem ser funcionais e passar

### 4. Branches

- Trabalhar **sempre** na branch correta designada para a feature
- **Nunca criar novas branches** sem permissão explícita do usuário
- Resolver conflitos ao invés de contorná-los

### 5. Sincronização total — api + web + testes

- Qualquer mudança na API (novo endpoint, contrato, serviço) → atualizar ou criar testes na API **e** no frontend (MSW handlers, hooks, components)
- Qualquer mudança no frontend → garantir que mocks MSW e specs de hooks/components refletem o novo comportamento
- Nunca entregar mudança de código sem os testes acompanhando no mesmo commit
- Commit e push ao final de cada entrega completa

### 6. Testes testam o código real — sempre

- **Nunca** duplicar lógica no spec. Se a função não é exportada, exportar ela e importar no teste
- **Nunca** criar cópias locais da implementação dentro do arquivo de teste — isso testa o espelho, não o original
- Se o spec não importa do módulo real, não está testando nada: qualquer bug na implementação passa despercebido
- Quando corrigir um bug, o teste que cobre aquele cenário vai no **mesmo commit**
- Antes de commitar: rodar `pnpm lint`, `pnpm check-types` e `pnpm test` — os três juntos

### 7. Zero tolerância a bypasses

- **Nunca** usar `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `any` casting ou flags `--passWithNoTests` para silenciar erros
- **Nunca** remover código funcional da aplicação para fazer lint/testes passarem
- **Nunca** remover uso real de variáveis, métodos ou imports só para suprimir warnings
- Todo erro deve ser resolvido na **raiz do problema**:
  - Lint: corrigir o código ou configurar a regra corretamente para o contexto (ex: `eslint-plugin-jest` em vez de `off` global)
  - TypeScript: corrigir os tipos, não fazer cast para `any`
  - Testes: corrigir a implementação ou o mock, não remover o cenário
  - Build: corrigir a causa, não comentar o código
