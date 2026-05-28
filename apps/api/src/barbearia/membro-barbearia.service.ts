import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma';
import * as bcrypt from 'bcrypt';
import { ConvidarMembroDto } from './dto/convidar-membro.dto';
import { CriarClienteManualDto } from './dto/criar-cliente-manual.dto';
import { StatusAgendamento } from '../common/constants/agendamento-status';
import { SELECT_USUARIO_PERFIL } from '../common/constants/prisma-selects';
import {
  startOfDay,
  endOfDay,
  currentMonthRange,
} from '../common/utils/date.utils';
import { somarAgendamentos } from '../common/utils/price.utils';

/**
 * Entrada de cliente "rápido" aceita por findOrCreateCliente/upsertClienteUsuario.
 * `email` é opcional: o walk-in (encaixe) pode ser anônimo — nesse caso o servidor
 * gera um e-mail único determinístico (a coluna é @unique NOT NULL).
 */
type ClienteRapidoInput = {
  nome: string;
  email?: string;
  telefone?: string | null;
};

@Injectable()
export class MembroBarbeariaService {
  constructor(private prisma: PrismaService) {}

  async findBarbeiros(barCodigo: number) {
    const hoje = startOfDay(new Date());
    const fimHoje = endOfDay(hoje);
    const { inicio: inicioMes, fim: fimMes } = currentMonthRange();

    const membros = await this.prisma.membroBarbearia.findMany({
      where: { barCodigo, perfil: 'barbeiro' },
      include: { usuario: { select: SELECT_USUARIO_PERFIL } },
    });

    return Promise.all(
      membros.map(async (m) => {
        const [atendimentosHoje, agendamentosMes] = await Promise.all([
          this.prisma.agendamento.count({
            where: {
              barCodigo,
              barbeiroId: m.usrCodigo,
              status: StatusAgendamento.CONCLUIDO,
              inicio: { gte: hoje, lte: fimHoje },
            },
          }),
          this.prisma.agendamento.findMany({
            where: {
              barCodigo,
              barbeiroId: m.usrCodigo,
              status: StatusAgendamento.CONCLUIDO,
              inicio: { gte: inicioMes, lte: fimMes },
            },
            include: { itens: { select: { preco: true } } },
          }),
        ]);

        const faturamentoMes = somarAgendamentos(agendamentosMes);

        return {
          ...m.usuario,
          perfil: m.perfil,
          atendimentosHoje,
          atendimentosMes: agendamentosMes.length,
          faturamentoMes,
          ticketMedio:
            agendamentosMes.length > 0
              ? faturamentoMes / agendamentosMes.length
              : 0,
        };
      }),
    );
  }

  async findClientes(barCodigo: number) {
    const membros = await this.prisma.membroBarbearia.findMany({
      where: { barCodigo, perfil: 'cliente' },
      include: { usuario: { select: SELECT_USUARIO_PERFIL } },
    });

    return Promise.all(
      membros.map(async (m) => {
        const agendamentos = await this.prisma.agendamento.findMany({
          where: {
            barCodigo,
            clienteId: m.usrCodigo,
            status: StatusAgendamento.CONCLUIDO,
          },
          include: {
            itens: {
              select: { preco: true, servico: { select: { nome: true } } },
            },
          },
          orderBy: { inicio: 'desc' },
          take: 50,
        });

        const totalGasto = somarAgendamentos(agendamentos);

        const contagem: Record<string, number> = {};
        agendamentos.forEach((ag) =>
          ag.itens.forEach((it) => {
            contagem[it.servico.nome] = (contagem[it.servico.nome] ?? 0) + 1;
          }),
        );
        const servicoFav =
          Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        return {
          ...m.usuario,
          perfil: m.perfil,
          totalVisitas: agendamentos.length,
          totalGasto,
          ticketMedio:
            agendamentos.length > 0 ? totalGasto / agendamentos.length : 0,
          ultimaVisita: agendamentos[0]?.inicio ?? null,
          servicoFav,
        };
      }),
    );
  }

  async findPessoas(barCodigo: number) {
    const [clientes, contatos] = await Promise.all([
      this.findClientes(barCodigo),
      this.prisma.contato.findMany({
        where: { barCodigo },
        orderBy: { nome: 'asc' },
      }),
    ]);

    const usuarios = clientes.map((c) => ({
      codigo: c.codigo,
      nome: c.nome,
      tipo: 'usuario' as const,
      email: (c.email ?? null) as string | null,
      telefone: c.telefone ?? null,
      avatarUrl: c.avatarUrl ?? null,
      totalVisitas: c.totalVisitas,
      totalGasto: c.totalGasto,
      ticketMedio: c.ticketMedio,
      ultimaVisita:
        c.ultimaVisita instanceof Date
          ? c.ultimaVisita.toISOString()
          : ((c.ultimaVisita as string | null) ?? null),
      servicoFav: (c.servicoFav ?? null) as string | null,
    }));

    const contatosPessoas = contatos.map((c) => ({
      codigo: c.codigo,
      nome: c.nome,
      tipo: 'contato' as const,
      email: null,
      telefone: c.telefone ?? null,
      avatarUrl: null,
      totalVisitas: 0,
      totalGasto: 0,
      ticketMedio: 0,
      ultimaVisita: null,
      servicoFav: null,
    }));

    return [...usuarios, ...contatosPessoas].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }),
    );
  }

  findMembros(barCodigo: number) {
    return this.prisma.membroBarbearia.findMany({
      where: { barCodigo },
      include: { usuario: { select: SELECT_USUARIO_PERFIL } },
      orderBy: { perfil: 'asc' },
    });
  }

  async convidarMembro(
    barCodigo: number,
    dto: ConvidarMembroDto,
    callerPerfil: string,
  ) {
    // Gerente não pode criar outro dono — somente o dono pode fazer isso
    if (callerPerfil === 'gerente' && dto.perfil === 'dono') {
      throw new ForbiddenException(
        'Gerente não tem permissão para convidar um dono',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (!usuario)
      throw new NotFoundException(
        `Usuário com e-mail '${dto.email}' não encontrado`,
      );

    const jaEMembro = await this.prisma.membroBarbearia.findUnique({
      where: { barCodigo_usrCodigo: { barCodigo, usrCodigo: usuario.codigo } },
    });
    if (jaEMembro)
      throw new ConflictException('Usuário já é membro desta barbearia');

    // Enforcement: se perfil=barbeiro, checar limite do plano
    if (dto.perfil === 'barbeiro') {
      const barbearia = await this.prisma.barbearia.findUniqueOrThrow({
        where: { codigo: barCodigo },
        select: { plano: true },
      });
      const limite = await this.prisma.planoLimite.findUnique({
        where: { plano: barbearia.plano },
        select: { maxBarbeiros: true },
      });
      if (limite?.maxBarbeiros != null) {
        const qtd = await this.prisma.membroBarbearia.count({
          where: { barCodigo, perfil: 'barbeiro' },
        });
        if (qtd >= limite.maxBarbeiros) {
          throw new ForbiddenException(
            `Limite de ${limite.maxBarbeiros} barbeiro(s) atingido para o plano ${barbearia.plano}`,
          );
        }
      }
    }

    return this.prisma.membroBarbearia.create({
      data: { barCodigo, usrCodigo: usuario.codigo, perfil: dto.perfil },
      include: {
        usuario: { select: { codigo: true, nome: true, email: true } },
      },
    });
  }

  async removerMembro(barCodigo: number, usrCodigo: number) {
    const membro = await this.prisma.membroBarbearia.findUnique({
      where: { barCodigo_usrCodigo: { barCodigo, usrCodigo } },
    });
    if (!membro)
      throw new NotFoundException('Membro não encontrado nesta barbearia');
    if (membro.perfil === 'dono')
      throw new BadRequestException(
        'Não é possível remover o dono da barbearia',
      );

    return this.prisma.membroBarbearia.delete({
      where: { barCodigo_usrCodigo: { barCodigo, usrCodigo } },
    });
  }

  async criarCliente(barCodigo: number, dto: CriarClienteManualDto) {
    const { usuario, jaEraMembro } = await this.upsertClienteUsuario(
      barCodigo,
      dto,
    );

    if (jaEraMembro)
      throw new ConflictException('Usuário já é cliente desta barbearia');

    return this.prisma.membroBarbearia.create({
      data: { barCodigo, usrCodigo: usuario.codigo, perfil: 'cliente' },
      include: {
        usuario: { select: { codigo: true, nome: true, email: true } },
      },
    });
  }

  /**
   * Versão idempotente usada pelos fluxos de booking público e walk-in.
   *
   * Diferente de `criarCliente`, NÃO lança se o usuário já estiver vinculado
   * à barbearia — apenas retorna o membro existente. Permite que clientes
   * recorrentes voltem a agendar sem fricção.
   *
   * Aceita um `tx` opcional para participar de uma transação maior (ex.: o
   * walk-in cria cliente + agendamento atomicamente — se o agendamento falha,
   * o cliente recém-criado é desfeito junto).
   */
  async findOrCreateCliente(
    barCodigo: number,
    dto: ClienteRapidoInput,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const { usuario } = await this.upsertClienteUsuario(barCodigo, dto, tx);

    const jaMembro = await tx.membroBarbearia.findUnique({
      where: { barCodigo_usrCodigo: { barCodigo, usrCodigo: usuario.codigo } },
      include: {
        usuario: { select: { codigo: true, nome: true, email: true } },
      },
    });
    if (jaMembro) return jaMembro;

    return tx.membroBarbearia.create({
      data: { barCodigo, usrCodigo: usuario.codigo, perfil: 'cliente' },
      include: {
        usuario: { select: { codigo: true, nome: true, email: true } },
      },
    });
  }

  private async upsertClienteUsuario(
    barCodigo: number,
    dto: ClienteRapidoInput,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    // Walk-in anônimo (sem e-mail): gera um único determinístico — a coluna é
    // @unique NOT NULL. Com e-mail informado, mantém o dedup (cliente recorrente).
    const email =
      dto.email ??
      `encaixe-${barCodigo}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}@toqe.internal`;

    let usuario = dto.email
      ? await tx.usuario.findUnique({ where: { email: dto.email } })
      : null;

    if (!usuario) {
      const tempSenha = Math.random().toString(36).slice(-10);
      const senhaHash = await bcrypt.hash(tempSenha, await bcrypt.genSalt());
      try {
        usuario = await tx.usuario.create({
          data: {
            nome: dto.nome,
            email,
            telefone: dto.telefone ?? null,
            senhaHash,
          },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw new ConflictException(
            'Este telefone já está cadastrado para outro cliente',
          );
        }
        throw e;
      }
    }

    const jaEraMembro = await tx.membroBarbearia.findUnique({
      where: { barCodigo_usrCodigo: { barCodigo, usrCodigo: usuario.codigo } },
    });

    return { usuario, jaEraMembro: jaEraMembro !== null };
  }
}
