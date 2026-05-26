import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { addMinutes, startOfDay, endOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { ServicoService } from '../servico/servico.service';
import { CriarAgendamentoPublicoDto } from './dto/criar-agendamento-publico.dto';

@Injectable()
export class ApiPublicaService {
  constructor(
    private prisma: PrismaService,
    private servicoService: ServicoService,
  ) {}

  async listarAgendamentos(barCodigo: number, data?: string) {
    const where: {
      barCodigo: number;
      inicio?: { gte: Date; lte: Date };
    } = { barCodigo };

    if (data) {
      const dia = new Date(data);
      where.inicio = { gte: startOfDay(dia), lte: endOfDay(dia) };
    }

    return this.prisma.agendamento.findMany({
      where,
      include: {
        itens: { include: { servico: true } },
        cliente: { select: { codigo: true, nome: true, email: true } },
        barbeiro: { select: { codigo: true, nome: true } },
      },
      orderBy: { inicio: 'asc' },
    });
  }

  async criarAgendamento(barCodigo: number, dto: CriarAgendamentoPublicoDto) {
    // Verificar ou criar cliente pelo email
    let cliente = await this.prisma.usuario.findUnique({
      where: { email: dto.clienteEmail },
    });

    if (!cliente) {
      // Criar cliente provisório sem senha
      cliente = await this.prisma.usuario.create({
        data: {
          nome: dto.clienteNome,
          email: dto.clienteEmail,
          senhaHash: '',
          membros: {
            create: {
              barCodigo,
              perfil: 'cliente',
            },
          },
        },
      });
    } else {
      // Garantir que é membro da barbearia
      const membro = await this.prisma.membroBarbearia.findFirst({
        where: { usrCodigo: cliente.codigo, barCodigo },
      });
      if (!membro) {
        await this.prisma.membroBarbearia.create({
          data: { barCodigo, usrCodigo: cliente.codigo, perfil: 'cliente' },
        });
      }
    }

    // Buscar serviço
    const servico = await this.prisma.servico.findFirst({
      where: { codigo: dto.servicoCodigo, barCodigo, ativo: true },
      include: {
        barbeiros: { where: { barbeiroId: dto.barbeiroId } },
      },
    });

    if (!servico) {
      throw new BadRequestException('Serviço não encontrado ou inativo');
    }

    const duracaoMin =
      servico.barbeiros[0]?.duracaoMin ?? servico.duracaoBase ?? 30;
    const preco =
      servico.barbeiros[0]?.precoProprio != null
        ? servico.barbeiros[0].precoProprio
        : (servico.precoBase ?? 0);

    const inicioDate = new Date(dto.inicio);
    const fimDate = addMinutes(inicioDate, duracaoMin);

    // Verificar conflito de horário
    const conflitos = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(1) as count
      FROM "TQE_AGENDAMENTO"
      WHERE "TQE_AGD_BARBEIRO_ID" = ${dto.barbeiroId}
        AND "TQE_AGD_STATUS" NOT IN ('cancelado', 'no_show')
        AND "TQE_AGD_INICIO" < ${fimDate}
        AND "TQE_AGD_FIM"   > ${inicioDate}
    `;

    if (Number(conflitos[0].count) > 0) {
      throw new ConflictException(
        'Horário indisponível: já existe um agendamento neste período para este barbeiro',
      );
    }

    return this.prisma.agendamento.create({
      data: {
        barbeiroId: dto.barbeiroId,
        clienteId: cliente.codigo,
        barCodigo,
        inicio: inicioDate,
        fim: fimDate,
        status: 'confirmado',
        itens: {
          create: [
            {
              srvCodigo: servico.codigo,
              duracaoMin,
              preco,
              barCodigo,
            },
          ],
        },
      },
      include: {
        itens: { include: { servico: true } },
        cliente: { select: { codigo: true, nome: true, email: true } },
        barbeiro: { select: { codigo: true, nome: true } },
      },
    });
  }

  listarServicos(barCodigo: number) {
    return this.servicoService.findAll(barCodigo);
  }

  async listarBarbeiros(barCodigo: number) {
    const membros = await this.prisma.membroBarbearia.findMany({
      where: {
        barCodigo,
        perfil: { in: ['barbeiro', 'dono', 'gerente'] },
      },
      include: {
        usuario: {
          select: { codigo: true, nome: true, avatarUrl: true },
        },
      },
    });

    return membros.map((m) => m.usuario);
  }
}
