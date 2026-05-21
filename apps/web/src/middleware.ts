/**
 * Next.js middleware entry point.
 *
 * Next.js exige que o arquivo se chame `middleware.ts` (ou `.js`) e
 * esteja em `src/` (ou na raiz do projeto). Re-exporta a função `proxy`
 * e a configuração `config` de `proxy.ts`, que contém a lógica real.
 *
 * @see src/proxy.ts
 */
export { proxy as middleware, config } from "./proxy";
