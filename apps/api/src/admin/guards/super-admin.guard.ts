import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { TenantRequest } from '../../common/types/jwt-request';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<TenantRequest>();

    if (!user?.superAdmin) {
      throw new ForbiddenException(
        'Acesso restrito ao Super Admin da plataforma.',
      );
    }

    return true;
  }
}
