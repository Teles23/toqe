# Setup Inicial do Monorepo

**Data:** 05 de Maio de 2026
**Status:** Concluído

Este documento registra as configurações e padronizações iniciais aplicadas ao monorepo do Toqe, baseadas nas diretrizes arquiteturais do projeto.

## 1. Estrutura de Diretórios e Pacotes
A estrutura foi limpa e ajustada para suportar os três aplicativos principais (API, Web e Mobile) e seus pacotes compartilhados.
- **Removidos:** `apps/docs` e `packages/ui` (não aplicáveis ao projeto).
- **Criados em `packages/`:**
  - `shared`: Destinado a tipos TypeScript (`types`), enumeradores (`enums`) e objetos de transferência de dados (`dtos`) globais.
  - `validators`: Destinado aos schemas do Zod para validação de dados em toda a stack (ex: `auth.schema.ts`, `agendamento.schema.ts`).
  - `config`: Destinado a variáveis de ambiente tipadas e globais (`env.ts`).
- **Raiz do Projeto:** Criado o arquivo `tsconfig.base.json` para permitir que todos os aplicativos enxerguem os pacotes via alias (ex: `@toqe/shared`). O `turbo.json` foi simplificado.

## 2. Configurações do App Mobile (Expo)
Para que o Expo consiga compilar código de fora da pasta `apps/mobile` (como os pacotes compartilhados), as seguintes configurações foram criadas/alteradas:
- `app.json`: Adicionado `"appRoot": "apps/mobile"` para compatibilidade com os serviços de build do EAS.
- `eas.json`: Criado o perfil de build base (development e production).
- `metro.config.js`: Sobrescrito para adicionar o `monorepoRoot` no `watchFolders` e no `nodeModulesPaths`, permitindo importações do workspace.

## 3. Configurações do App API (NestJS)
- Conflito de dependência apagada (`@repo/ui`) foi removido de todos os aplicativos.
- Instalados os pacotes básicos do Prisma (`prisma` e `@prisma/client`) para iniciar a modelagem do banco de dados na próxima etapa.

## 4. Infraestrutura (Docker)
Preparado o ambiente para rodar o projeto localmente e simular a VPS:
- **`docker-compose.yml`**: Configurado com os serviços vitais:
  - `postgres`: Banco de dados relacional (versão 16-alpine).
  - `redis`: Banco em memória para cache e filas (BullMQ).
  - `api`: Backend NestJS.
  - `web`: Portal Next.js.
  - `nginx`: Proxy reverso.
- **Dockerfiles**: Criados arquivos de configuração base para `apps/api` e `apps/web`.
- **Nginx (`nginx/conf.d/toqe.conf`)**: Configurado o roteamento base:
  - `/api/v1/` e `/api/v2/` -> container `api`.
  - `/socket.io/` -> container `api` com suporte a Upgrade (WebSocket).
  - `/` -> container `web`.

---

> **Próximos passos programados:** 
> 1. Criação e modelagem do Schema do Prisma (Barbearia, Agendamento, etc).
> 2. Implementação da base JWT e Tenant/RLS no NestJS.
