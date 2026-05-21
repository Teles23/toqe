import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { TenantRequest } from '../../common/types/jwt-request';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<TenantRequest>();

    // Super admin opera exclusivamente via /admin/*  (SuperAdminGuard).
    // Não bypassa rotas normais — princípio do menor privilégio.
    if (!user?.perfil || !requiredRoles.includes(user.perfil)) {
      throw new ForbiddenException(
        `Acesso negado: perfil '${user?.perfil}' não tem permissão. Necessário: ${requiredRoles.join(' | ')}`,
      );
    }

    return true;
  }
}
