import { Module } from '@nestjs/common';
import { ClienteNotaService } from './cliente-nota.service';
import { ClienteNotaController } from './cliente-nota.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClienteNotaController],
  providers: [ClienteNotaService],
})
export class ClienteNotaModule {}
