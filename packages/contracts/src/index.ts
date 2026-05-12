// @toqe/contracts — schemas Zod, tipos e erros compartilhados entre apps.
// Backend (NestJS) usa via `nestjs-zod` para gerar DTOs + Swagger.
// Frontend (Next.js / Expo) usa em forms (react-hook-form) e clients HTTP.

export * from "./schemas";
export * from "./types";
export * from "./errors";
