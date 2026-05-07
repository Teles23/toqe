import { Module } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { AgendaGateway } from './agenda.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgendaController],
  providers: [AgendaService, AgendaGateway],
  exports: [AgendaService, AgendaGateway],
})
export class AgendaModule {}
