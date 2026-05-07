import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigJornadaDto } from './dto/config-jornada.dto';

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  async upsertJornada(barbeiroId: number, dto: ConfigJornadaDto) {
    return this.prisma.jornadaTrabalho.upsert({
      where: {
        barbeiroId_diaSemana: {
          barbeiroId,
          diaSemana: dto.diaSemana,
        },
      },
      update: dto,
      create: {
        ...dto,
        barbeiroId,
      },
    });
  }

  async getJornada(barbeiroId: number) {
    return this.prisma.jornadaTrabalho.findMany({
      where: { barbeiroId },
      orderBy: { diaSemana: 'asc' },
    });
  }
}
