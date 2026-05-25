import { Module } from '@nestjs/common';
import { ContatoService } from './contato.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ContatoService],
  exports: [ContatoService],
})
export class ContatoModule {}
