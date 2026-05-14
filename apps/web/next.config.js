/* eslint-env node */
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-* necessário para Next.js
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.sentry.io",
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
  disableLogger: true,
  // Tunnel route opcional para contornar ad-blockers em produção:
  // tunnelRoute: "/monitoring",
});
