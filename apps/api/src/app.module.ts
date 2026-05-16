import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { UsuarioModule } from './usuario/usuario.module';
import { BarbeariaModule } from './barbearia/barbearia.module';
import { ServicoModule } from './servico/servico.module';
import { AgendaModule } from './agenda/agenda.module';
import { AgendamentoModule } from './agendamento/agendamento.module';
import { NotificacaoModule } from './notificacao/notificacao.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RelatorioModule } from './relatorio/relatorio.module';
import { ObservabilidadeModule } from './observabilidade/observabilidade.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ObservabilidadeModule, // primeiro — garante que o logger está pronto para os outros módulos
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ThrottlerModule.forRoot([
      {
        // Limite global: 60 req / 60s por IP
        // Rotas de auth usam o decorator @Throttle para limites mais restritivos
        ttl: 60_000,
        limit: 60,
      },
    ]),
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
    DashboardModule,
    RelatorioModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
