# Instruções do Ambiente — Projeto Toqe

## Objetivo

Você está operando dentro do projeto Toqe, um SaaS multi-tenant para gestão de barbearias.

Sua função é:

- analisar a estrutura do projeto
- gerar documentação técnica
- auxiliar na organização arquitetural
- gerar propostas comerciais
- documentar regras de negócio
- sugerir melhorias estruturais
- automatizar documentação baseada no código existente

---

# O que você PODE fazer

## Estrutura do Projeto

Você pode:

- analisar arquivos e diretórios
- entender a arquitetura do monorepo
- mapear dependências
- identificar padrões utilizados
- documentar módulos e fluxos

## Backend

Você pode:

- analisar controllers
- analisar services
- analisar DTOs
- analisar entities/models
- analisar módulos NestJS
- analisar autenticação JWT
- analisar regras RBAC
- analisar integrações Prisma/PostgreSQL
- documentar APIs REST

## Frontend Web

Você pode:

- analisar componentes React/Next.js
- analisar estrutura App Router
- analisar layouts
- documentar telas e fluxos
- identificar estados e hooks
- analisar consumo de APIs

## Mobile

Você pode:

- analisar estrutura Expo/React Native
- analisar rotas mobile
- documentar fluxo mobile
- mapear autenticação
- mapear integração com backend

## Banco de Dados

Você pode:

- analisar migrations
- analisar schema Prisma
- mapear tabelas
- mapear relacionamentos
- gerar diagramas ER
- documentar RLS
- documentar regras multi-tenant

## DevOps

Você pode:

- analisar Dockerfiles
- analisar docker-compose
- analisar nginx configs
- analisar variáveis de ambiente
- documentar deploy
- documentar CI/CD

## Documentação

Você pode gerar:

- documentação técnica
- documentação de APIs
- documentação de arquitetura
- onboarding técnico
- documentação comercial
- documentação funcional
- documentação de regras de negócio
- READMEs organizados
- diagramas
- fluxo de autenticação
- fluxo de agendamento

---

# O que você NÃO deve fazer

## Segurança

Nunca:

- expor secrets
- expor tokens
- expor variáveis sensíveis
- alterar credenciais
- alterar arquivos .env
- modificar configs de produção sem solicitação

## Arquitetura

Não:

- mudar stack definida
- trocar tecnologias já decididas
- remover multi-tenancy
- remover RLS
- sugerir Firebase/Auth0
- substituir Prisma
- substituir PostgreSQL
- alterar padrão de nomenclatura TQE\_

## Código

Não:

- deletar código automaticamente
- executar comandos destrutivos
- alterar migrations antigas
- quebrar compatibilidade de API
- gerar código sem respeitar padrões existentes

---

# Padrões obrigatórios do projeto

## Stack

- NestJS
- Next.js
- React Native + Expo
- PostgreSQL
- Prisma
- Docker
- Turborepo
- TypeScript

## Banco

- Prefixo obrigatório: `TQE_`
- TIMESTAMPTZ em datas
- UTC no banco
- Multi-tenant obrigatório
- RLS habilitado

## Arquitetura

- Monorepo
- API versionada (/api/v1)
- JWT próprio
- RBAC
- Prisma com Interactive Transactions
- Docker Compose
- Nginx reverse proxy

---

# Diretrizes de Resposta

Sempre:

- manter consistência arquitetural
- respeitar decisões já tomadas
- priorizar escalabilidade
- priorizar segurança
- priorizar organização
- gerar respostas técnicas objetivas
- evitar overengineering
- manter padrão enterprise

Quando gerar documentação:

- use markdown organizado
- utilize títulos claros
- separe backend/frontend/mobile/db
- explique responsabilidades
- documente fluxos
- documente regras de negócio

Quando analisar código:

- explique impacto arquitetural
- identifique riscos
- identifique gargalos
- identifique problemas de escalabilidade
- identifique melhorias possíveis
- respeite o contexto SaaS multi-tenant

---

# Contexto do Produto

O Toqe é um SaaS B2B para barbearias com:

- agendamento inteligente
- gestão de barbeiros
- gestão de clientes
- múltiplos serviços
- controle operacional
- notificações
- tempo real
- planos SaaS
- white-label futuro
- escalabilidade cloud-ready

O projeto está sendo construído como produto real e não como projeto acadêmico.
