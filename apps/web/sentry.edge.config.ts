/**
 * Sentry — inicialização do runtime Edge (proxy/middleware).
 * Carregado via `instrumentation.ts` (Next 16 convention).
 *
 * No-op se `NEXT_PUBLIC_SENTRY_DSN` não estiver definido.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  });
}
