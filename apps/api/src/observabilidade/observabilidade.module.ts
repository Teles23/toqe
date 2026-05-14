import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { Request } from 'express';

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        // Em dev usa pretty-print colorido; em prod emite JSON puro
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: true },
              }
            : undefined,

        level: process.env.LOG_LEVEL ?? 'info',

        // Campos base presentes em todo log de request
        customProps: (req: Request & { user?: { sub: number } }) => ({
          tenantId: req.headers['x-tenant-id'] ?? null,
          userId: req.user?.sub ?? null,
        }),

        // Não logar a rota de health (muito ruído)
        autoLogging: {
          ignore: (req: Request) => req.url?.includes('/health') ?? false,
        },

        // Serialização segura: nunca vazar senha/token nos logs
        serializers: {
          req(req: { method: string; url: string; remoteAddress: string }) {
            return {
              method: req.method,
              url: req.url,
              remoteAddress: req.remoteAddress,
            };
          },
          res(res: { statusCode: number }) {
            return { statusCode: res.statusCode };
          },
        },
      },
    }),
  ],
})
export class ObservabilidadeModule {}
