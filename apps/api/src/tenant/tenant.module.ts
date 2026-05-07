import { Module, Global } from '@nestjs/common';
import { TenantContextService } from './tenant-context/tenant-context.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantInterceptor } from './tenant/tenant.interceptor';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [TenantContextService, TenantInterceptor],
  exports: [TenantContextService, TenantInterceptor],
})
export class TenantModule {}
