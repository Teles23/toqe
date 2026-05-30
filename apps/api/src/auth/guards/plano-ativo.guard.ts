import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { SKIP_PLANO_CHECK_KEY } from '../decorators/skip-plano-check.decorator';
import type { TenantRequest } from '../../common/types/jwt-request';

const STATUS_LIVRES = new Set(['ativo', 'trial']);

@Injectable()
export class PlanoAtivoGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_PLANO_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return true;

    const req = context.switchToHttp().getRequest<TenantRequest>();
    const barCodigo = Number(
      req.headers['x-tenant-id'] ?? req.params?.['barCodigo'],
    );
    if (!barCodigo) return true;

    const barbearia = await this.prisma.barbearia.findUnique({
      where: { codigo: barCodigo },
      select: { planoStatus: true },
    });
    if (!barbearia) return true;

    if (!STATUS_LIVRES.has(barbearia.planoStatus)) {
      throw new ForbiddenException(
        `Acesso suspenso. Plano: ${barbearia.planoStatus}. Regularize sua assinatura em Configurações → Plano.`,
      );
    }
    return true;
  }
}
