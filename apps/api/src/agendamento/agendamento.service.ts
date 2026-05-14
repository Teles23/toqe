import {
  Injectable,
  BadRequestException,
  ConflictException,
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

    const agendamento = await this.prisma.$transaction(async (tx) => {
      const conflitos = await tx.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(1) as count
        FROM "TQE_AGENDAMENTO"
        WHERE "TQE_AGD_BARBEIRO_ID" = ${dto.barbeiroId}
          AND "TQE_AGD_STATUS" NOT IN (${StatusAgendamento.CANCELADO}, ${StatusAgendamento.NO_SHOW})
          AND "TQE_AGD_INICIO" < ${fimDate}
          AND "TQE_AGD_FIM"   > ${inicioDate}
        FOR UPDATE SKIP LOCKED
      `;

      if (Number(conflitos[0].count) > 0) {
        throw new ConflictException(
          'Horário indisponível: já existe um agendamento neste período para este barbeiro',
        );
      }

      return tx.agendamento.create({
        data: {
          barbeiroId: dto.barbeiroId,
          clienteId: dto.clienteId,
          barCodigo,
          inicio: inicioDate,
          fim: fimDate,
          status: StatusAgendamento.CONFIRMADO,
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

  async findAll(barCodigo: number, filtros: ListAgendamentoDto) {
    const where: Prisma.AgendamentoWhereInput = { barCodigo };

    if (filtros.data) {
      const dia = new Date(filtros.data);
      where.inicio = { gte: startOfDay(dia), lte: endOfDay(dia) };
    }
    if (filtros.barbeiroId) where.barbeiroId = filtros.barbeiroId;
    if (filtros.status) where.status = filtros.status;

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
    const atualizado = await this.prisma.agendamento.update({
      where: { codigo },
      data: { status: dto.status },
      include: INCLUDE_COMPLETO,
    });
    this.agendaGateway.emitStatusAtualizado(barCodigo, {
      codigo,
      status: dto.status,
    });
    return atualizado;
  }

  async cancel(codigo: number, barCodigo: number) {
    const agendamento = await this.findOne(codigo, barCodigo);

    if (
      (agendamento.status as StatusAgendamento) === StatusAgendamento.CANCELADO
    ) {
      throw new BadRequestException('Agendamento já está cancelado');
    }

    return this.prisma.agendamento.update({
      where: { codigo },
      data: { status: StatusAgendamento.CANCELADO },
      include: INCLUDE_COMPLETO,
    });
  }
}
