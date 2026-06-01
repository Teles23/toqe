import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
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
import { PublicoModule } from './publico/publico.module';
import { NotificacaoModule } from './notificacao/notificacao.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RelatorioModule } from './relatorio/relatorio.module';
import { ObservabilidadeModule } from './observabilidade/observabilidade.module';
import { HealthModule } from './health/health.module';
import { PushTokenModule } from './push-token/push-token.module';
import { AdminModule } from './admin/admin.module';
import { MeModule } from './me/me.module';
import { ConviteModule } from './convite/convite.module';
import { ClienteNotaModule } from './cliente-nota/cliente-nota.module';
import { ContatoModule } from './contato/contato.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LembreteModule } from './lembrete/lembrete.module';
import { AsaasModule } from './asaas/asaas.module';
import { PlanoAtivoGuard } from './auth/guards/plano-ativo.guard';
import { FidelidadeModule } from './fidelidade/fidelidade.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { ApiPublicaModule } from './api-publica/api-publica.module';
import { TenantInterceptor } from './tenant/tenant/tenant.interceptor';

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
    PublicoModule,
    NotificacaoModule,
    DashboardModule,
    RelatorioModule,
    HealthModule,
    PushTokenModule,
    AdminModule,
    MeModule,
    ConviteModule,
    ClienteNotaModule,
    ContatoModule,
    ScheduleModule.forRoot(),
    LembreteModule,
    AsaasModule,
    FidelidadeModule,
    ApiKeyModule,
    ApiPublicaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, // usa PrismaService (global) para bootstrap do super_admin
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: PlanoAtivoGuard },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}
