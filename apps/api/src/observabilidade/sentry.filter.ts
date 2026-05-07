import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global de exceções:
 * - Loga erros 5xx com contexto de tenant/usuário (via Pino)
 * - Retorna resposta HTTP padronizada para todos os erros
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

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

    if (status >= 500) {
      this.logger.error(
        {
          tenantId,
          userId,
          method: req.method,
          url: req.url,
          err: exception instanceof Error ? exception.stack : String(exception),
        },
        exception instanceof Error ? exception.message : 'Erro interno do servidor',
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
