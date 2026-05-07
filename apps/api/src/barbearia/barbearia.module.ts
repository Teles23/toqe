import { Module } from '@nestjs/common';
import { BarbeariaService } from './barbearia.service';
import { BarbeariaController } from './barbearia.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BarbeariaController],
  providers: [BarbeariaService],
  exports: [BarbeariaService],
})
export class BarbeariaModule {}
