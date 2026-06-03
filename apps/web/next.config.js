/* eslint-env node */
import path from "node:path";
import fs from "node:fs";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

// Lê DEV_HOST_IP direto do .env.local porque next.config.js é avaliado
// antes do Next.js injetar as env vars — process.env não tem o valor ainda.
function readDevHostIP() {
  try {
    const envLocal = fs.readFileSync(
      new URL(".env.local", import.meta.url),
      "utf8",
    );
    return envLocal.match(/^DEV_HOST_IP=(.+)$/m)?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}
const devHostIP = readDevHostIP();

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Extrai a origem da API (ex: "http://localhost:3000") a partir da env var,
// para adicionar à CSP sem hardcodar localhost. Funciona em dev e prod.
const apiOrigin = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : "";

// Origens externas necessárias para o Google Identity Services (GIS) usado
// pelo `@react-oauth/google` no LoginForm:
//   - script `gsi/client` é servido por `https://accounts.google.com`
//   - botão renderizado em iframe vindo de `https://accounts.google.com`
//   - avatares do usuário (após login) vivem em `*.googleusercontent.com`
//   - One Tap pode chamar `oauth2.googleapis.com` no token exchange
// Concentrados aqui para que o restante do CSP fique legível.
const GOOGLE_AUTH_ORIGINS = [
  "https://accounts.google.com",
  "https://oauth2.googleapis.com",
];

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // unsafe-* necessário para Next.js. Google Identity Services adiciona
      // accounts.google.com (script gsi/client + fallback script-src-elem).
      `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${GOOGLE_AUTH_ORIGINS.join(" ")} https://static.cloudflareinsights.com`,
      // script-src-elem explícito — alguns browsers exigem para o <script>
      // injetado dinamicamente pelo @react-oauth/google.
      `script-src-elem 'self' 'unsafe-inline' ${GOOGLE_AUTH_ORIGINS.join(" ")} https://static.cloudflareinsights.com`,
      `style-src 'self' 'unsafe-inline' ${GOOGLE_AUTH_ORIGINS.join(" ")}`,
      // Avatares Google do usuário logado.
      `img-src 'self' data: blob: ${apiOrigin} https://*.googleusercontent.com https://accounts.google.com https://api.qrserver.com`,
      "font-src 'self'",
      // apiOrigin cobre a URL da API (dev: localhost:3000, prod: domínio real)
      // ws://* wss://* necessários para o HMR do Next.js em dev
      `connect-src 'self' ${apiOrigin} https://toqe.duckdns.org ws: wss: https://*.sentry.io https://nominatim.openstreetmap.org ${GOOGLE_AUTH_ORIGINS.join(" ")} https://cloudflareinsights.com`,
      // O botão GIS é renderizado num iframe servido por accounts.google.com
      `frame-src 'self' ${GOOGLE_AUTH_ORIGINS.join(" ")}`,
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    root: path.resolve("../.."),
  },
  // Permite acesso aos recursos de dev (HMR, _next/webpack-hmr) a partir
  // de outros hosts da LAN. Em prod isso e ignorado.
  // DEV_HOST_IP é injetado automaticamente pelo scripts/detect-ip.js via
  // apps/web/.env.local — contém o IP LAN real do host Windows.
  allowedDevOrigins: [devHostIP, "172.31.160.1"].filter(Boolean),
  experimental: {
    // Tree-shake granular de pacotes "barrel-heavy" — Next reescreve
    // `import { Foo } from "lucide-react"` em import direto do submodulo
    // (`lucide-react/dist/esm/icons/foo`). Reduz tempo de compile no
    // dev e tamanho do bundle prod. Doc:
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "date-fns",
      "@tanstack/react-query",
      "@tanstack/react-query-devtools",
      // Radix — lista os usados de fato no app (mais 30+ disponiveis
      // poderiam estar aqui, mas adicionar individualmente da mais
      // controle sobre o que e "tree-shake-able").
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
    ],
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
// Pipeline: nextConfig -> withBundleAnalyzer (opt-in via env ANALYZE=true)
// -> withSentryConfig (sempre). A ordem importa: o analyzer precisa "ver"
// o config base; o Sentry envolve por ultimo aplicando webpack plugins
// e a instrumentação.
export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  silent: !process.env.CI,
  // Adicionar quando o projeto Sentry estiver provisionado:
  // org: process.env.SENTRY_ORG,
  // project: process.env.SENTRY_PROJECT,
  // authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Substitui o antigo `disableLogger: true` (deprecado a partir do
  // @sentry/nextjs v9). Remove `console.log` de debug do SDK no bundle
  // de produção via tree-shaking.
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
  // Tunnel route opcional para contornar ad-blockers em produção:
  // tunnelRoute: "/monitoring",
});
