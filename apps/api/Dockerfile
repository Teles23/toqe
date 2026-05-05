FROM node:20-alpine AS base
RUN npm i -g pnpm

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm run build --filter api

FROM base AS runner
WORKDIR /app
COPY --from=builder /app .
WORKDIR /app/apps/api
CMD ["pnpm", "start:prod"]
