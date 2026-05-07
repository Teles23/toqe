FROM node:20-alpine AS base
RUN npm i -g pnpm

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install

# Gera o Prisma Client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build da API
RUN pnpm run build --filter api

FROM base AS runner
WORKDIR /app

# Copia apenas o necessário (opcional, para simplificar vamos copiar tudo por enquanto mas garantindo o dist)
COPY --from=builder /app .

EXPOSE 3000

WORKDIR /app/apps/api
# Garante que o Prisma Client gerado esteja disponível no runner
RUN npx prisma generate --schema=prisma/schema.prisma

CMD ["pnpm", "start:prod"]
