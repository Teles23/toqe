# Regras do projeto toqe

## Sempre que implementar qualquer coisa

### 1. Documentar

- Atualizar o arquivo `docs/` correspondente **sem precisar ser pedido**
- Seguir o padrão da pasta: cabeçalho `Status/Branch/Base`, tabelas de arquivos criados/modificados, diagramas, comandos
- Documentação, código e testes vão juntos no mesmo commit — nunca desalinhados

### 2. Validar antes de commitar

- Rodar **os três checks** antes de qualquer `git commit`, sem exceção:
  1. `pnpm --filter api lint` e `pnpm --filter web lint`
  2. `cd apps/api && npx tsc --noEmit` e `cd apps/web && npx tsc --noEmit`
  3. `pnpm --filter api test` e `pnpm --filter web test`
- Rodar apenas os testes **não é suficiente** — lint e tipos devem passar também
- Se houver falha em qualquer um dos três, corrigir na raiz antes de prosseguir

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

### 8. Mudanças de schema Prisma — checklist obrigatório

Toda mudança em `schema.prisma` deve tocar os seguintes arquivos **no mesmo commit**:

1. `schema.prisma` — a mudança
2. Migration SQL gerada via `prisma migrate dev --name descricao`
3. `prisma/seed-runner.js` — verificar se usa compound keys ou tipos afetados
4. Qualquer service/spec que dependa dos tipos gerados pelo Prisma client

**Atenção:** índices parciais SQL (`CREATE UNIQUE INDEX ... WHERE ...`) **não são
reconhecidos pelo Prisma** como unique constraints — não geram compound key names
no client. Nunca use `upsert({ where: { compoundKey: ... } })` baseado nesses índices.

- **Nunca** usar `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `any` casting ou flags `--passWithNoTests` para silenciar erros
- **Nunca** remover código funcional da aplicação para fazer lint/testes passarem
- **Nunca** remover uso real de variáveis, métodos ou imports só para suprimir warnings
- Todo erro deve ser resolvido na **raiz do problema**:
  - Lint: corrigir o código ou configurar a regra corretamente para o contexto (ex: `eslint-plugin-jest` em vez de `off` global)
  - TypeScript: corrigir os tipos, não fazer cast para `any`
  - Testes: corrigir a implementação ou o mock, não remover o cenário
  - Build: corrigir a causa, não comentar o código
- **Nunca usar duck-typing para contornar tipos do Prisma** — campos `Decimal` devem ser anotados com `Prisma.Decimal` ou via `Prisma.XxxGetPayload<...>`, nunca com `{ toNumber(): number } | number`

## Estrutura de arquivos chave

- API: apps/api/src/
- Mobile: apps/mobile/app/
- Contratos: packages/contracts/src/schemas/
- Docs: docs/
- Comandos customizados: .claude/commands/

## Validação mobile (obrigatório junto com api/web)

pnpm --filter mobile lint
pnpm --filter mobile type-check
pnpm --filter mobile test

## Status atual do projeto

- App barbeiro: MVP completo (Sprints A, B, C concluídas — ver docs/62-maturidade-e-roadmap.md)
- Próximos passos: fluxo de convite e2e + definição do fluxo de auth por perfil + app cliente
- Tokens sensíveis: sempre SecureStore, nunca AsyncStorage
- Google Sign-In: usa @react-native-google-signin/google-signin com Development Build Android (não funciona em Expo Go)

## Regras de autenticação Google

- No logout, sempre chamar GoogleSignin.signOut() antes de limpar o SecureStore — nunca usar revokeAccess()
- O signOut() deve estar em try/catch para não quebrar o logout de usuários que não entraram via Google
- Após logout, o seletor de contas Google deve sempre ser exibido ao tentar logar novamente
- Usuários OAuth têm senhaHash null no banco — nunca tentar login por senha nessa conta
