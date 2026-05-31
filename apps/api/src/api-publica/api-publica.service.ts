import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { addMinutes, startOfDay, endOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { ServicoService } from '../servico/servico.service';
import { TenantContextService } from '../tenant/tenant-context/tenant-context.service';
import { CriarAgendamentoPublicoDto } from './dto/criar-agendamento-publico.dto';

@Injectable()
export class ApiPublicaService {
  constructor(
    private prisma: PrismaService,
    private servicoService: ServicoService,
    private tenantContext: TenantContextService,
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
    // Fix 1: Validar que o barbeiroId pertence à barbearia (IDOR guard)
    const membroBarb = await this.prisma.membroBarbearia.findFirst({
      where: { barCodigo, usrCodigo: dto.barbeiroId },
    });
    if (!membroBarb) {
      throw new BadRequestException('Barbeiro não pertence a esta barbearia');
    }

    // Buscar serviço fora da transação (read-only, sem lock necessário)
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

    // Fix 2: Usar tenantContext.run() para ativar RLS (set_config app.current_tenant)
    return this.tenantContext.run(barCodigo, async (tx) => {
      // Verificar ou criar cliente dentro da transação para atomicidade
      let cliente = await tx.usuario.findUnique({
        where: { email: dto.clienteEmail },
      });

      if (!cliente) {
        // Criar cliente provisório sem senha local (conta placeholder)
        cliente = await tx.usuario.create({
          data: {
            nome: dto.clienteNome,
            email: dto.clienteEmail,
            senhaHash: null,
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
        const membro = await tx.membroBarbearia.findFirst({
          where: { usrCodigo: cliente.codigo, barCodigo },
        });
        if (!membro) {
          await tx.membroBarbearia.create({
            data: { barCodigo, usrCodigo: cliente.codigo, perfil: 'cliente' },
          });
        }
      }

      // Verificar conflito de horário dentro da transação
      const conflitos = await tx.$queryRaw<{ count: bigint }[]>`
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

      return tx.agendamento.create({
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
          cliente: { select: { codigo: true, nome: true } },
          barbeiro: { select: { codigo: true, nome: true } },
        },
      });
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
