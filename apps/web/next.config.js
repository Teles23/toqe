/* eslint-env node */
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve("../.."),
  },
};

/**
 * `withSentryConfig` envolve a config do Next:
 *  - aplica plugins de webpack/turbopack para Sentry;
 *  - habilita o hook `instrumentation.ts` / `instrumentation-client.ts`.
 *
 * O upload de source maps requer `SENTRY_AUTH_TOKEN` + `org`/`project`
 * — habilitar via env var no CI quando o projeto Sentry estiver
 * provisionado. Sem essas variáveis, o runtime SDK continua funcional.
 */
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  // Adicionar quando o projeto Sentry estiver provisionado:
  // org: process.env.SENTRY_ORG,
  // project: process.env.SENTRY_PROJECT,
  // authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  disableLogger: true,
  // Tunnel route opcional para contornar ad-blockers em produção:
  // tunnelRoute: "/monitoring",
});
