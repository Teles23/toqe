import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { TenantRequest } from '../../common/types/jwt-request';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;

    const barCodigo =
      request.params['barCodigo'] ??
      (request.body['barCodigo'] as string | undefined) ??
      (request.headers['x-tenant-id'] as string | undefined);

    if (!barCodigo) return true; // rota global, sem tenant

    const barCodigoNum = Number(barCodigo);
    if (isNaN(barCodigoNum) || barCodigoNum === 0) return true; // valor inválido, deixa passar para o controller tratar

    const membro = await this.prisma.membroBarbearia.findFirst({
      where: {
        usrCodigo: user.sub,
        barCodigo: Number(barCodigo),
      },
    });

    if (!membro) {
      throw new ForbiddenException(
        'Acesso negado: você não é membro desta barbearia',
      );
    }

    request.user.perfil = membro.perfil;
    request.user.barCodigo = membro.barCodigo;

    return true;
  }
}
