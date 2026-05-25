import { Module } from '@nestjs/common';
import { ApiPublicaService } from './api-publica.service';
import { ApiPublicaController } from './api-publica.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicoModule } from '../servico/servico.module';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Module({
  imports: [PrismaModule, ServicoModule],
  controllers: [ApiPublicaController],
  providers: [ApiPublicaService, ApiKeyGuard],
})
export class ApiPublicaModule {}
