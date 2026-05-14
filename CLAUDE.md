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

### 5. Sincronização

- Código + testes + documentação sempre juntos
- Commit e push ao final de cada entrega completa
