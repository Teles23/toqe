import { Module } from '@nestjs/common';
import { ConviteService } from './convite.service';
import { ConviteController } from './convite.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ConviteController],
  providers: [ConviteService],
  exports: [ConviteService],
})
export class ConviteModule {}
