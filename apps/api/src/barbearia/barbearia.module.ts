import { Module } from '@nestjs/common';
import { BarbeariaService } from './barbearia.service';
import { BarbeariaController } from './barbearia.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FeatureFlagGuard } from '../auth/guards/feature-flag.guard';

@Module({
  imports: [PrismaModule],
  controllers: [BarbeariaController],
  providers: [BarbeariaService, FeatureFlagGuard],
  exports: [BarbeariaService],
})
export class BarbeariaModule {}
