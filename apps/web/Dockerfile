FROM node:20-alpine AS base
RUN npm i -g pnpm

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm run build --filter web

FROM base AS runner
WORKDIR /app
COPY --from=builder /app .
WORKDIR /app/apps/web
EXPOSE 3001
CMD ["pnpm", "start", "-p", "3001"]
