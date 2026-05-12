/**
 * Next.js 16 instrumentation hook.
 *
 * Carrega o config de Sentry apropriado para cada runtime
 * (Node.js para SSR/route-handlers, Edge para proxy/middleware).
 *
 * Veja:
 * - https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * - https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
