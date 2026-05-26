import { Injectable, Logger } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';
import { PushTokenService } from './push-token.service';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly expo = new Expo();

  constructor(private readonly pushTokenService: PushTokenService) {}

  async send(
    usrCodigo: number,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const tokens = await this.pushTokenService.findByUser(usrCodigo);
    const valid = tokens.filter((t) => Expo.isExpoPushToken(t));
    if (!valid.length) return;

    const chunks = this.expo.chunkPushNotifications(
      valid.map((to) => ({ to, title, body, data })),
    );
    for (const chunk of chunks) {
      try {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk);
        this.logger.log(
          `Push enviado para usrCodigo=${usrCodigo}: ${receipts.length} notificações`,
        );
      } catch (err) {
        this.logger.warn(
          `Falha ao enviar push para usrCodigo=${usrCodigo}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
