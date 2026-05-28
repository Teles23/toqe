import { Module } from '@nestjs/common';
import { BarbeariaService } from './barbearia.service';
import { MembroBarbeariaService } from './membro-barbearia.service';
import { TemaTenantService } from './tema-tenant.service';
import { BarbeariaController } from './barbearia.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FeatureFlagGuard } from '../auth/guards/feature-flag.guard';
import { ConviteModule } from '../convite/convite.module';

@Module({
  imports: [PrismaModule, ConviteModule],
  controllers: [BarbeariaController],
  providers: [
    BarbeariaService,
    MembroBarbeariaService,
    TemaTenantService,
    FeatureFlagGuard,
  ],
  exports: [BarbeariaService, MembroBarbeariaService, TemaTenantService],
})
export class BarbeariaModule {}
