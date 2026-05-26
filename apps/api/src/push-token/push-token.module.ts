import { Module } from '@nestjs/common';
import { PushTokenController } from './push-token.controller';
import { PushTokenService } from './push-token.service';
import { PushNotificationService } from './push-notification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PushTokenController],
  providers: [PushTokenService, PushNotificationService],
  exports: [PushTokenService, PushNotificationService],
})
export class PushTokenModule {}
