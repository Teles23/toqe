/**
 * Sentry — inicialização client-side (browser).
 *
 * Next.js 16 carrega este arquivo automaticamente no boot do client
 * runtime (substitui o `sentry.client.config.ts` das versões antigas).
 *
 * No-op se `NEXT_PUBLIC_SENTRY_DSN` não estiver definido — evita
 * envio de eventos quando o Sentry não está configurado.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    // Defaults conservadores: sem replay em sessões normais, replay
    // só em sessões com erro. Ajuste conforme a estratégia de uso.
  });
}

// Necessário para router transitions instrumentadas no App Router (Next 15+).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
