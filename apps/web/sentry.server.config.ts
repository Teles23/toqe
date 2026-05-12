/**
 * Sentry — inicialização do runtime Node.js (server components + route handlers).
 * Carregado via `instrumentation.ts` (Next 16 convention).
 *
 * No-op se `NEXT_PUBLIC_SENTRY_DSN` não estiver definido — evita ruído em
 * dev local e em ambientes onde o Sentry não está configurado.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
    // Em dev local, ainda enviamos para o Sentry para validar a instrumentação,
    // mas com sampling reduzido — desligue setando NEXT_PUBLIC_APP_ENV=development
    // junto com tracesSampleRate=0 em produção se necessário.
  });
}
