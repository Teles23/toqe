/**
 * Acesso tipado a variáveis de ambiente públicas (expostas no cliente via
 * `NEXT_PUBLIC_*`). Cresce conforme novas integrações forem adicionadas.
 *
 * Para variáveis server-only, criar arquivo separado (`server-env.ts`) que
 * lance erro se importado fora de um Route Handler ou Server Component.
 */
export const ENV = {
  /** URL base da API NestJS. Default aponta para o dev local via BFF. */
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? "/api/v1",
  /** DSN do Sentry (frontend) — opcional. */
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
  /** Ambiente em que o app está rodando. */
  APP_ENV:
    (process.env.NEXT_PUBLIC_APP_ENV as
      | "development"
      | "staging"
      | "production"
      | undefined) ?? "development",
} as const;
