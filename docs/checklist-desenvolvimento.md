# Checklist de Desenvolvimento

**Status:** Ativo | **Branch base:** develop | **Criado em:** 2026-05-18

## Antes de cada commit

### 1. Qualidade de código (obrigatório)

```bash
# Lint — deve passar com zero erros
pnpm --filter api lint
pnpm --filter web lint

# Tipos — deve passar sem erros
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit

# Testes unitários
pnpm --filter api test
pnpm --filter web test
```

Regras absolutas:

- [ ] Zero erros de lint (warnings são tolerados mas devem ser reduzidos)
- [ ] Zero erros de TypeScript — nunca usar `@ts-ignore`, `@ts-expect-error` ou `any` casting
- [ ] 100% dos testes passando — nunca usar `--passWithNoTests`
- [ ] Nenhum `eslint-disable` para suprimir erros reais

### 2. Segurança de dependências

```bash
# Auditar somente deps de produção (CI gate)
pnpm audit --prod --audit-level=high

# Auditar tudo para visibilidade geral
pnpm audit --audit-level=moderate
```

- [ ] Zero vulnerabilidades HIGH em deps de produção
- [ ] Vulnerabilidades em devDependencies documentadas se não corrigíveis
- [ ] Transitive deps problemáticas resolvidas via `pnpm.overrides` no `package.json` raiz

### 3. Revisão de segurança

- [ ] Nenhum secret, senha ou token commitado no código
- [ ] Variáveis de ambiente sensíveis usam `process.env.*` com validação (Zod/class-validator)
- [ ] Inputs de usuário validados na boundary (DTO + pipe) — nunca confiar em dados client-side
- [ ] Queries Prisma usam `where: { barCodigo }` para isolamento de tenant em todo endpoint multi-tenant
- [ ] Arquivos de upload validados (tipo MIME, tamanho, extensão)
- [ ] CORS configurado explicitamente — não usar `*` em produção

## Antes de abrir PR

### 4. Testes completos

| Frente      | Comando                              | Quando obrigatório                   |
| ----------- | ------------------------------------ | ------------------------------------ |
| Unit BE     | `pnpm --filter api test`             | Qualquer mudança na API              |
| Unit FE     | `pnpm --filter web test`             | Qualquer mudança no Web              |
| Integration | `pnpm --filter api test:integration` | Novos endpoints/serviços             |
| Security    | `pnpm --filter api test:security`    | Mudanças em auth/guards              |
| E2E Web     | `pnpm --filter web test:e2e`         | Fluxos críticos (login, agendamento) |

- [ ] Cenários testados: sucesso, erro esperado, edge cases, dados ausentes, permissão negada
- [ ] Isolamento de tenant: cada spec cria sua própria barbearia com `barCodigo` único
- [ ] Testes importam do módulo real — nunca duplicar lógica no spec

### 5. Documentação

- [ ] `docs/` atualizado no mesmo commit da feature (ver [padrão de docs](#padrão-de-documentação))
- [ ] Novos endpoints documentados com método, rota, body, response, erros
- [ ] Breaking changes destacados no PR description

### 6. Mudanças de schema Prisma

- [ ] `prisma migrate dev --name <descricao>` gerada e commitada
- [ ] `prisma/seed-runner.js` atualizado se afetado
- [ ] Prisma client gerado (`prisma generate`) antes do lint/tipos
- [ ] Services/specs que usam tipos afetados atualizados no mesmo commit
- [ ] Nunca usar `upsert` com índices parciais SQL — Prisma não gera compound keys para eles

### 7. Sincronização API ↔ Web

Qualquer mudança em contrato de API requer:

- [ ] Handler MSW atualizado em `apps/web/src/tests/msw/handlers/`
- [ ] Hook(s) de dados (`use-*.ts`) atualizados
- [ ] Componentes que consomem o hook ajustados se a resposta mudou
- [ ] Testes do hook e do componente atualizados

## Pipeline CI/CD

### Fluxo

```
PR → ci-fast.yml (lint + tipos + unit tests + audit + build)
     ↓ aprovado
Merge develop → ci-full.yml (integration + security + docker build + deploy develop)
Tag v* → ci-full.yml (deploy produção via docker build + deploy)
```

### Gates obrigatórios (ci-fast.yml)

| Step                       | Falha bloqueia merge? |
| -------------------------- | --------------------- |
| Install dependencies       | Sim                   |
| Audit deps produção (HIGH) | Sim                   |
| Lint (api + web)           | Sim                   |
| Type check (api + web)     | Sim                   |
| Test — API (unit)          | Sim                   |
| Test — Web (unit)          | Sim                   |
| Build                      | Sim                   |
| Commitlint (PR title)      | Sim                   |

### Gates pós-merge (ci-full.yml)

| Step                | Falha bloqueia deploy? |
| ------------------- | ---------------------- |
| Test — Integration  | Sim                    |
| Test — Security     | Sim                    |
| Validate seed       | Sim                    |
| Docker build & push | Sim                    |
| Deploy VPS          | Sim (com health-check) |

### Scanning de secrets

- `gitleaks.yml` roda em todo push e PR
- Bloqueia merge se encontrar secrets

## Vulnerabilidades conhecidas (dev-only)

As seguintes vulnerabilidades são em tooling de desenvolvimento e **não afetam produção**:

| Pacote    | Versão vuln | Caminho                               | Ação            |
| --------- | ----------- | ------------------------------------- | --------------- |
| minimatch | <3.1.3      | eslint → @eslint/eslintrc → minimatch | Aceitável (dev) |
| minimatch | 9.0.x       | @typescript-eslint → minimatch        | Aceitável (dev) |
| picomatch | <2.3.2      | jest → anymatch → picomatch           | Aceitável (dev) |

Verificar periodicamente com `pnpm audit` e atualizar se patches estiverem disponíveis.

## Padrão de documentação

Cada doc em `docs/` deve ter o cabeçalho:

```markdown
# Título

**Status:** Ativo|Arquivado | **Branch:** <branch> | **Base:** develop
```

Seguido de:

- Tabela de arquivos criados/modificados
- Diagrama de fluxo se relevante (mermaid ou ASCII)
- Comandos para reproduzir/testar

## Convenções de commit (Conventional Commits)

```
feat(scope): descrição curta
fix(scope): descrição curta
chore(scope): descrição curta
docs(scope): descrição curta
test(scope): descrição curta
refactor(scope): descrição curta
ci(scope): descrição curta
```

- Scope: `api`, `web`, `mobile`, `contracts`, `ci`, `docs`
- Descrição em português, imperativo, sem ponto final
- Breaking changes: `feat!` ou `BREAKING CHANGE:` no footer

## Branches

| Padrão                    | Exemplo                           | Destino |
| ------------------------- | --------------------------------- | ------- |
| `feat/<descricao>`        | `feat/novo-agendamento`           | develop |
| `fix/<descricao>`         | `fix/ci-quality-security`         | develop |
| `hotfix/<descricao>`      | `hotfix/login-crash`              | main    |
| `claude/<descricao-hash>` | `claude/field-limits-masks-XDba5` | develop |

- Nunca criar branches sem permissão explícita
- Nunca commitar diretamente em `develop` ou `main`
- Resolver conflitos antes de abrir PR — nunca contornar com force push
