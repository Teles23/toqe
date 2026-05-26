import { Module } from '@nestjs/common';
import { LembreteService } from './lembrete.service';
import { PushTokenModule } from '../push-token/push-token.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';

@Module({
  imports: [PushTokenModule, NotificacaoModule],
  providers: [LembreteService],
})
export class LembreteModule {}
