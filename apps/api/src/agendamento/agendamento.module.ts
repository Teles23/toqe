import { Module } from '@nestjs/common';
import { AgendamentoService } from './agendamento.service';
import { AgendamentoController } from './agendamento.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import { AgendaModule } from '../agenda/agenda.module';

@Module({
  imports: [PrismaModule, NotificacaoModule, AgendaModule],
  controllers: [AgendamentoController],
  providers: [AgendamentoService],
  exports: [AgendamentoService],
})
export class AgendamentoModule {}
