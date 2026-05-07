import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { addMinutes } from 'date-fns';
import { NotificacaoProducer } from '../notificacao/notificacao.producer';

@Injectable()
export class AgendamentoService {
  constructor(
    private prisma: PrismaService,
    private notificacaoProducer: NotificacaoProducer,
  ) {}

  async create(dto: CreateAgendamentoDto, barCodigo: number) {
    // 1. Busca duração por barbeiro com fallback para base do serviço
    const servicos = await this.prisma.servico.findMany({
      where: {
        codigo: { in: dto.servicosIds },
        barCodigo: barCodigo,
      },
      include: {
        barbeiros: {
          where: { barbeiroId: dto.barbeiroId },
        },
      },
    });

    if (servicos.length !== dto.servicosIds.length) {
      throw new BadRequestException(
        'Alguns serviços não foram encontrados ou não pertencem a esta barbearia',
      );
    }

    let totalDuration = 0;
    const agendamentoItemsData = servicos.map((srv) => {
      const duracaoMin =
        srv.barbeiros.length > 0 && srv.barbeiros[0].duracaoMin
          ? srv.barbeiros[0].duracaoMin
          : srv.duracaoBase ?? 30;

      const preco =
        srv.barbeiros.length > 0 && srv.barbeiros[0].precoProprio != null
          ? srv.barbeiros[0].precoProprio
          : srv.precoBase ?? 0;

      totalDuration += duracaoMin;

      return { srvCodigo: srv.codigo, duracaoMin, preco, barCodigo };
    });

    const inicioDate = new Date(dto.inicio);
    const fimDate = addMinutes(inicioDate, totalDuration);

    // 2. Transação com lock anti-double-booking
    const agendamento = await this.prisma.$transaction(async (tx) => {
      const conflitos = await tx.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(1) as count
        FROM "TQE_AGENDAMENTO"
        WHERE "TQE_AGD_BARBEIRO_ID" = ${dto.barbeiroId}
          AND "TQE_AGD_STATUS" NOT IN ('cancelado', 'no_show')
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
          barCodigo: barCodigo,
          inicio: inicioDate,
          fim: fimDate,
          status: 'confirmado',
          itens: { create: agendamentoItemsData },
        },
        include: {
          itens: true,
          cliente: true,
          barbeiro: true,
          barbearia: true,
        },
      });
    });

    // 3. Emite notificação APÓS a transação (não bloqueia a resposta)
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

    return agendamento;
  }
}
