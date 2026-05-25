import { Module } from '@nestjs/common';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoController } from './agendamento.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { AgendaModule } from '../agenda/agenda.module';
import { FidelidadeModule } from '../fidelidade/fidelidade.module';

@Module({
  imports: [PrismaModule, NotificacaoModule, AgendaModule, FidelidadeModule],
  controllers: [AgendamentoController],
  providers: [AgendamentoService],
})
export class AgendamentoModule {}
