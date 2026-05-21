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

    if (!user) return true; // rota pública sem JwtAuthGuard

    // Aceita apenas params de URL ou header x-tenant-id.
    // body.barCodigo removido: evita parameter-tampering onde um atacante
    // injeta "barCodigo" no body para contornar a validação de membership.
    const barCodigo =
      request.params['barCodigo'] ??
      (request.headers['x-tenant-id'] as string | undefined);

    if (!barCodigo) return true; // rota global, sem tenant (ex: /usuarios/me)

    const barCodigoNum = Number(barCodigo);
    // barCodigo inválido ou <= 0 não é permitido — lança 403 em vez de ignorar
    if (isNaN(barCodigoNum) || barCodigoNum <= 0) {
      throw new ForbiddenException('Tenant inválido');
    }

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
