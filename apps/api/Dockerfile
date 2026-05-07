FROM node:20-alpine AS base
RUN npm i -g pnpm

# ---- Builder ----
FROM base AS builder
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile

RUN pnpm --filter api exec prisma generate --schema=./prisma/schema.prisma

RUN pnpm --filter api run build

# Isola somente as dependências de produção da API
RUN pnpm deploy --filter api --prod /prod/api

# ---- Runner ----
FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

COPY --from=builder /prod/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist       ./dist
COPY --from=builder /app/apps/api/package.json ./package.json

USER nestjs

EXPOSE 3000

# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#   CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
