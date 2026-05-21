import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { ListAgendamentoDto } from './dto/list-agendamento.dto';
import { PatchStatusAgendamentoDto } from './dto/patch-status-agendamento.dto';
import { addMinutes, startOfDay, endOfDay } from 'date-fns';
import { NotificacaoProducer } from '../notificacao/notificacao.producer';
import { AgendaGateway } from '../agenda/agenda.gateway';
import { Prisma } from '../generated/prisma';
import { StatusAgendamento } from '../common/constants/agendamento-status';

const INCLUDE_COMPLETO = {
  itens: { include: { servico: true } },
  cliente: { select: { codigo: true, nome: true, email: true } },
  barbeiro: { select: { codigo: true, nome: true } },
  barbearia: { select: { codigo: true, nome: true } },
} as const;

@Injectable()
export class AgendamentoService {
  constructor(
    private prisma: PrismaService,
    private notificacaoProducer: NotificacaoProducer,
    private agendaGateway: AgendaGateway,
  ) {}

  async create(dto: CreateAgendamentoDto, barCodigo: number) {
    const servicos = await this.prisma.servico.findMany({
      where: { codigo: { in: dto.servicosIds }, barCodigo },
      include: { barbeiros: { where: { barbeiroId: dto.barbeiroId } } },
    });

    if (servicos.length !== dto.servicosIds.length) {
      throw new BadRequestException(
        'Alguns serviços não foram encontrados ou não pertencem a esta barbearia',
      );
    }

    const { itensData, totalDuration } = this.buildItensData(
      servicos,
      barCodigo,
    );

    const inicioDate = new Date(dto.inicio);
    const fimDate = addMinutes(inicioDate, totalDuration);
    const tipo = dto.tipo ?? 'AGENDADO';
    const isWalkIn = tipo === 'WALK_IN';

    const agendamento = await this.prisma.$transaction(async (tx) => {
      // Walk-ins coexistem com agendamentos do mesmo horário por design —
      // são fila paralela ao calendário; o barbeiro decide ordem manualmente.
      // Conflict check só vale para agendamentos com horário marcado (AGENDADO/ENCAIXE).
      if (!isWalkIn) {
        const conflitos = await tx.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(1) as count
          FROM "TQE_AGENDAMENTO"
          WHERE "TQE_AGD_BARBEIRO_ID" = ${dto.barbeiroId}
            AND "TQE_AGD_STATUS" NOT IN (${StatusAgendamento.CANCELADO}, ${StatusAgendamento.NO_SHOW})
            AND "TQE_AGD_INICIO" < ${fimDate}
            AND "TQE_AGD_FIM"   > ${inicioDate}
        `;

        if (Number(conflitos[0].count) > 0) {
          throw new ConflictException(
            'Horário indisponível: já existe um agendamento neste período para este barbeiro',
          );
        }
      }

      return tx.agendamento.create({
        data: {
          barbeiroId: dto.barbeiroId,
          clienteId: dto.clienteId,
          barCodigo,
          inicio: inicioDate,
          fim: fimDate,
          status: isWalkIn
            ? StatusAgendamento.PENDENTE
            : StatusAgendamento.CONFIRMADO,
          tipo,
          itens: { create: itensData },
        },
        include: INCLUDE_COMPLETO,
      });
    });

    await this.notificacaoProducer.agendamentoConfirmado({
      agendamentoCodigo: agendamento.codigo,
      clienteNome: agendamento.cliente.nome,
      clienteEmail: agendamento.cliente.email,
      barbeiroNome: agendamento.barbeiro.nome,
      barbeariaNome: agendamento.barbearia.nome,
      inicio: agendamento.inicio.toISOString(),
      fim: agendamento.fim.toISOString(),
      servicos: servicos.map((s) => s.nome),
    });

    this.agendaGateway.emitAgendamentoCriado(barCodigo, agendamento);

    return agendamento;
  }

  meusAgendamentos(clienteId: number, barCodigo: number) {
    return this.prisma.agendamento.findMany({
      where: {
        clienteId,
        barCodigo,
        status: { not: StatusAgendamento.CANCELADO },
      },
      include: INCLUDE_COMPLETO,
      orderBy: { inicio: 'asc' },
    });
  }

  async proximoAgendamento(clienteId: number, barCodigo: number) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: {
        clienteId,
        barCodigo,
        inicio: { gt: new Date() },
        status: {
          notIn: [
            StatusAgendamento.CANCELADO,
            StatusAgendamento.CONCLUIDO,
            StatusAgendamento.NO_SHOW,
          ],
        },
      },
      include: INCLUDE_COMPLETO,
      orderBy: { inicio: 'asc' },
    });
    return agendamento ?? null;
  }

  async agendamentoAtual(barbeiroId: number, barCodigo: number) {
    const now = new Date();
    const agendamento = await this.prisma.agendamento.findFirst({
      where: {
        barbeiroId,
        barCodigo,
        inicio: { lte: now },
        fim: { gte: now },
        status: {
          in: [StatusAgendamento.CONFIRMADO, StatusAgendamento.PENDENTE],
        },
      },
      include: INCLUDE_COMPLETO,
      orderBy: { inicio: 'asc' },
    });
    return agendamento ?? null;
  }

  private buildItensData(
    servicos: Prisma.ServicoGetPayload<{ include: { barbeiros: true } }>[],
    barCodigo: number,
  ) {
    let totalDuration = 0;
    const itensData = servicos.map((srv) => {
      const duracaoMin = srv.barbeiros[0]?.duracaoMin ?? srv.duracaoBase ?? 30;
      const preco =
        srv.barbeiros[0]?.precoProprio != null
          ? srv.barbeiros[0].precoProprio
          : (srv.precoBase ?? 0);
      totalDuration += duracaoMin;
      return { srvCodigo: srv.codigo, duracaoMin, preco, barCodigo };
    });
    return { itensData, totalDuration };
  }

  findAll(barCodigo: number, filtros: ListAgendamentoDto) {
    const where: Prisma.AgendamentoWhereInput = { barCodigo };

    if (filtros.data) {
      const dia = new Date(filtros.data);
      where.inicio = { gte: startOfDay(dia), lte: endOfDay(dia) };
    }
    if (filtros.barbeiroId) where.barbeiroId = filtros.barbeiroId;
    if (filtros.status) where.status = filtros.status;
    if (filtros.tipo) where.tipo = filtros.tipo;

    return this.prisma.agendamento.findMany({
      where,
      include: INCLUDE_COMPLETO,
      orderBy: { inicio: 'asc' },
    });
  }

  async findOne(codigo: number, barCodigo: number) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: { codigo, barCodigo },
      include: INCLUDE_COMPLETO,
    });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado');
    return agendamento;
  }

  async patchStatus(
    codigo: number,
    dto: PatchStatusAgendamentoDto,
    barCodigo: number,
  ) {
    await this.findOne(codigo, barCodigo);
    // Inclui barCodigo no update para evitar TOCTOU: garante que o registro
    // continua sendo do mesmo tenant mesmo com concorrência
    const atualizado = await this.prisma.agendamento.update({
      where: { codigo, barCodigo },
      data: { status: dto.status },
      include: INCLUDE_COMPLETO,
    });
    this.agendaGateway.emitStatusAtualizado(barCodigo, {
      codigo,
      status: dto.status,
    });
    return atualizado;
  }

  async cancel(codigo: number, barCodigo: number, callerUserId?: number) {
    const agendamento = await this.findOne(codigo, barCodigo);

    // Cliente só pode cancelar seus próprios agendamentos
    if (callerUserId !== undefined) {
      const clienteCodigo = (agendamento.cliente as { codigo: number } | null)
        ?.codigo;
      if (clienteCodigo !== callerUserId) {
        throw new ForbiddenException(
          'Você só pode cancelar seus próprios agendamentos',
        );
      }
    }

    if (
      (agendamento.status as StatusAgendamento) === StatusAgendamento.CANCELADO
    ) {
      throw new BadRequestException('Agendamento já está cancelado');
    }

    // Inclui barCodigo no update para garantir isolamento (TOCTOU)
    return this.prisma.agendamento.update({
      where: { codigo, barCodigo },
      data: { status: StatusAgendamento.CANCELADO },
      include: INCLUDE_COMPLETO,
    });
  }

  async findOneForCliente(
    codigo: number,
    barCodigo: number,
    callerUserId: number,
  ) {
    const agendamento = await this.findOne(codigo, barCodigo);
    const clienteCodigo = (agendamento.cliente as { codigo: number } | null)
      ?.codigo;
    if (clienteCodigo !== callerUserId) {
      // Retorna 404 em vez de 403: não revela que o agendamento existe
      throw new NotFoundException('Agendamento não encontrado');
    }
    return agendamento;
  }
}
