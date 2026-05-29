import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { AgendaGateway } from './agenda.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AgendaController],
  providers: [AgendaService, AgendaGateway],
  exports: [AgendaService, AgendaGateway],
})
export class AgendaModule {}
