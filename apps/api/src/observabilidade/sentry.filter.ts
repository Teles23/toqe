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
    const userId =
      (req as Request & { user?: { sub: number } }).user?.sub ?? null;

    // Trata erros conhecidos do Prisma para evitar o crash do formatter interno (bug do t=Object.create)
    let errorMessage =
      exception instanceof Error
        ? exception.message
        : 'Erro interno do servidor';

    if (exception && typeof exception === 'object' && 'code' in exception) {
      const prismaError = exception as {
        code: string;
        meta?: Record<string, unknown>;
      };
      if (prismaError.code === 'P2002') {
        errorMessage = `Conflito: Um registro com este ${Object.keys(prismaError.meta?.target || {}).join(', ') || 'campo'} já existe.`;
      }
    }

    if (status >= 500) {
      this.logger.error(
        {
          tenantId,
          userId,
          method: req.method,
          url: req.url,
          // Não logamos o stack trace completo se for erro do Prisma que causa crash no dump
          err: exception instanceof Error ? exception.name : String(exception),
          code: (exception as { code?: string })?.code,
        },
        errorMessage,
      );
    }

    const message = isHttp
      ? ((exception.getResponse() as { message?: string })?.message ??
        exception.message)
      : status >= 500
        ? 'Erro interno do servidor'
        : errorMessage;

    res.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
