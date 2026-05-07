import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { UsuarioModule } from './usuario/usuario.module';
import { BarbeariaModule } from './barbearia/barbearia.module';
import { ServicoModule } from './servico/servico.module';
import { AgendaModule } from './agenda/agenda.module';
import { AgendamentoModule } from './agendamento/agendamento.module';

@Module({
  imports: [PrismaModule, TenantModule, AuthModule, UsuarioModule, BarbeariaModule, ServicoModule, AgendaModule, AgendamentoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
