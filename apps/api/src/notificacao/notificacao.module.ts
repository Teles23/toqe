import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificacaoService } from './notificacao.service';
import { NotificacaoProducer, NOTIFICACAO_QUEUE } from './notificacao.producer';
import { NotificacaoConsumer } from './notificacao.consumer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICACAO_QUEUE,
    }),
  ],
  providers: [NotificacaoService, NotificacaoProducer, NotificacaoConsumer],
  exports: [NotificacaoProducer],
})
export class NotificacaoModule {}
