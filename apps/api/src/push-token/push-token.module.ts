import { Module } from '@nestjs/common';
import { PushTokenController } from './push-token.controller';
import { PushTokenService } from './push-token.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PushTokenController],
  providers: [PushTokenService],
  exports: [PushTokenService],
})
export class PushTokenModule {}
