import { Module } from '@nestjs/common';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoController } from './agendamento.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { AgendaModule } from '../agenda/agenda.module';
import { BarbeariaModule } from '../barbearia/barbearia.module';
import { ContatoModule } from '../contato/contato.module';
import { FidelidadeModule } from '../fidelidade/fidelidade.module';

@Module({
  imports: [
    PrismaModule,
    NotificacaoModule,
    AgendaModule,
    BarbeariaModule,
    ContatoModule,
    FidelidadeModule,
  ],
  controllers: [AgendamentoController],
  providers: [AgendamentoService],
  exports: [AgendamentoService],
})
export class AgendamentoModule {}
