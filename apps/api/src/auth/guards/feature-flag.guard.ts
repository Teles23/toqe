import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { FEATURE_KEY } from '../decorators/feature.decorator';
import type { TenantRequest } from '../../common/types/jwt-request';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!feature) return true;

    const req = context.switchToHttp().getRequest<TenantRequest>();
    const barCodigo = Number(req.headers['x-tenant-id']);

    if (!barCodigo) return true;

    const barbearia = await this.prisma.barbearia.findUnique({
      where: { codigo: barCodigo },
      select: { plano: true, planoStatus: true, bloqueadaEm: true },
    });

    if (!barbearia) throw new NotFoundException('Barbearia não encontrada');

    if (barbearia.planoStatus !== 'ativo') {
      throw new ForbiddenException(
        `Barbearia com plano ${barbearia.planoStatus}. Regularize para acessar esta funcionalidade.`,
      );
    }

    const planoLimite = await this.prisma.planoLimite.findUnique({
      where: { plano: barbearia.plano },
    });

    if (!planoLimite) {
      throw new ForbiddenException(
        `Plano '${barbearia.plano}' não reconhecido`,
      );
    }

    const temAcesso = planoLimite[feature as keyof typeof planoLimite];

    if (!temAcesso) {
      throw new ForbiddenException(
        `Funcionalidade '${feature}' não disponível no plano '${barbearia.plano}'`,
      );
    }

    return true;
  }
}
