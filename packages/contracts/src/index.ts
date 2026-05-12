// @toqe/contracts — schemas Zod, tipos e erros compartilhados entre apps.
// Backend (NestJS) usa via `nestjs-zod` para gerar DTOs + Swagger.
// Frontend (Next.js / Expo) usa em forms (react-hook-form) e clients HTTP.
//
// Nota: o consumo é via bundlers (Next/webpack-do-Nest) que resolvem
// barrels diretório automaticamente. O webpack do `apps/api` está
// configurado em `apps/api/webpack.config.js` para bundle-ar @toqe/*
// (NÃO externalizar), pois esses packages são TS puro sem build próprio.

export * from "./schemas";
export * from "./types";
export * from "./errors";
