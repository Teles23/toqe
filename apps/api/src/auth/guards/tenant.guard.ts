import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // injetado pelo JwtAuthGuard — tem apenas 'sub'

    const barCodigo =
      request.params.barCodigo ??
      request.body.barCodigo ??
      request.headers['x-tenant-id'];

    if (!barCodigo) return true; // rota global, sem tenant

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

    // Injeta o perfil local no request para uso no RolesGuard
    request.user.perfil = membro.perfil;
    request.user.barCodigo = membro.barCodigo;

    return true;
  }
}
