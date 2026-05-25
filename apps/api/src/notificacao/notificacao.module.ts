import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificacaoService } from './notificacao.service';
import { NotificacaoProducer, NOTIFICACAO_QUEUE } from './notificacao.producer';
import { NotificacaoConsumer } from './notificacao.consumer';
import { PreferenciasService } from './preferencias.service';
import { PreferenciasController } from './preferencias.controller';
import { PushTokenModule } from '../push-token/push-token.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: NOTIFICACAO_QUEUE }),
    PushTokenModule,
  ],
  controllers: [PreferenciasController],
  providers: [
    NotificacaoService,
    NotificacaoProducer,
    NotificacaoConsumer,
    PreferenciasService,
  ],
  exports: [NotificacaoProducer, NotificacaoService],
})
export class NotificacaoModule {}
