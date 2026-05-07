import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { UsuarioModule } from './usuario/usuario.module';
import { BarbeariaModule } from './barbearia/barbearia.module';
import { ServicoModule } from './servico/servico.module';
import { AgendaModule } from './agenda/agenda.module';
import { AgendamentoModule } from './agendamento/agendamento.module';
import { NotificacaoModule } from './notificacao/notificacao.module';
import { ObservabilidadeModule } from './observabilidade/observabilidade.module';

@Module({
  imports: [
    ObservabilidadeModule, // primeiro — garante que o logger está pronto para os outros módulos
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    PrismaModule,
    TenantModule,
    AuthModule,
    UsuarioModule,
    BarbeariaModule,
    ServicoModule,
    AgendaModule,
    AgendamentoModule,
    NotificacaoModule,
    ObservabilidadeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
