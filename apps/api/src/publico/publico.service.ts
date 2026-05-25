import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembroBarbeariaService } from '../barbearia/membro-barbearia.service';
import { ServicoService } from '../servico/servico.service';
import { AgendaService } from '../agenda/agenda.service';
import { AgendamentoService } from '../agendamento/agendamento.service';
import { CreatePublicAgendamentoDto } from './dto/create-public-agendamento.dto';
import { serializeAgendamento } from '../agendamento/serialize-agendamento';
import { SELECT_USUARIO_PERFIL } from '../common/constants/prisma-selects';

/**
 * Orquestra os endpoints de agendamento público (sem autenticação).
 *
 * Princípio: NÃO reimplementar regras de domínio. Reaproveita os services
 * existentes (`AgendamentoService`, `AgendaService`, `MembroBarbeariaService`,
 * `ServicoService`) — o único papel desta camada é traduzir `slug → barCodigo`
 * e expor uma superfície mínima de dados (sem stats sensíveis).
 */
@Injectable()
export class PublicoService {
  constructor(
    private prisma: PrismaService,
    private membroService: MembroBarbeariaService,
    private servicoService: ServicoService,
    private agendaService: AgendaService,
    private agendamentoService: AgendamentoService,
  ) {}

  /** Resolve slug → barbearia ativa. Lança 404 se não existir. */
  async getBarbeariaPorSlug(slug: string) {
    const barbearia = await this.prisma.barbearia.findUnique({
      where: { slug },
      select: {
        codigo: true,
        nome: true,
        slug: true,
        ativo: true,
        timezone: true,
        tema: { select: { logoUrl: true, corPrimaria: true } },
      },
    });
    if (!barbearia || !barbearia.ativo) {
      throw new NotFoundException('Barbearia não encontrada');
    }
    return barbearia;
  }

  /** Lista pública de serviços ativos. */
  async listarServicos(slug: string) {
    const { codigo } = await this.getBarbeariaPorSlug(slug);
    const servicos = await this.servicoService.findAll(codigo);
    return servicos.map((s) => ({
      codigo: s.codigo,
      nome: s.nome,
      precoBase: s.precoBase,
      duracaoBase: s.duracaoBase,
    }));
  }

  /**
   * Lista pública de barbeiros. Expõe apenas dados necessários ao fluxo de
   * booking (nome, avatar, e-mail só por id). NÃO inclui faturamento,
   * ticket médio ou contagens internas.
   */
  async listarBarbeiros(slug: string, srvCodigo?: number) {
    const { codigo } = await this.getBarbeariaPorSlug(slug);
    const membros = await this.prisma.membroBarbearia.findMany({
      where: { barCodigo: codigo, perfil: 'barbeiro' },
      include: { usuario: { select: SELECT_USUARIO_PERFIL } },
      orderBy: { usuario: { nome: 'asc' } },
    });

    // Filtra barbeiros que DESATIVARAM o serviço escolhido (ativo=false).
    // Sem registro em TQE_BARBEIRO_SERVICO = realiza por padrão (permanece).
    let excluidos = new Set<number>();
    if (srvCodigo != null) {
      const desativados = await this.prisma.barbeiroServico.findMany({
        where: { barCodigo: codigo, srvCodigo, ativo: false },
        select: { barbeiroId: true },
      });
      excluidos = new Set(desativados.map((d) => d.barbeiroId));
    }

    return membros
      .filter((m) => !excluidos.has(m.usuario.codigo))
      .map((m) => ({
        codigo: m.usuario.codigo,
        nome: m.usuario.nome,
        avatarUrl: m.usuario.avatarUrl,
      }));
  }

  /**
   * Slots disponíveis no dia para um barbeiro específico.
   *
   * `barbeiroId === 0` significa "qualquer barbeiro": devolvemos a união dos
   * slots livres de todos os barbeiros ativos da barbearia, marcando o
   * primeiro `barbeiroId` capaz de atender. Caller faz POST com esse id.
   */
  async listarSlots(params: {
    slug: string;
    barbeiroId: number;
    data: string;
    duracao: number;
  }) {
    const { codigo } = await this.getBarbeariaPorSlug(params.slug);

    if (params.barbeiroId > 0) {
      const slots = await this.agendaService.getAvailableSlots(
        params.barbeiroId,
        codigo,
        params.data,
        params.duracao,
      );
      return slots.map((horario) => ({
        horario,
        barbeiroId: params.barbeiroId,
      }));
    }

    // "Qualquer barbeiro": calcula por barbeiro e mescla.
    const barbeiros = await this.prisma.membroBarbearia.findMany({
      where: { barCodigo: codigo, perfil: 'barbeiro' },
      select: { usrCodigo: true },
    });

    const porHorario = new Map<string, number>();
    for (const { usrCodigo } of barbeiros) {
      const slots = await this.agendaService.getAvailableSlots(
        usrCodigo,
        codigo,
        params.data,
        params.duracao,
      );
      for (const horario of slots) {
        if (!porHorario.has(horario)) porHorario.set(horario, usrCodigo);
      }
    }

    return Array.from(porHorario.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([horario, barbeiroId]) => ({ horario, barbeiroId }));
  }

  /**
   * Cria agendamento público:
   *   1. resolve barbearia por slug;
   *   2. cria/recupera cliente via `MembroBarbeariaService.findOrCreateCliente`;
   *   3. resolve "qualquer barbeiro" se vier `barbeiroId === 0`;
   *   4. delega para `AgendamentoService.create` (mesma lógica de conflito,
   *      notificações e gateway WebSocket que o fluxo autenticado).
   */
  async criarAgendamento(slug: string, dto: CreatePublicAgendamentoDto) {
    const barbearia = await this.getBarbeariaPorSlug(slug);

    const membroCliente = await this.membroService.findOrCreateCliente(
      barbearia.codigo,
      dto.cliente,
    );

    const barbeiroId =
      dto.barbeiroId > 0
        ? dto.barbeiroId
        : await this.resolverBarbeiroAuto(
            barbearia.codigo,
            dto.servicosIds,
            dto.inicio,
          );

    const agendamento = await this.agendamentoService.create(
      {
        barbeiroId,
        clienteId: membroCliente.usrCodigo,
        inicio: dto.inicio,
        servicosIds: dto.servicosIds,
        tipo: 'AGENDADO',
        observacao: dto.observacao || undefined,
      },
      barbearia.codigo,
    );
    // Mesmo contrato público dos demais endpoints (cliente.usrCodigo,
    // itens.preco numérico) — o controller não passa pelo serializer.
    return serializeAgendamento(agendamento);
  }

  /**
   * Lista pública de avaliações da barbearia.
   *
   * Retorna apenas avaliações de agendamentos CONCLUIDOS, sem dados pessoais
   * do cliente. Limita a 20 registros mais recentes.
   */
  async listarAvaliacoes(slug: string): Promise<{
    media: number;
    total: number;
    items: { nota: number; comentario: string | null; criadoEm: string }[];
  }> {
    const { codigo } = await this.getBarbeariaPorSlug(slug);

    const avaliacoes = await this.prisma.avaliacaoAgendamento.findMany({
      where: {
        agendamento: {
          barCodigo: codigo,
          status: 'CONCLUIDO',
        },
      },
      select: {
        nota: true,
        comentario: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'desc' },
      take: 20,
    });

    const total = avaliacoes.length;
    const media =
      total > 0
        ? Math.round(
            (avaliacoes.reduce((sum, a) => sum + a.nota, 0) / total) * 10,
          ) / 10
        : 0;

    return {
      media,
      total,
      items: avaliacoes.map((a) => ({
        nota: a.nota,
        comentario: a.comentario,
        criadoEm: a.criadoEm.toISOString(),
      })),
    };
  }

  private async resolverBarbeiroAuto(
    barCodigo: number,
    servicosIds: number[],
    inicio: string,
  ): Promise<number> {
    const servicos = await this.prisma.servico.findMany({
      where: { codigo: { in: servicosIds }, barCodigo },
      select: { duracaoBase: true },
    });
    const duracao = servicos.reduce((sum, s) => sum + (s.duracaoBase ?? 30), 0);
    const data = inicio.slice(0, 10);
    const horarioAlvo = inicio.slice(11, 16);

    const barbeiros = await this.prisma.membroBarbearia.findMany({
      where: { barCodigo, perfil: 'barbeiro' },
      select: { usrCodigo: true },
    });

    for (const { usrCodigo } of barbeiros) {
      const slots = await this.agendaService.getAvailableSlots(
        usrCodigo,
        barCodigo,
        data,
        duracao,
      );
      if (slots.includes(horarioAlvo)) return usrCodigo;
    }

    throw new BadRequestException(
      'Nenhum barbeiro disponível neste horário — escolha outro slot.',
    );
  }
}
