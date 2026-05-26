const nodeExternals = require('webpack-node-externals');

/**
 * Customização do webpack do NestJS.
 *
 * Decisões:
 *
 * 1. **Externalizar `@prisma/*` e `prisma`**: a engine do Prisma
 *    carrega binários nativos em runtime — não pode ser bundle-ada.
 *
 * 2. **Bundle-ar packages workspace `@toqe/*`**: por padrão,
 *    `webpack-node-externals` externaliza tudo em `node_modules` (e
 *    packages pnpm acabam lá via symlink). Como nossos packages
 *    internos são TypeScript puro sem build próprio
 *    (`main: "./src/index.ts"`), externalizá-los faz Node tentar
 *    carregar `.ts` em runtime e falhar com `ERR_MODULE_NOT_FOUND` /
 *    `ERR_UNSUPPORTED_DIR_IMPORT`. Bundle-ar via ts-loader resolve.
 *
 * Substituímos completamente o `externals` que o `nest-cli` passa em
 * `options.externals` para garantir comportamento previsível.
 */
module.exports = function (options) {
  return {
    ...options,
    // Cache de filesystem: persiste módulos compilados em disco entre cold
    // starts. Não altera o bundling — só evita recompilar tudo do zero a
    // cada `pnpm dev`. Invalida automaticamente quando este config muda.
    cache: {
      type: 'filesystem',
      buildDependencies: { config: [__filename] },
    },
    externals: [
      // Prisma: externalizar com schema "commonjs <pkg>" para `require`.
      function ({ request }, callback) {
        if (!request) return callback();
        if (/^@prisma\//.test(request) || request === 'prisma') {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
      // Demais pacotes node_modules: externalizar, EXCETO @toqe/*
      // (que devem ser bundle-ados).
      nodeExternals({
        allowlist: [/^@toqe\//],
      }),
    ],
  };
};
