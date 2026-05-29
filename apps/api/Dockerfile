FROM node:26-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ---- Builder ----
FROM base AS builder
WORKDIR /app

# Copia apenas os manifests para aproveitar cache do layer de instalação.
# O pnpm install só é reexecutado quando package.json ou lockfile mudam.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json         ./apps/api/
COPY apps/web/package.json         ./apps/web/
COPY apps/mobile/package.json      ./apps/mobile/
COPY packages/config/package.json          ./packages/config/
COPY packages/shared/package.json          ./packages/shared/
COPY packages/contracts/package.json       ./packages/contracts/
COPY packages/eslint-config/package.json   ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Copia o source após o install para não invalidar o cache acima
COPY . .

# prisma generate não conecta ao banco — URL placeholder só para parsear o schema
RUN DATABASE_URL="postgresql://build:build@localhost/build" pnpm --filter api exec prisma generate --schema=./prisma/schema.prisma

RUN pnpm --filter api run build

# Isola somente as dependências de produção da API
RUN pnpm deploy --filter api --prod /prod/api

# ---- Runner ----
FROM node:26-alpine AS runner

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

COPY --from=builder /prod/api/node_modules                    ./node_modules
COPY --from=builder /app/apps/api/dist                        ./dist
COPY --from=builder /app/apps/api/package.json                ./package.json
COPY --from=builder /app/apps/api/src/generated/prisma        ./src/generated/prisma
COPY --from=builder /app/apps/api/prisma/schema.prisma        ./prisma/schema.prisma
COPY --from=builder /app/apps/api/prisma/migrations           ./prisma/migrations
COPY --from=builder /app/apps/api/prisma                      ./prisma
COPY --from=builder /app/apps/api/prisma.config.docker.js     ./prisma.config.js

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/ready || exit 1

# Sequência de boot:
# 1. migrate deploy — aplica migrations pendentes (idempotente, seguro a cada startup)
# 2. seed-estrutural.js — upsert apenas dos planos (dados obrigatórios, sem dados demo)
# 3. node dist/main.js — inicia a API
#
# ATENÇÃO: seed-runner.js NÃO deve rodar em produção — contém usuários e barbearia
# fictícios de demonstração (thiago@email.com/senha123) que são um backdoor de segurança.
# Para popular dados de demo em ambiente de desenvolvimento, execute seed-runner.js manualmente.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --config ./prisma.config.js && node prisma/seed-estrutural.js && node dist/main.js"]
