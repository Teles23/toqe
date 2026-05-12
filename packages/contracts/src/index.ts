// @toqe/contracts — schemas Zod, tipos e erros compartilhados entre apps.
// Backend (NestJS) usa via `nestjs-zod` para gerar DTOs + Swagger.
// Frontend (Next.js / Expo) usa em forms (react-hook-form) e clients HTTP.
//
// IMPORTANTE: usar caminhos explícitos para `index` em vez de
// `./schemas` etc., pois o Node em modo ESM não resolve "directory
// imports" automaticamente (ERR_UNSUPPORTED_DIR_IMPORT). O TypeScript
// resolve, mas o runtime NestJS (que usa webpack/CommonJS-style mas
// preserva ESM em alguns deps) falha sem o sufixo.

export * from "./schemas/index";
export * from "./types/index";
export * from "./errors/index";
