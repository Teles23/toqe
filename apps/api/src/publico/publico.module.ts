import { Module } from '@nestjs/common';
import { PublicoController } from './publico.controller';
import { PublicoService } from './publico.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BarbeariaModule } from '../barbearia/barbearia.module';
import { ServicoModule } from '../servico/servico.module';
import { AgendaModule } from '../agenda/agenda.module';
import { AgendamentoModule } from '../agendamento/agendamento.module';

@Module({
  imports: [
    PrismaModule,
    BarbeariaModule,
    ServicoModule,
    AgendaModule,
    AgendamentoModule,
  ],
  controllers: [PublicoController],
  providers: [PublicoService],
})
export class PublicoModule {}
