import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';

/**
 * Captura todas as exceções não tratadas e:
 * 1. Envia para o Sentry (se SENTRY_DSN configurado)
 * 2. Loga com contexto de tenant/usuário
 * 3. Retorna resposta HTTP padronizada
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const tenantId = req.headers['x-tenant-id'] ?? null;
    const userId = (req as any).user?.sub ?? null;

    // Só envia erros 5xx para o Sentry (4xx são erros do cliente)
    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('tenantId', String(tenantId));
        scope.setTag('userId', String(userId));
        scope.setContext('request', {
          method: req.method,
          url: req.url,
          tenantId,
          userId,
        });
        Sentry.captureException(exception);
      });

      this.logger.error(
        { tenantId, userId, url: req.url, method: req.method },
        exception instanceof Error ? exception.message : String(exception),
      );
    }

    const message = isHttp
      ? (exception.getResponse() as any)?.message ?? exception.message
      : 'Erro interno do servidor';

    res.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
