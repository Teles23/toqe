import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { addMinutes } from 'date-fns';

@Injectable()
export class AgendamentoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAgendamentoDto, barCodigo: number) {
    const servicos = await this.prisma.servico.findMany({
      where: {
        codigo: { in: dto.servicosIds },
        barCodigo: barCodigo,
      },
    });

    if (servicos.length !== dto.servicosIds.length) {
      throw new BadRequestException('Alguns serviços não foram encontrados ou não pertencem a esta barbearia');
    }

    let totalDuration = 0;
    
    const agendamentoItemsData = servicos.map(srv => {
      totalDuration += srv.duracaoBase;
      return {
        srvCodigo: srv.codigo,
        duracaoMin: srv.duracaoBase,
        preco: srv.precoBase,
      };
    });

    const inicioDate = new Date(dto.inicio);
    const fimDate = addMinutes(inicioDate, totalDuration);
    
    return this.prisma.$transaction(async (tx) => {
      // Validação simples de concorrência
      const conflict = await tx.agendamento.findFirst({
        where: {
          barbeiroId: dto.barbeiroId,
          status: { notIn: ['cancelado', 'no_show'] },
          OR: [
            { inicio: { lt: fimDate, gte: inicioDate } },
            { fim: { gt: inicioDate, lte: fimDate } }
          ]
        }
      });

      if (conflict) {
        throw new BadRequestException('Horário indisponível ou já agendado para este barbeiro');
      }

      const agendamento = await tx.agendamento.create({
        data: {
          barbeiroId: dto.barbeiroId,
          clienteId: dto.clienteId,
          barCodigo: barCodigo,
          inicio: inicioDate,
          fim: fimDate,
          status: 'confirmado',
          itens: {
            create: agendamentoItemsData
          }
        },
        include: {
          itens: true,
        }
      });

      return agendamento;
    });
  }
}
