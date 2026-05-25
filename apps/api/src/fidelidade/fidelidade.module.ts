import { Module } from '@nestjs/common';
import { FidelidadeService } from './fidelidade.service';
import { FidelidadeController } from './fidelidade.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FidelidadeController],
  providers: [FidelidadeService],
  exports: [FidelidadeService],
})
export class FidelidadeModule {}
