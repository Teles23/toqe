import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { startOfMonth, endOfMonth } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { AtualizarServicoBarbeiroDto } from './dto/atualizar-servico-barbeiro.dto';
import { StatusAgendamento } from '../common/constants/agendamento-status';

const DURACAO_FALLBACK = 30;
const DONO_GERENTE = ['dono', 'gerente'];

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

  // ─── Serviços do barbeiro (TQE_BARBEIRO_SERVICO) ────────────────────────────

  /**
   * Lista consolidada dos serviços sob a ótica de um barbeiro: serviços ativos
   * da barbearia + os exclusivos DESSE barbeiro, mesclados com a personalização
   * (preço/duração/ativo) em `TQE_BARBEIRO_SERVICO`. Sem registro = barbeiro faz
   * o serviço com os valores base.
   */
  async findServicosBarbeiro(barCodigo: number, barbeiroId: number) {
    const [servicos, regs] = await Promise.all([
      this.prisma.servico.findMany({
        where: {
          barCodigo,
          ativo: true,
          OR: [
            { exclusivoBarbeiroId: null },
            { exclusivoBarbeiroId: barbeiroId },
          ],
        },
        orderBy: { nome: 'asc' },
      }),
      this.prisma.barbeiroServico.findMany({
        where: { barCodigo, barbeiroId },
      }),
    ]);

    const porSrv = new Map(regs.map((r) => [r.srvCodigo, r]));

    const lista = servicos.map((s) => {
      const reg = porSrv.get(s.codigo);
      const precoBase = s.precoBase != null ? Number(s.precoBase) : 0;
      const duracaoBase = s.duracaoBase ?? DURACAO_FALLBACK;
      const precoProprio =
        reg?.precoProprio != null ? Number(reg.precoProprio) : null;
      return {
        servico: { codigo: s.codigo, nome: s.nome, precoBase, duracaoBase },
        barbeiro: reg
          ? { precoProprio, duracaoMin: reg.duracaoMin, ativo: reg.ativo }
          : null,
        precoEfetivo: precoProprio ?? precoBase,
        duracaoEfetiva: reg?.duracaoMin ?? duracaoBase,
        exclusivo: s.exclusivoBarbeiroId != null,
      };
    });

    // Ativos primeiro (sem registro = ativo por padrão), depois por nome.
    return lista.sort((a, b) => {
      const aAtivo = a.barbeiro?.ativo ?? true;
      const bAtivo = b.barbeiro?.ativo ?? true;
      if (aAtivo !== bAtivo) return aAtivo ? -1 : 1;
      return a.servico.nome.localeCompare(b.servico.nome);
    });
  }

  /** Liga/desliga um serviço para o barbeiro (upsert; nunca deleta). */
  async toggleServicoBarbeiro(
    barCodigo: number,
    barbeiroId: number,
    srvCodigo: number,
    ativo: boolean,
  ) {
    const servico = await this.findOne(srvCodigo, barCodigo);
    return this.prisma.barbeiroServico.upsert({
      where: { barbeiroId_srvCodigo: { barbeiroId, srvCodigo } },
      update: { ativo },
      create: {
        barCodigo,
        barbeiroId,
        srvCodigo,
        ativo,
        duracaoMin: servico.duracaoBase ?? DURACAO_FALLBACK,
      },
    });
  }

  /** Atualiza preço/duração próprios — guard de permissão (dono/gerente OU flag). */
  async atualizarServicoBarbeiro(
    barCodigo: number,
    barbeiroId: number,
    srvCodigo: number,
    dto: AtualizarServicoBarbeiroDto,
    callerPerfil: string | undefined,
  ) {
    await this.assertPermissao(
      barCodigo,
      callerPerfil,
      'barbeiroAlteraPreco',
      'Você não tem permissão para alterar o preço dos serviços',
    );
    await this.findOne(srvCodigo, barCodigo);
    return this.prisma.barbeiroServico.upsert({
      where: { barbeiroId_srvCodigo: { barbeiroId, srvCodigo } },
      update: {
        precoProprio: dto.precoProprio ?? null,
        duracaoMin: dto.duracaoMin,
      },
      create: {
        barCodigo,
        barbeiroId,
        srvCodigo,
        precoProprio: dto.precoProprio ?? null,
        duracaoMin: dto.duracaoMin,
      },
    });
  }

  /** Cria um serviço EXCLUSIVO do barbeiro — guard + 409 em nome duplicado. */
  async criarServicoExclusivo(
    barCodigo: number,
    barbeiroId: number,
    dto: CreateServicoDto,
    callerPerfil: string | undefined,
  ) {
    await this.assertPermissao(
      barCodigo,
      callerPerfil,
      'barbeiroCriaServico',
      'Você não tem permissão para cadastrar serviços',
    );

    const existente = await this.prisma.servico.findFirst({
      where: {
        barCodigo,
        nome: { equals: dto.nome, mode: 'insensitive' },
      },
    });
    if (existente) {
      throw new ConflictException(
        'Já existe um serviço com esse nome nessa barbearia',
      );
    }

    return this.prisma.servico.create({
      data: { ...dto, barCodigo, exclusivoBarbeiroId: barbeiroId },
    });
  }

  /**
   * Garante que o caller pode executar a ação: dono/gerente sempre podem; demais
   * dependem da flag de permissão na barbearia.
   */
  private async assertPermissao(
    barCodigo: number,
    callerPerfil: string | undefined,
    flag: 'barbeiroAlteraPreco' | 'barbeiroCriaServico',
    mensagem: string,
  ) {
    if (callerPerfil && DONO_GERENTE.includes(callerPerfil)) return;
    const bar = await this.prisma.barbearia.findUnique({
      where: { codigo: barCodigo },
      select: { barbeiroAlteraPreco: true, barbeiroCriaServico: true },
    });
    if (!bar?.[flag]) throw new ForbiddenException(mensagem);
  }
}
