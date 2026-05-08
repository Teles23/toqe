/**
 * Next.js 16 middleware entry point.
 * A lógica está em proxy.ts — aqui apenas re-exportamos com o nome esperado.
 */
export { proxy as middleware, config } from './proxy';
