import { Injectable, NotFoundException } from '@nestjs/common';
import { startOfMonth, endOfMonth } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { StatusAgendamento } from '../common/constants/agendamento-status';

@Injectable()
export class ServicoService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateServicoDto, barCodigo: number) {
    return this.prisma.servico.create({
      data: { ...dto, barCodigo },
    });
  }

  findAll(barCodigo: number) {
    return this.prisma.servico.findMany({
      where: { barCodigo, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async getMetricas(barCodigo: number) {
    const now = new Date();
    const inicioMes = startOfMonth(now);
    const fimMes = endOfMonth(now);

    const [totalAtivos, agdMes] = await Promise.all([
      this.prisma.servico.count({ where: { barCodigo, ativo: true } }),
      this.prisma.agendamento.findMany({
        where: {
          barCodigo,
          inicio: { gte: inicioMes, lte: fimMes },
          status: {
            notIn: [StatusAgendamento.CANCELADO, StatusAgendamento.NO_SHOW],
          },
        },
        include: { itens: { select: { preco: true } } },
      }),
    ]);

    const pedidosMes = agdMes.length;
    const receitaMes = agdMes.reduce(
      (sum, agd) =>
        sum + agd.itens.reduce((s, item) => s + Number(item.preco), 0),
      0,
    );
    const ticketMedio = pedidosMes > 0 ? receitaMes / pedidosMes : 0;

    return { totalAtivos, pedidosMes, receitaMes, ticketMedio };
  }

  async findOne(codigo: number, barCodigo: number) {
    const servico = await this.prisma.servico.findFirst({
      where: { codigo, barCodigo },
    });
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    return servico;
  }

  async update(codigo: number, dto: UpdateServicoDto, barCodigo: number) {
    await this.findOne(codigo, barCodigo);
    // barCodigo no where garante isolamento de tenant (TOCTOU)
    return this.prisma.servico.update({
      where: { codigo, barCodigo },
      data: dto,
    });
  }

  async remove(codigo: number, barCodigo: number) {
    await this.findOne(codigo, barCodigo);
    // barCodigo no where garante isolamento de tenant (TOCTOU)
    return this.prisma.servico.update({
      where: { codigo, barCodigo },
      data: { ativo: false },
    });
  }
}
