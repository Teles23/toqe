/* eslint-env node */
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve("../.."),
  },
  // Permite acesso aos recursos de dev (HMR, _next/webpack-hmr) a partir
  // de outros hosts da LAN. Em prod isso e ignorado. Lista permite tanto
  // o IP do Wi-Fi do host quanto o IP da bridge Hyper-V/WSL — adicione
  // outros conforme necessario.
  allowedDevOrigins: [
    "192.168.0.134",
    "172.31.160.54",
    // Wildcards LAN privada — descomente se mudar de rede frequentemente:
    // "192.168.0.*",
    // "10.*",
  ],
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
