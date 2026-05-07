import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificacaoService } from './notificacao.service';
import { NotificacaoProducer, NOTIFICACAO_QUEUE } from './notificacao.producer';
import { NotificacaoConsumer } from './notificacao.consumer';
import { PreferenciasService } from './preferencias.service';
import { PreferenciasController } from './preferencias.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: NOTIFICACAO_QUEUE }),
  ],
  controllers: [PreferenciasController],
  providers: [NotificacaoService, NotificacaoProducer, NotificacaoConsumer, PreferenciasService],
  exports: [NotificacaoProducer],
})
export class NotificacaoModule {}
