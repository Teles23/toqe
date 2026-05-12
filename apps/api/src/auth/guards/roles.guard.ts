import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    // super_admin bypassa todas as restrições
    if (user?.perfil === 'super_admin') return true;

    if (!requiredRoles.includes(user?.perfil)) {
      throw new ForbiddenException(
        `Acesso negado: perfil '${user?.perfil}' não tem permissão. Necessário: ${requiredRoles.join(' | ')}`,
      );
    }

    return true;
  }
}
