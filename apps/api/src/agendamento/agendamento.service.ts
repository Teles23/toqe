import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { CreateWalkInDto } from './dto/create-walk-in.dto';
import { ListAgendamentoDto } from './dto/list-agendamento.dto';
import { PatchStatusAgendamentoDto } from './dto/patch-status-agendamento.dto';
import { TransferirAgendamentoDto } from './dto/transferir-agendamento.dto';
import type { ReagendarAgendamentoInput } from '@toqe/contracts';
import { addMinutes, subDays } from 'date-fns';
import { rangeDoDia } from '../common/utils/date.utils';
import { NotificacaoProducer } from '../notificacao/notificacao.producer';
import { AgendamentoConfirmadoJob } from '../notificacao/notificacao.types';
import { MembroBarbeariaService } from '../barbearia/membro-barbearia.service';
import { ContatoService } from '../contato/contato.service';
import { AgendaGateway } from '../agenda/agenda.gateway';
import { Prisma } from '../generated/prisma';
import {
  StatusAgendamento,
  STATUSES_ENCERRADOS,
} from '../common/constants/agendamento-status';
import { FidelidadeService } from '../fidelidade/fidelidade.service';
import { TenantStore } from '../tenant/tenant-store';

const INCLUDE_COMPLETO = {
  itens: { include: { servico: true } },
  // `email` é usado internamente (job de notificação); `codigo` é o Usuario.codigo
  // usado nos checks de ownership. A serialização da resposta (serialize-agendamento)
  // expõe `usrCodigo`/`telefone` ao cliente e descarta `email`.
  // `cliente` é null para walk-ins que usam TQE_CONTATO em vez de TQE_USUARIO.
  cliente: {
    select: { codigo: true, nome: true, email: true, telefone: true },
  },
  // Contato operacional (walk-in sem conta): presente quando clienteId é null.
  contato: {
    select: { codigo: true, nome: true, telefone: true },
  },
  barbeiro: { select: { codigo: true, nome: true, avatarUrl: true } },
  barbearia: { select: { codigo: true, nome: true } },
} as const;

@Injectable()
export class AgendamentoService {
  private readonly logger = new Logger(AgendamentoService.name);

  constructor(
    private prisma: PrismaService,
    private notificacaoProducer: NotificacaoProducer,
    private agendaGateway: AgendaGateway,
    private membroService: MembroBarbeariaService,
    private contatoService: ContatoService,
    private fidelidadeService: FidelidadeService,
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

    const agendamento = await this.prisma
      .$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_tenant', ${String(barCodigo)}, true)`;
          return TenantStore.runInTx(barCodigo, async () => {
            // Enforcement: checar limite de agendamentos do mês
            const bar = await tx.barbearia.findUniqueOrThrow({
              where: { codigo: barCodigo },
              select: { plano: true },
            });
            const limite = await tx.planoLimite.findUnique({
              where: { plano: bar.plano },
              select: { maxAgdMes: true },
            });
            if (limite?.maxAgdMes != null) {
              const agora = new Date();
              const inicioMes = new Date(
                agora.getFullYear(),
                agora.getMonth(),
                1,
              );
              const fimMes = new Date(
                agora.getFullYear(),
                agora.getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
              );
              const qtd = await tx.agendamento.count({
                where: { barCodigo, inicio: { gte: inicioMes, lte: fimMes } },
              });
              if (qtd >= limite.maxAgdMes) {
                throw new ForbiddenException(
                  `Limite de ${limite.maxAgdMes} agendamento(s) por mês atingido`,
                );
              }
            }

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
        },
        { timeout: 15_000, maxWait: 5_000 },
      )
      .catch((e: unknown) => {
        // The application-level $queryRaw check guards most conflicts; this catch
        // handles the rare race where two concurrent requests both pass that check
        // before either commits — the EXCLUSION CONSTRAINT fires at DB level.
        if (
          e instanceof Prisma.PrismaClientUnknownRequestError &&
          e.message.includes('exclusion constraint')
        ) {
          throw new ConflictException(
            'Horário indisponível: já existe um agendamento neste período para este barbeiro',
          );
        }
        throw e;
      });

    await this.notificacaoProducer.agendamentoConfirmado(
      this.buildNotificacaoJob(agendamento),
    );

    this.agendaGateway.emitAgendamentoCriado(barCodigo, agendamento);

    return agendamento;
  }

  /**
   * Cria um walk-in (encaixe) de forma ATÔMICA: numa única transação, cria/
   * reaproveita o cliente e cria o agendamento tipo WALK_IN. Se o agendamento
   * falha, o cliente recém-criado é desfeito junto — sem cliente órfão.
   *
   * Atende a persona barbeiro diretamente (a rota é autorizada para barbeiro),
   * sem depender de `POST /barbearias/:cod/clientes` (que exige dono/gerente).
   *
   * `inicio` é definido pelo servidor (agora) — walk-in = cliente chegou agora.
   * A notificação é best-effort: falha de fila NÃO derruba um walk-in já gravado.
   */
  async createWalkIn(dto: CreateWalkInDto, barCodigo: number) {
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

    const inicioDate = new Date();
    const fimDate = addMinutes(inicioDate, totalDuration);

    const agendamento = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${String(barCodigo)}, true)`;
      return TenantStore.runInTx(barCodigo, async () => {
        const clienteId: number | null = dto.clienteId ?? null;
        let contatoId: number | null = dto.contatoId ?? null;

        if (dto.contato) {
          const contato = await this.contatoService.findOrCreate(
            barCodigo,
            dto.contato,
            tx,
          );
          contatoId = contato.codigo;
        }

        return tx.agendamento.create({
          data: {
            barbeiroId: dto.barbeiroId,
            clienteId,
            contatoId,
            barCodigo,
            inicio: inicioDate,
            fim: fimDate,
            status: StatusAgendamento.PENDENTE,
            tipo: 'WALK_IN',
            itens: { create: itensData },
          },
          include: INCLUDE_COMPLETO,
        });
      });
    });

    try {
      await this.notificacaoProducer.agendamentoConfirmado(
        this.buildNotificacaoJob(agendamento),
      );
    } catch (err) {
      this.logger.warn(
        `Walk-in ${agendamento.codigo} criado, mas falha ao enfileirar notificação: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    this.agendaGateway.emitAgendamentoCriado(barCodigo, agendamento);

    return agendamento;
  }

  private buildNotificacaoJob(
    agendamento: Prisma.AgendamentoGetPayload<{
      include: typeof INCLUDE_COMPLETO;
    }>,
  ): AgendamentoConfirmadoJob {
    // Armazena apenas IDs na fila Redis; o consumer busca os dados do DB
    return {
      agendamentoCodigo: agendamento.codigo,
      clienteUsrCodigo: agendamento.cliente?.codigo,
      barbeiroUsrCodigo: agendamento.barbeiro.codigo,
      barCodigo: agendamento.barCodigo,
    };
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
          in: [
            StatusAgendamento.EM_ANDAMENTO,
            StatusAgendamento.CONFIRMADO,
            StatusAgendamento.PENDENTE,
          ],
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

  async findAll(barCodigo: number, filtros: ListAgendamentoDto) {
    const where: Prisma.AgendamentoWhereInput = { barCodigo };

    if (filtros.data) {
      const { inicio, fim } = rangeDoDia(filtros.data);
      where.inicio = { gte: inicio, lte: fim };
    } else if (!filtros.clienteId) {
      // Sem data e sem cliente específico: aplica janela de 90 dias para evitar
      // full scan crescente conforme a barbearia acumula histórico.
      where.inicio = { gte: subDays(new Date(), 90) };
    }
    if (filtros.clienteId) where.clienteId = filtros.clienteId;
    if (filtros.status) where.status = filtros.status;
    if (filtros.tipo) where.tipo = filtros.tipo;

    if (filtros.barbeiroId && filtros.barbeiroCompativel === 'true') {
      // Modo "fila": barbeiroId significa "compatível com este barbeiro", não
      // "designado a ele". Exclui encaixes com algum serviço que o barbeiro
      // desativou (BarbeiroServico.ativo=false). Sem registro = pode atender.
      const desativados = await this.prisma.barbeiroServico.findMany({
        where: { barbeiroId: filtros.barbeiroId, barCodigo, ativo: false },
        select: { srvCodigo: true },
      });
      const srvDesativados = desativados.map((b) => b.srvCodigo);
      if (srvDesativados.length > 0) {
        where.itens = { none: { srvCodigo: { in: srvDesativados } } };
      }
    } else if (filtros.barbeiroId) {
      where.barbeiroId = filtros.barbeiroId;
    }

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
    executorId?: number,
  ) {
    const agendamento = await this.findOne(codigo, barCodigo);

    // Iniciar um encaixe (WALK_IN → em_andamento): a fila não tem barbeiro
    // designado — qualquer um pode atender, EXCETO se o barbeiro desativou
    // explicitamente algum serviço do encaixe (BarbeiroServico.ativo=false).
    // Sem registro = usa o padrão da barbearia = pode atender.
    if (
      (dto.status as StatusAgendamento) === StatusAgendamento.EM_ANDAMENTO &&
      agendamento.tipo === 'WALK_IN' &&
      executorId !== undefined
    ) {
      const srvCodigos = agendamento.itens.map((i) => i.srvCodigo);
      if (srvCodigos.length > 0) {
        const desativado = await this.prisma.barbeiroServico.findFirst({
          where: {
            barbeiroId: executorId,
            barCodigo,
            srvCodigo: { in: srvCodigos },
            ativo: false,
          },
        });
        if (desativado) {
          throw new ForbiddenException(
            'Você não realiza este serviço. Outro barbeiro deve atender.',
          );
        }
      }
    }

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

    if ((dto.status as StatusAgendamento) === StatusAgendamento.CONCLUIDO) {
      await this.fidelidadeService.registrarGanho(codigo, barCodigo);
    }

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

  async avaliarAgendamento(
    codigo: number,
    barCodigo: number,
    callerUserId: number,
    dto: CreateAvaliacaoDto,
  ) {
    const agendamento = await this.findOne(codigo, barCodigo);

    const clienteCodigo = (agendamento.cliente as { codigo: number } | null)
      ?.codigo;
    if (clienteCodigo !== callerUserId) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    if (
      (agendamento.status as StatusAgendamento) !== StatusAgendamento.CONCLUIDO
    ) {
      throw new BadRequestException(
        'Só é possível avaliar agendamentos concluídos',
      );
    }

    const jaAvaliado = await this.prisma.avaliacaoAgendamento.findUnique({
      where: { agendamentoCodigo: codigo },
    });
    if (jaAvaliado) {
      throw new ConflictException('Este agendamento já foi avaliado');
    }

    try {
      await this.prisma.avaliacaoAgendamento.create({
        data: {
          agendamentoCodigo: codigo,
          nota: dto.nota,
          comentario: dto.comentario,
        },
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Este agendamento já foi avaliado');
      }
      throw e;
    }

    return { sucesso: true };
  }

  meusAtendimentos(barbeiroId: number, barCodigo: number, limit = 20) {
    return this.prisma.agendamento.findMany({
      where: { barbeiroId, barCodigo, status: StatusAgendamento.CONCLUIDO },
      include: INCLUDE_COMPLETO,
      orderBy: { inicio: 'desc' },
      take: limit,
    });
  }

  async reagendar(
    codigo: number,
    dto: ReagendarAgendamentoInput,
    requesterUsrCodigo: number,
    barCodigo: number,
    callerPerfil?: string,
  ) {
    const ag = await this.prisma.agendamento.findFirst({
      where: { codigo, barCodigo },
      include: INCLUDE_COMPLETO,
    });

    if (!ag) throw new NotFoundException('Agendamento não encontrado');

    const ehCliente = ag.clienteId === requesterUsrCodigo;
    const ehBarbeiro = ag.barbeiroId === requesterUsrCodigo;
    const ehGestao = callerPerfil === 'dono' || callerPerfil === 'gerente';
    if (!ehCliente && !ehBarbeiro && !ehGestao) {
      throw new ForbiddenException(
        'Sem permissão para reagendar este agendamento',
      );
    }

    if (
      ![StatusAgendamento.PENDENTE, StatusAgendamento.CONFIRMADO].includes(
        ag.status as StatusAgendamento,
      )
    ) {
      throw new BadRequestException(
        'Só é possível reagendar agendamentos PENDENTE ou CONFIRMADO',
      );
    }

    const novoInicio = new Date(dto.inicio);
    if (novoInicio <= new Date()) {
      throw new BadRequestException('O novo horário deve ser no futuro');
    }

    const duracaoMs = ag.fim.getTime() - ag.inicio.getTime();
    const novoFim = dto.fim
      ? new Date(dto.fim)
      : new Date(novoInicio.getTime() + duracaoMs);

    const atualizado = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${String(barCodigo)}, true)`;
      return TenantStore.runInTx(barCodigo, async () => {
        const conflitos = await tx.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(1) as count
          FROM "TQE_AGENDAMENTO"
          WHERE "TQE_AGD_BARBEIRO_ID" = ${ag.barbeiroId}
            AND "TQE_AGD_CODIGO" != ${codigo}
            AND "TQE_AGD_STATUS" NOT IN ('cancelado', 'no_show')
            AND "TQE_AGD_INICIO" < ${novoFim}
            AND "TQE_AGD_FIM" > ${novoInicio}
        `;

        if (Number(conflitos[0].count) > 0) {
          throw new ConflictException(
            'O barbeiro já tem um agendamento neste horário',
          );
        }

        return tx.agendamento.update({
          where: { codigo, barCodigo },
          data: { inicio: novoInicio, fim: novoFim },
          include: INCLUDE_COMPLETO,
        });
      });
    });

    this.agendaGateway.emitAgendamentoCriado(barCodigo, atualizado);

    return atualizado;
  }

  async transferir(
    codigo: number,
    dto: TransferirAgendamentoDto,
    barCodigo: number,
  ) {
    const agendamento = await this.findOne(codigo, barCodigo);

    if (
      (STATUSES_ENCERRADOS as readonly string[]).includes(agendamento.status)
    ) {
      throw new BadRequestException(
        `Não é possível transferir um agendamento com status '${agendamento.status}'`,
      );
    }

    const novoBarbeiro = await this.prisma.membroBarbearia.findFirst({
      where: {
        usrCodigo: dto.novoBarbeiroId,
        barCodigo,
        perfil: { in: ['barbeiro', 'dono'] },
      },
    });

    if (!novoBarbeiro) {
      throw new NotFoundException(
        'Barbeiro não encontrado ou não pertence a esta barbearia',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${String(barCodigo)}, true)`;
      return TenantStore.runInTx(barCodigo, async () => {
        const conflitos = await tx.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(1) as count
          FROM "TQE_AGENDAMENTO"
          WHERE "TQE_AGD_BARBEIRO_ID" = ${dto.novoBarbeiroId}
            AND "TQE_AGD_STATUS" NOT IN ('cancelado', 'no_show')
            AND "TQE_AGD_CODIGO" <> ${codigo}
            AND "TQE_AGD_INICIO" < ${agendamento.fim}
            AND "TQE_AGD_FIM"   > ${agendamento.inicio}
        `;

        if (Number(conflitos[0].count) > 0) {
          throw new BadRequestException(
            'Conflito de horário: o barbeiro selecionado já possui um agendamento neste período',
          );
        }

        return tx.agendamento.update({
          where: { codigo, barCodigo },
          data: { barbeiroId: dto.novoBarbeiroId },
          include: INCLUDE_COMPLETO,
        });
      });
    });
  }
}
