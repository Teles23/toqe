import { Module } from '@nestjs/common';
import { ConviteService } from './convite.service';
import { ConviteController } from './convite.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConviteController],
  providers: [ConviteService],
  exports: [ConviteService],
})
export class ConviteModule {}
