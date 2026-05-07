# Toqe — Documentação Técnica Completa
> Documento de referência para o agente de IA. Todas as decisões arquiteturais estão tomadas e documentadas.
> Não reabra decisões fechadas. Use este documento como contexto fixo em toda conversa.

---

## Índice por Prioridade de Implementação

1. [Identidade e Stack](#1-identidade-e-stack)
2. [Padrão de Banco de Dados](#2-padrão-de-banco-de-dados)
3. [Auth JWT + RBAC](#3-auth-jwt--rbac)
4. [RLS — Row Level Security](#4-rls--row-level-security)
5. [Modelagem de Agenda](#5-modelagem-de-agenda)
6. [Monorepo — Estrutura](#6-monorepo--estrutura)
7. [Migrations com Prisma](#7-migrations-com-prisma)
8. [Infraestrutura — Docker + VPS](#8-infraestrutura--docker--vps)
9. [Versionamento de API](#9-versionamento-de-api)
10. [CI/CD](#10-cicd)
11. [Filas — Redis + BullMQ](#11-filas--redis--bullmq)
12. [Notificações Multi-Canal](#12-notificações-multi-canal)
13. [Tempo Real — WebSocket](#13-tempo-real--websocket)
14. [Planos e Feature Flags](#14-planos-e-feature-flags)
15. [Observabilidade](#15-observabilidade)
16. [White-Label](#16-white-label)
17. [Escalabilidade e Cloud](#17-escalabilidade-e-cloud)
18. [Regras de Negócio Futuras](#18-regras-de-negócio-futuras)
19. [Decisões Fechadas — Referência Rápida](#19-decisões-fechadas--referência-rápida)

---

## 1. Identidade e Stack

**Nome:** Toqe
**Tipo:** SaaS B2B multi-tenant para gestão de barbearias
**Público:** donos de barbearia, gerentes, barbeiros, clientes finais

### Stack — decisões fechadas

| Camada | Tecnologia | Decisão |
|---|---|---|
| Backend | NestJS + TypeScript | API REST + WebSocket |
| Portal admin | Next.js + TypeScript | Middleware auth nativo, BFF, Server Actions |
| App mobile | React Native + Expo | Cliente final + barbeiro |
| Banco | PostgreSQL | RLS + TIMESTAMPTZ em todos os campos de data |
| ORM | Prisma | DX, type-safety, migrations versionadas |
| Monorepo | Turborepo | 3 apps + packages compartilhados |
| Infra | VPS Contabo + Docker + Nginx | Container PostgreSQL dedicado ao Toqe |
| Cache/Filas | Redis | BullMQ para filas assíncronas |
| Auth | JWT próprio no NestJS | Sem Firebase — sem lock-in |
| Acesso | RBAC | Guards NestJS + replicado no frontend |
| Isolamento | RLS no PostgreSQL | Segurança no banco, não só no código |

**Por que Next.js e não Vite para o portal admin:**
O portal é 100% autenticado — não precisa de SEO. Next.js é escolhido pelo middleware de auth nativo (protege rotas antes do React renderizar), API Routes para BFF leve, e Server Actions. Não use SSG ou ISR — o portal é todo dinâmico.

**Por que Prisma e não TypeORM:**
Prisma gera tipos TypeScript automaticamente a partir do schema — qualquer mudança no banco quebra em tempo de compilação nos três apps. Migrations versionadas e legíveis. A única limitação com RLS está resolvida — ver seção 4.

---

## 2. Padrão de Banco de Dados

### Convenções obrigatórias — nunca violar

- Prefixo fixo `TQE_` em **todas** as tabelas, sem exceção
- Campos com sigla de 3 letras da tabela antes do nome: `TQE_BAR_NOME`, `TQE_AGD_INICIO`
- **Sempre** `TIMESTAMPTZ` — nunca `TIMESTAMP` sem timezone
- Dados salvos em **UTC**. Conversão feita na aplicação com base em `TQE_BAR_TIMEZONE`
- FK de tenant (`TQE_XXX_BAR_CODIGO`) obrigatória em **todas** as tabelas filhas
- RLS ativado em todas as tabelas

### Mapeamento no schema.prisma

O Prisma usa camelCase internamente. Use `@@map` e `@map` para manter o padrão `TQE_` no banco:

```prisma
model Barbearia {
  codigo    Int      @id @default(autoincrement()) @map("TQE_BAR_CODIGO")
  nome      String   @map("TQE_BAR_NOME") @db.VarChar(100)
  slug      String   @unique @map("TQE_BAR_SLUG") @db.VarChar(60)
  timezone  String   @default("America/Sao_Paulo") @map("TQE_BAR_TIMEZONE")
  plano     String   @default("free") @map("TQE_BAR_PLANO")
  ativo     Boolean  @default(true) @map("TQE_BAR_ATIVO")
  criadoEm  DateTime @default(now()) @map("TQE_BAR_CRIADO_EM") @db.Timestamptz

  servicos      Servico[]
  agendamentos  Agendamento[]
  bloqueios     BloqueioAgenda[]

  @@map("TQE_BARBEARIA")
}
```

### Mapa de siglas por tabela

| Tabela | Sigla |
|---|---|
| TQE_BARBEARIA | BAR |
| TQE_USUARIO | USR |
| TQE_MEMBRO_BARBEARIA | MBR |
| TQE_SERVICO | SRV |
| TQE_BARBEIRO_SERVICO | BSV |
| TQE_AGENDAMENTO | AGD |
| TQE_AGENDAMENTO_ITEM | AGI |
| TQE_BLOQUEIO_AGENDA | BLA |
| TQE_JORNADA_TRABALHO | JOR |
| TQE_REFRESH_TOKEN | RTK |
| TQE_NOTIFICACAO | NTF |
| TQE_PLANO_LIMITE | PLI |

---

## 3. Auth JWT + RBAC

### Decisão

JWT próprio no NestJS, sem Firebase ou qualquer provider externo.

- **Access Token:** expira em 15 minutos
- **Refresh Token:** expira em 30 dias, com rotação a cada uso
- **Web (Next.js):** tokens em cookie `httpOnly` + `Secure` + `SameSite=Strict`
- **Mobile (Expo):** tokens em `SecureStore` (nunca `AsyncStorage`)
- **Refresh tokens** salvos no banco com hash (nunca o valor puro)

### Payload do JWT

```typescript
interface JwtPayload {
  sub: number;        // TQE_USR_CODIGO (Conta Global)
  iat: number;
  exp: number;
}

enum Perfil {
  SUPER_ADMIN   = 'super_admin',  // equipe Toqe
  DONO          = 'dono',
  GERENTE       = 'gerente',
  BARBEIRO      = 'barbeiro',
  RECEPCIONISTA = 'recepcionista',
  CLIENTE       = 'cliente',
}
```

### Tabela de refresh tokens

```sql
CREATE TABLE TQE_REFRESH_TOKEN (
  TQE_RTK_CODIGO      SERIAL PRIMARY KEY,
  TQE_RTK_USR_CODIGO  INT REFERENCES TQE_USUARIO,
  TQE_RTK_HASH        VARCHAR(255) NOT NULL,  -- bcrypt do token
  TQE_RTK_EXPIRA_EM   TIMESTAMPTZ NOT NULL,
  TQE_RTK_REVOGADO    BOOLEAN DEFAULT FALSE,
  TQE_RTK_CRIADO_EM   TIMESTAMPTZ DEFAULT NOW()
);
```

### Fluxo de autenticação

```
[Cliente]  POST /api/v1/auth/login  { email, senha }
              ↓
[NestJS]   valida credenciais → gera access_token (15min) + refresh_token (30d)
           salva hash do refresh no banco
              ↓
[Web]      seta cookie httpOnly com ambos os tokens
[Mobile]   retorna tokens no body → app salva no SecureStore

--- refresh ---
[Cliente]  POST /api/v1/auth/refresh  (cookie ou body com refresh_token)
              ↓
[NestJS]   valida hash no banco → revoga token atual → gera novo par
           (rotação: refresh antigo nunca funciona duas vezes)
```

### Guard de tenant no NestJS

```typescript
// tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // injetado pelo JwtGuard (tem apenas 'sub' global)
    const barCodigo = request.params.barCodigo ?? request.body.barCodigo ?? request.headers['x-tenant-id'];

    if (!barCodigo) return true; // Rotas globais não precisam de tenant

    // 1. Consulta no banco se o usuário Global (user.sub) tem vínculo na TQE_MEMBRO_BARBEARIA
    // 2. Se não tiver, throw new ForbiddenException('Acesso negado ao tenant');
    // 3. request.user.perfil = membro.perfil; // Injeta o perfil local na request para o RBAC
    return true;
  }
}
```

### RBAC — matriz de permissões base

| Recurso | super_admin | dono | gerente | barbeiro | recepcionista | cliente |
|---|---|---|---|---|---|---|
| Gerenciar barbearia | ✓ | ✓ | — | — | — | — |
| Gerenciar barbeiros | ✓ | ✓ | ✓ | — | — | — |
| Ver agenda completa | ✓ | ✓ | ✓ | própria | ✓ | — |
| Criar agendamento | ✓ | ✓ | ✓ | ✓ | ✓ | próprio |
| Cancelar agendamento | ✓ | ✓ | ✓ | próprio | ✓ | próprio |
| Ver relatórios | ✓ | ✓ | ✓ | — | — | — |
| Gerenciar plano/billing | ✓ | ✓ | — | — | — | — |

---

## 4. RLS — Row Level Security

### O problema com Prisma + RLS

O Prisma gerencia pool de conexões. Um `SET app.current_tenant = X` simples vaza entre conexões do pool — a conexão volta pro pool com o setting ativo e pode ser reusada por outro tenant. **Isso é uma falha de segurança grave.**

### Solução correta — Interactive Transaction com set_config local

```typescript
// tenant-context.service.ts
@Injectable()
export class TenantContextService {
  constructor(private prisma: PrismaService) {}

  async run<T>(
    barCodigo: number,
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      // true = local à transação. Quando commit/rollback, some automaticamente.
      await tx.$executeRaw`
        SELECT set_config('app.current_tenant', ${barCodigo}::text, true)
      `;
      return fn(tx);
    });
  }
}
```

O terceiro parâmetro `true` no `set_config` é o que resolve o problema — o setting dura apenas enquanto a transação estiver aberta. Quando fecha, a conexão volta ao pool limpa.

### Uso nos services

```typescript
// agendamento.service.ts
async findAll(barCodigo: number) {
  return this.tenantCtx.run(barCodigo, (tx) =>
    tx.agendamento.findMany({
      where: { inicio: { gte: new Date() } },
      include: { itens: true },
    })
  );
}
```

### Setup do RLS no PostgreSQL

```sql
-- Ativar RLS em cada tabela
ALTER TABLE TQE_BARBEARIA     ENABLE ROW LEVEL SECURITY;
ALTER TABLE TQE_AGENDAMENTO   ENABLE ROW LEVEL SECURITY;
ALTER TABLE TQE_SERVICO       ENABLE ROW LEVEL SECURITY;
-- (repetir para todas as tabelas filhas)

-- Policy para o role da aplicação
CREATE POLICY tenant_isolation ON TQE_AGENDAMENTO
  USING (
    TQE_AGD_BAR_CODIGO = current_setting('app.current_tenant', true)::int
  );

-- Criar role para a aplicação (não usar superuser em produção)
CREATE ROLE toqe_app LOGIN PASSWORD 'senha_forte';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO toqe_app;

-- Super admin bypassa RLS via role separado
CREATE ROLE toqe_admin BYPASSRLS LOGIN PASSWORD 'senha_admin';
```

### Interceptor para automatizar

Para garantir que todo request de negócio passe pelo contexto de tenant automaticamente:

```typescript
// tenant.interceptor.ts
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private tenantCtx: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const barCodigo: number = req.user?.barCodigo;

    if (!barCodigo) return next.handle(); // super_admin sem tenant

    // Injeta o contexto antes de passar pro controller
    req.runInTenant = <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) =>
      this.tenantCtx.run(barCodigo, fn);

    return next.handle();
  }
}
```

---

## 5. Modelagem de Agenda

### Decisão: AGENDAMENTO + AGENDAMENTO_ITEM

Um agendamento pode ter múltiplos serviços (corte + barba). A tabela de itens resolve isso e mantém snapshot de preço/duração no momento do agendamento — imune a mudanças futuras de preço.

```sql
-- Agendamento (cabeçalho)
CREATE TABLE TQE_AGENDAMENTO (
  TQE_AGD_CODIGO      SERIAL PRIMARY KEY,
  TQE_AGD_BAR_CODIGO  INT REFERENCES TQE_BARBEARIA NOT NULL,
  TQE_AGD_BARBEIRO_ID INT REFERENCES TQE_USUARIO   NOT NULL,
  TQE_AGD_CLIENTE_ID  INT REFERENCES TQE_USUARIO   NOT NULL,
  TQE_AGD_INICIO      TIMESTAMPTZ NOT NULL,
  TQE_AGD_FIM         TIMESTAMPTZ NOT NULL,  -- calculado: soma de duração dos itens
  TQE_AGD_STATUS      VARCHAR(20) DEFAULT 'PENDENTE',
  -- PENDENTE | CONFIRMADO | CANCELADO | NO_SHOW | CONCLUIDO
  TQE_AGD_TIPO        VARCHAR(20) DEFAULT 'AGENDADO',
  -- AGENDADO | WALK_IN | ENCAIXE
  TQE_AGD_OBSERVACAO  TEXT,
  TQE_AGD_CRIADO_EM   TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do agendamento (snapshot de preço e duração)
CREATE TABLE TQE_AGENDAMENTO_ITEM (
  TQE_AGI_CODIGO       SERIAL PRIMARY KEY,
  TQE_AGI_BAR_CODIGO   INT REFERENCES TQE_BARBEARIA  NOT NULL,
  TQE_AGI_AGD_CODIGO   INT REFERENCES TQE_AGENDAMENTO NOT NULL,
  TQE_AGI_SRV_CODIGO   INT REFERENCES TQE_SERVICO     NOT NULL,
  TQE_AGI_DURACAO_MIN  INT           NOT NULL,   -- snapshot no momento
  TQE_AGI_PRECO        NUMERIC(10,2) NOT NULL,   -- snapshot no momento
  TQE_AGI_ORDEM        SMALLINT      DEFAULT 1   -- ordem de execução
);

-- Serviços da barbearia
CREATE TABLE TQE_SERVICO (
  TQE_SRV_CODIGO     SERIAL PRIMARY KEY,
  TQE_SRV_BAR_CODIGO INT REFERENCES TQE_BARBEARIA NOT NULL,
  TQE_SRV_NOME       VARCHAR(100) NOT NULL,
  TQE_SRV_PRECO_BASE NUMERIC(10,2),
  TQE_SRV_ATIVO      BOOLEAN DEFAULT TRUE
);

-- Duração e preço por barbeiro (o mesmo serviço pode durar tempos diferentes)
CREATE TABLE TQE_BARBEIRO_SERVICO (
  TQE_BSV_CODIGO        SERIAL PRIMARY KEY,
  TQE_BSV_BAR_CODIGO    INT REFERENCES TQE_BARBEARIA NOT NULL,
  TQE_BSV_BARBEIRO_ID   INT REFERENCES TQE_USUARIO   NOT NULL,
  TQE_BSV_SRV_CODIGO    INT REFERENCES TQE_SERVICO   NOT NULL,
  TQE_BSV_DURACAO_MIN   INT           NOT NULL,
  TQE_BSV_PRECO_PROPRIO NUMERIC(10,2),  -- NULL = usa preço base do serviço
  UNIQUE (TQE_BSV_BARBEIRO_ID, TQE_BSV_SRV_CODIGO)
);
```

### Bloqueio de agenda — tabela separada

Bloqueios não são atendimentos. Misturar na tabela de agendamento força `cliente_id` nulo, atrapalha relatórios e complica queries de produtividade.

```sql
CREATE TABLE TQE_BLOQUEIO_AGENDA (
  TQE_BLA_CODIGO        SERIAL PRIMARY KEY,
  TQE_BLA_BAR_CODIGO    INT REFERENCES TQE_BARBEARIA NOT NULL,
  TQE_BLA_BARBEIRO_ID   INT REFERENCES TQE_USUARIO   NOT NULL,
  TQE_BLA_INICIO        TIMESTAMPTZ NOT NULL,
  TQE_BLA_FIM           TIMESTAMPTZ NOT NULL,
  TQE_BLA_MOTIVO        VARCHAR(100),  -- 'almoço', 'limpeza', 'reunião'
  TQE_BLA_RECORRENTE    BOOLEAN DEFAULT FALSE,
  -- se recorrente, usar TQE_JORNADA_TRABALHO para o padrão semanal
  TQE_BLA_CRIADO_EM     TIMESTAMPTZ DEFAULT NOW()
);
```

**Bloqueios recorrentes (almoço todo dia):** não crie um registro por dia. Use a tabela de jornada de trabalho para definir o padrão semanal. Crie registros em `TQE_BLOQUEIO_AGENDA` apenas para exceções pontuais (um dia específico, férias, evento).

### Jornada de trabalho do barbeiro

```sql
CREATE TABLE TQE_JORNADA_TRABALHO (
  TQE_JOR_CODIGO        SERIAL PRIMARY KEY,
  TQE_JOR_BAR_CODIGO    INT REFERENCES TQE_BARBEARIA NOT NULL,
  TQE_JOR_BARBEIRO_ID   INT REFERENCES TQE_USUARIO   NOT NULL,
  TQE_JOR_DIA_SEMANA    SMALLINT NOT NULL,  -- 0=Dom, 1=Seg... 6=Sab
  TQE_JOR_INICIO        TIME NOT NULL,      -- ex: '09:00'
  TQE_JOR_FIM           TIME NOT NULL,      -- ex: '18:00'
  TQE_JOR_ALMOCO_INI    TIME,               -- ex: '12:00'
  TQE_JOR_ALMOCO_FIM    TIME,               -- ex: '13:00'
  TQE_JOR_ATIVO         BOOLEAN DEFAULT TRUE
);
```

### Query de disponibilidade (slots livres)

Para montar os slots livres de um barbeiro em um dia, cheque as três fontes:

```sql
-- Todos os "ocupados" de um barbeiro em um período
SELECT TQE_AGD_INICIO AS inicio, TQE_AGD_FIM AS fim
FROM TQE_AGENDAMENTO
WHERE TQE_AGD_BARBEIRO_ID = $1
  AND TQE_AGD_STATUS NOT IN ('CANCELADO')
  AND TQE_AGD_INICIO::date = $2

UNION ALL

SELECT TQE_BLA_INICIO, TQE_BLA_FIM
FROM TQE_BLOQUEIO_AGENDA
WHERE TQE_BLA_BARBEIRO_ID = $1
  AND TQE_BLA_INICIO::date = $2

ORDER BY inicio;
-- Código da aplicação usa essa lista + jornada do dia para calcular slots livres
```

A geração de slots (`generate_series`) é feita na aplicação (NestJS), não no banco, para facilitar lógica de múltiplos serviços e durações variáveis.

### Concorrência — double booking

```typescript
// dentro de TenantContextService.run()
await tx.$executeRaw`
  SELECT 1 FROM TQE_AGENDAMENTO
  WHERE TQE_AGD_BARBEIRO_ID = ${barbeiro_id}
    AND TQE_AGD_STATUS NOT IN ('CANCELADO')
    AND TQE_AGD_INICIO < ${fim}
    AND TQE_AGD_FIM   > ${inicio}
  FOR UPDATE SKIP LOCKED
`;
// se retornar linha = conflito → throw ConflictException
// se não retornar → seguir com INSERT
```

O `SKIP LOCKED` garante que o segundo request concorrente não espera — falha imediatamente com 409, sem deadlock.

---

## 6. Monorepo — Estrutura

### Estrutura de pastas

```
toqe/
├── apps/
│   ├── api/                        ← NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── agendamento/
│   │   │   │   ├── barbeiro/
│   │   │   │   └── tenant/
│   │   │   ├── prisma/             ← PrismaService
│   │   │   └── main.ts
│   │   └── package.json
│   ├── web/                        ← Next.js
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   └── api/                ← BFF routes
│   │   └── package.json
│   └── mobile/                     ← React Native + Expo
│       ├── app/                    ← Expo Router (file-based)
│       ├── components/
│       └── package.json
├── packages/
│   ├── shared/                     ← tipos TS, enums, interfaces
│   │   ├── src/
│   │   │   ├── dtos/               ← CreateAgendamentoDto, etc.
│   │   │   ├── enums/              ← StatusAgendamento, Perfil, Plano
│   │   │   └── types/              ← Barbearia, Agendamento, Servico
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── validators/                 ← schemas Zod
│   │   ├── src/
│   │   │   ├── agendamento.schema.ts
│   │   │   └── auth.schema.ts
│   │   └── package.json
│   └── config/                     ← env tipado e validado
│       └── src/env.ts
├── turbo.json
├── package.json
└── tsconfig.base.json
```

### tsconfig.base.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@toqe/shared":     ["packages/shared/src/index.ts"],
      "@toqe/validators": ["packages/validators/src/index.ts"],
      "@toqe/config":     ["packages/config/src/index.ts"]
    },
    "strict": true,
    "skipLibCheck": true
  }
}
```

### turbo.json mínimo

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Expo dentro do monorepo

O Metro bundler do Expo não resolve workspaces automaticamente. Adicione ao `metro.config.js` do app mobile:

```javascript
// apps/mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
```

### eas.json dentro do monorepo

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

No `app.json`, defina `"appRoot": "apps/mobile"` para o EAS encontrar o app dentro do monorepo.

---

## 7. Migrations com Prisma

### Regras invioláveis

- **Nunca edite uma migration já aplicada em produção**
- Sempre revise o SQL gerado pelo Prisma antes de aplicar (`prisma migrate dev --create-only`)
- Migrations são versionadas no Git — cada PR de mudança de schema inclui a migration
- Em produção: `prisma migrate deploy` (nunca `prisma migrate dev`)

### Zero-downtime em produção

```dockerfile
# No Dockerfile da api — migration roda antes de subir o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

Com Docker e zero-downtime via rolling update:
1. Sobe nova versão do container (com migration)
2. Migration roda e termina
3. Container novo começa a receber tráfego
4. Container antigo é removido

Para migrations com breaking changes (renomear coluna), use o padrão expand-contract:
- Deploy 1: adiciona coluna nova (expand)
- Deploy 2: código lê nova coluna, escreve nas duas
- Deploy 3: remove coluna antiga (contract)

### Schema prisma com padrão TQE_

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Agendamento {
  codigo      Int      @id @default(autoincrement()) @map("TQE_AGD_CODIGO")
  barCodigo   Int      @map("TQE_AGD_BAR_CODIGO")
  barbeiroId  Int      @map("TQE_AGD_BARBEIRO_ID")
  clienteId   Int      @map("TQE_AGD_CLIENTE_ID")
  inicio      DateTime @map("TQE_AGD_INICIO") @db.Timestamptz
  fim         DateTime @map("TQE_AGD_FIM") @db.Timestamptz
  status      String   @default("PENDENTE") @map("TQE_AGD_STATUS")
  tipo        String   @default("AGENDADO") @map("TQE_AGD_TIPO")
  criadoEm    DateTime @default(now()) @map("TQE_AGD_CRIADO_EM") @db.Timestamptz

  barbearia   Barbearia          @relation(fields: [barCodigo], references: [codigo])
  itens       AgendamentoItem[]

  @@map("TQE_AGENDAMENTO")
}
```

---

## 8. Infraestrutura — Docker + VPS

### docker-compose.yml completo

```yaml
version: '3.9'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/certs:/etc/nginx/certs
    depends_on:
      - api
      - web
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - API_URL=http://api:3000
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: toqe
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    # NÃO expor porta 5432 externamente

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    # NÃO expor porta 6379 externamente

volumes:
  postgres_data:
  redis_data:
```

> **Importante:** PostgreSQL e Redis **não expõem portas externas**. Apenas os serviços internos do Docker se comunicam com eles. Acesso externo ao banco (para inspecionar em dev) via `docker exec` ou SSH tunnel. O NGINX foi mapeado para a porta **8080** no host para evitar conflitos no Windows.

### Nginx — configuração de rotas

```nginx
# /nginx/conf.d/toqe.conf

server {
    listen 80; # Mapeado para 8080 no host
    listen 443 ssl;
    server_name api.toqe.app;

    location /api/v1/ {
        proxy_pass http://api:3000/api/v1/;
    }

    location /api/v2/ {
        proxy_pass http://api:3000/api/v2/;
    }

    location /socket.io/ {
        proxy_pass http://api:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 443 ssl;
    server_name app.toqe.app;

    location / {
        proxy_pass http://web:3001/;
    }
}
```

### Gerenciamento de secrets na VPS

Use arquivo `.env` fora do repositório Git, com permissão restrita:

```bash
# Na VPS, nunca no repositório
chmod 600 /opt/toqe/.env
chown root:root /opt/toqe/.env
```

```bash
# .env de produção (exemplo — valores reais nunca no Git)
DATABASE_URL=postgresql://toqe_app:senha@postgres:5432/toqe
JWT_SECRET=gere-com-openssl-rand-base64-64
JWT_REFRESH_SECRET=gere-com-openssl-rand-base64-64
REDIS_URL=redis://:senha@redis:6379
POSTGRES_USER=toqe_app
POSTGRES_PASSWORD=senha_forte
```

Gere secrets com: `openssl rand -base64 64`

---

## 9. Versionamento de API

### Estratégia no NestJS

Use versionamento por URI com o módulo nativo do NestJS:

```typescript
// main.ts
app.enableVersioning({
  type: VersioningType.URI, // /api/v1/..., /api/v2/...
  defaultVersion: '1',
});
```

```typescript
// agendamento.controller.ts
@Controller({ path: 'agendamentos', version: '1' })
export class AgendamentoControllerV1 { ... }

@Controller({ path: 'agendamentos', version: '2' })
export class AgendamentoControllerV2 { ... }
```

### Cenário: app v1.0.0 rodando, você lança backend com breaking change

1. Cria `/api/v2/` com as novas rotas
2. Mantém `/api/v1/` funcionando sem alteração
3. Lança app v1.1.0 apontando para `/api/v2/`
4. Após 3 meses (ou % de usuários na v1 < 5%), depreca `/api/v1/`
5. Adiciona header `Sunset: <data>` nas respostas da v1 para forçar atualização

### OTA updates com Expo (mudanças não-breaking)

Mudanças que **não quebram** o contrato da API (UI, textos, lógica no frontend) podem ser publicadas via EAS Update sem passar pela store:

```bash
eas update --branch production --message "fix: layout da tela de agenda"
```

O app baixa a atualização silenciosamente na próxima abertura. Use para: correções de UI, textos, lógica de frontend. **Nunca** para mudanças que dependem de nova versão da API.

---

## 10. CI/CD

### GitHub Actions — pipeline do monorepo

```yaml
# .github/workflows/deploy.yml
name: Deploy Toqe

on:
  push:
    branches: [main]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      api: ${{ steps.filter.outputs.api }}
      web: ${{ steps.filter.outputs.web }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            api:
              - 'apps/api/**'
              - 'packages/**'
            web:
              - 'apps/web/**'
              - 'packages/**'

  deploy-api:
    needs: changes
    if: needs.changes.outputs.api == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy API (zero-downtime)
        run: |
          ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} "
            cd /opt/toqe &&
            git pull &&
            docker compose build api &&
            docker compose up -d --no-deps api
          "

  deploy-web:
    needs: changes
    if: needs.changes.outputs.web == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Web
        run: |
          ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} "
            cd /opt/toqe &&
            git pull &&
            docker compose build web &&
            docker compose up -d --no-deps web
          "
```

O `paths-filter` garante que a API não é rebuildada quando só o web mudou — e vice-versa. O Turborepo cache faz o mesmo na camada de build.

### Rollback rápido

```bash
# Na VPS — rollback para imagem anterior
docker compose up -d --no-deps api --scale api=0
docker tag toqe_api:previous toqe_api:latest
docker compose up -d --no-deps api
```

Mantenha sempre a imagem anterior tagueada como `:previous` antes de cada deploy.

---

## 11. Filas — Redis + BullMQ

### Container Redis no docker-compose

Já incluído na seção 8. O Redis sobe desde o início da infra — ocupa ~30MB de RAM em idle.

### Setup do BullMQ no NestJS

```bash
npm install @nestjs/bull bull
```

```typescript
// app.module.ts
BullModule.forRoot({
  connection: {
    host: process.env.REDIS_HOST,
    port: 6379,
    password: process.env.REDIS_PASSWORD,
  },
}),
BullModule.registerQueue(
  { name: 'notificacoes' },
  { name: 'relatorios' },
),
```

### Filas por prioridade de implementação

| Fila | Quando implementar | O que processa |
|---|---|---|
| `notificacoes` | MVP | Confirmação, lembrete 1h antes, cancelamento |
| `relatorios` | Mês 2-3 | PDF de comanda, relatório diário por tenant |
| `tarefas-pesadas` | Conforme necessidade | Export de dados, recálculo de comissões |

### Worker de notificações

```typescript
@Processor('notificacoes')
export class NotificacoesProcessor {
  @Process('lembrete-agendamento')
  async enviarLembrete(job: Job<{ agendamentoId: number }>) {
    const agendamento = await this.agendamentoService.findById(job.data.agendamentoId);
    await this.notificacaoService.enviar(agendamento);
  }
}

// Agendando o job no momento do agendamento
await this.notificacoesQueue.add(
  'lembrete-agendamento',
  { agendamentoId: agendamento.id },
  { delay: calcularDelay1HoraAntes(agendamento.inicio) }
);
```

---

## 12. Notificações Multi-Canal

### Padrão: Strategy + EventEmitter do NestJS

Não acople o canal de notificação ao código de negócio. Use eventos internos do NestJS:

```typescript
// Emite o evento — não sabe qual canal vai entregar
this.eventEmitter.emit('agendamento.confirmado', { agendamento, cliente });

// Cada canal é um listener independente
@OnEvent('agendamento.confirmado')
async handlePush(payload) { ... }

@OnEvent('agendamento.confirmado')
async handleWhatsApp(payload) { ... }

@OnEvent('agendamento.confirmado')
async handleEmail(payload) { ... }
```

Adicionar um canal novo = criar um novo listener. Nenhum código de negócio muda.

### Preferências de notificação por cliente

```sql
CREATE TABLE TQE_NOTIFICACAO_PREFERENCIA (
  TQE_NPR_CODIGO      SERIAL PRIMARY KEY,
  TQE_NPR_BAR_CODIGO  INT REFERENCES TQE_BARBEARIA NOT NULL,
  TQE_NPR_USR_CODIGO  INT REFERENCES TQE_USUARIO   NOT NULL,
  TQE_NPR_CANAL       VARCHAR(20) NOT NULL, -- push | whatsapp | sms | email
  TQE_NPR_ATIVO       BOOLEAN DEFAULT TRUE
);
```

---

## 13. Tempo Real — WebSocket

### Decisão: WebSocket + Push como fallback

- **WebSocket (Socket.io):** quando o app está aberto — confirmação instantânea, atualização de fila
- **Push Notification (Expo):** quando o app está em background ou fechado — lembrete, cancelamento

Os dois são complementares, não substitutos.

```typescript
// NestJS + Socket.io por sala de tenant
@WebSocketGateway({ cors: true, namespace: '/agenda' })
export class AgendaGateway {
  @WebSocketServer() server: Server;

  // Barbeiro entra na sala do tenant ao conectar
  handleConnection(client: Socket) {
    const { barCodigo } = client.handshake.auth;
    client.join(`tenant:${barCodigo}`);
  }

  // Notifica todos na sala quando agendamento muda
  notificarAgendamento(barCodigo: number, agendamento: any) {
    this.server
      .to(`tenant:${barCodigo}`)
      .emit('agendamento:atualizado', agendamento);
  }
}
```

### Garantir entrega quando offline

Se o cliente estava offline quando o evento aconteceu, ao reconectar ele faz um GET normal para sincronizar o estado atual. O WebSocket não precisa guardar histórico — é só tempo real. O banco é a fonte da verdade.

---

## 14. Planos e Feature Flags

### Decisão: tabela no banco para limites + código para features

Limites quantitativos (máx de barbeiros, agendamentos/mês) ficam no banco — são dados de negócio que podem mudar por tenant. Features binárias (white-label, API pública) ficam em enum/config no código.

```sql
CREATE TABLE TQE_PLANO_LIMITE (
  TQE_PLI_CODIGO          SERIAL PRIMARY KEY,
  TQE_PLI_PLANO           VARCHAR(20) NOT NULL, -- free | basic | pro
  TQE_PLI_MAX_BARBEIROS   INT,    -- NULL = ilimitado
  TQE_PLI_MAX_AGD_MES     INT,    -- NULL = ilimitado
  TQE_PLI_WHITE_LABEL     BOOLEAN DEFAULT FALSE,
  TQE_PLI_API_PUBLICA     BOOLEAN DEFAULT FALSE,
  TQE_PLI_RELATORIOS_ADV  BOOLEAN DEFAULT FALSE
);

-- Dados iniciais
INSERT INTO TQE_PLANO_LIMITE VALUES
  (DEFAULT, 'free',  2,   50,  false, false, false),
  (DEFAULT, 'basic', 5,   500, false, false, false),
  (DEFAULT, 'pro',   NULL, NULL, true, true,  true);
```

### Bloqueio por inadimplência

```sql
-- Na TQE_BARBEARIA
TQE_BAR_PLANO_STATUS  VARCHAR(20) DEFAULT 'ativo'
-- ativo | inadimplente | suspenso | cancelado
TQE_BAR_BLOQUEADO_EM  TIMESTAMPTZ
```

Guard no NestJS verifica `TQE_BAR_PLANO_STATUS` em cada request de tenant. Webhook do gateway de pagamento (Stripe/Pagar.me) atualiza o status automaticamente.

---

## 15. Observabilidade

### Stack recomendada para VPS (sem custo alto)

| Ferramenta | Para quê | Custo |
|---|---|---|
| Sentry | Erros em runtime, stack traces, alertas | Gratuito até 5k erros/mês |
| Pino + pino-pretty | Logs estruturados no NestJS | Gratuito |
| Loki + Grafana | Agregação de logs, dashboards | Self-hosted, gratuito |
| Prometheus + Grafana | Métricas (latência, uso de memória) | Self-hosted, gratuito |

### Logs estruturados com tenant_id

```typescript
// Cada log deve ter barCodigo e requestId
const logger = pino({
  mixin: () => ({
    barCodigo: AsyncLocalStorage.getStore()?.barCodigo,
    requestId: AsyncLocalStorage.getStore()?.requestId,
  }),
});
```

### O que monitorar obrigatoriamente desde o início

1. Latência das queries de agendamento (alerta se > 200ms)
2. Taxa de erro 5xx por tenant
3. Fila de notificações — jobs com falha
4. Uso de memória do container PostgreSQL
5. Refresh token inválido — pode indicar ataque ou bug de rotação

---

## 16. White-Label

### A Mágica do "White-Label Contextual" (Deep Linking)

O aplicativo (Toqe) é único nas lojas. O "White-Label" funciona de forma **contextual**, ativado pela porta de entrada (o link que o cliente clica):

1. **Deep Linking:** A Barbearia do Zé divulga o link `app.toqe.com.br/barba-do-ze`. Ao abrir o aplicativo por esse link, o app identifica o parâmetro, busca o tema do Zé via API e **muda as cores e a logo do app inteiro**.
2. **Login Transparente:** Na tela (agora com tema do Zé), o cliente faz login com sua conta **Global** do Toqe. O sistema o vincula àquela barbearia via tabela `TQE_MEMBRO_BARBEARIA`.
3. **Sem Duplicação:** Se o mesmo cliente acessar o link de outra barbearia, ele não precisará criar uma conta nova, usa o mesmo login. O dono da barbearia se sente exclusivo (pois o app assumiu a marca dele para o cliente) e você mantém o banco de dados livre de contas duplicadas.

### O que muda na arquitetura (Temas)

```sql
CREATE TABLE TQE_TEMA_TENANT (
  TQE_TEM_CODIGO       SERIAL PRIMARY KEY,
  TQE_TEM_BAR_CODIGO   INT REFERENCES TQE_BARBEARIA UNIQUE,
  TQE_TEM_COR_PRIMARIA VARCHAR(7),   -- hex: #1A2B3C
  TQE_TEM_COR_FUNDO    VARCHAR(7),
  TQE_TEM_LOGO_URL     TEXT,
  TQE_TEM_SUBDOMINIO   VARCHAR(60)   -- barba-do-ze (para barba-do-ze.toqe.app)
);
```

### Next.js com múltiplos subdomínios

```typescript
// middleware.ts do Next.js — roda antes de qualquer página
export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  const subdomain = host?.split('.')[0]; // 'barba-do-ze'

  // Injeta o slug do tenant no header para os Server Components lerem
  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', subdomain ?? '');
  return response;
}
```

### App mobile com tema do tenant

O app busca o tema do tenant na abertura e armazena em cache local (AsyncStorage ou MMKV). Se o tenant mudar o tema, o app atualiza na próxima sessão.

```typescript
// ao abrir o app
const tema = await api.get(`/tenant/${barSlug}/tema`);
await MMKV.set('tema', JSON.stringify(tema));
```

---

## 17. Escalabilidade e Cloud

### O que não fazer hoje que vai travar depois

1. **Não salve estado em memória no NestJS** — sessions, cache local, qualquer coisa que não sobrevive a restart. JWT já resolve sessão. Cache vai pro Redis.
2. **Não faça upload de arquivos direto no container** — use S3 ou Google Cloud Storage desde o início. Container é efêmero.
3. **Não acople ao Docker Compose** — use variáveis de ambiente para tudo. Migrar para GCP Cloud Run depois é trocar o `docker-compose.yml` por um `cloudbuild.yaml`.
4. **Não use `localhost`** — use nomes de serviço do Docker (`postgres`, `redis`). Em cloud vira a URL do serviço gerenciado.

### Caminho de migração para Google Cloud

```
Hoje (VPS)                    →  Futuro (GCP)
─────────────────────────────────────────────
Docker container (api)        →  Cloud Run
Docker container (web)        →  Cloud Run
PostgreSQL container          →  Cloud SQL (PostgreSQL)
Redis container               →  Memorystore (Redis)
Nginx                         →  Cloud Load Balancing
Arquivos locais               →  Cloud Storage
docker-compose secrets        →  Secret Manager
```

A migração é incremental — começa pelo banco (menor risco de reescrita), depois os serviços.

### Separação futura de módulos

Quando o módulo de agendamento precisar escalar separado, a fronteira já está desenhada pelos módulos do NestJS. A transição é:
1. Extrai `apps/api/src/modules/agendamento/` para `apps/agendamento-service/`
2. Comunicação via mensageria (PubSub do GCP ou RabbitMQ) em vez de chamada direta
3. O resto do NestJS chama o serviço por HTTP ou mensagem

Não tente fazer isso antes de ter o problema de escala real.

---

## 18. Regras de Negócio Futuras

Estas questões ainda não foram modeladas e precisam ser respondidas antes de implementar cada feature:

### Comissões de barbeiro
- Comissão fixa por serviço ou % do valor cobrado?
- Comissão muda se o barbeiro tiver preço próprio (`TQE_BSV_PRECO_PROPRIO`)?
- Fechamento semanal ou mensal? Quem aprova?

### Pacotes de serviços
- Pacote mensal (ex: 4 cortes por R$120) — como controlar saldo de créditos?
- O pacote é por barbeiro específico ou qualquer barbeiro da casa?
- Validade do pacote?

### Caixa e fechamento diário
- O sistema controla pagamentos no balcão ou só registra que foi pago?
- Integração com maquininha (Stone, SumUp) — é obrigatório ou opcional?
- Fechamento de caixa gera relatório por barbeiro + por forma de pagamento?

### Múltiplas unidades
- Uma barbearia pode ter 2+ unidades — o dono vê tudo em um painel único?
- Barbeiro pode trabalhar em mais de uma unidade?
- Assinatura é por unidade ou por rede?

### Programa de fidelidade
- Pontos por agendamento ou por valor gasto?
- Resgate como desconto ou serviço gratuito?
- O programa é configurado por barbearia ou é padrão do Toqe?

### Estoque de insumos
- Controle de estoque é feature do plano basic ou pro?
- Baixa automática por agendamento (ex: corte consome X ml de pomada)?

---

## 19. Decisões Fechadas — Referência Rápida

| Decisão | Escolha | Não reabrir porque |
|---|---|---|
| Auth | JWT próprio no NestJS | Sem lock-in, controle total do payload |
| Auth storage web | Cookie httpOnly | XSS não acessa, CSRF mitigado com SameSite |
| Auth storage mobile | SecureStore (Expo) | AsyncStorage não é seguro para tokens |
| Frontend web | Next.js | Middleware auth nativo, BFF, ecossistema |
| Monorepo | Turborepo — 3 apps | Tipos compartilhados sem npm privado |
| ORM | Prisma | Type-safety, migrations, DX superior |
| Banco | PostgreSQL 16 | RLS nativo, TIMESTAMPTZ, maturidade |
| Container banco | Dedicado ao Toqe | Isolamento de recursos |
| Redis | Container na VPS | Necessário para BullMQ (notificações) |
| Fuso horário | UTC no banco | Imune a mudanças de timezone do servidor |
| Concorrência | FOR UPDATE SKIP LOCKED | Sem deadlock, falha rápida |
| Nomes de tabelas | Prefixo TQE_ + sigla | Rastreabilidade, sem colisão entre projetos |
| Bloqueios de agenda | Tabela separada TQE_BLOQUEIO_AGENDA | Semântica limpa, relatórios corretos |
| Multi-item no agendamento | Tabela TQE_AGENDAMENTO_ITEM | Suporta múltiplos serviços + snapshot de preço |
| Prisma + RLS | Interactive Transaction + set_config local | Sem vazamento de tenant entre conexões do pool |
| Infra | VPS Contabo + Docker Compose | Já em produção, custo baixo, migração incremental para GCP |
| Versionamento API | URI (/v1/, /v2/) | Simples, explícito, compatível com app mobile |
| CI/CD | GitHub Actions + paths-filter | Só rebuilda o que mudou |

---

> **Como usar este documento com o agente:**
> Cole o conteúdo completo no início da conversa como contexto.
> Diga ao agente: _"Este é o documento técnico do projeto Toqe. Todas as decisões marcadas como fechadas já foram tomadas. Me ajude com [tópico específico]."_
> Para implementação, comece sempre pela ordem do índice — Auth antes de Agenda, Agenda antes de Infra.
