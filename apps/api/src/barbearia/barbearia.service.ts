import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarbeariaDto } from './dto/create-barbearia.dto';
import { ConvidarMembroDto } from './dto/convidar-membro.dto';
import { UpdateBarbeariaDto } from './dto/update-barbearia.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';
import { StatusAgendamento } from '../common/constants/agendamento-status';
import { SELECT_USUARIO_PERFIL } from '../common/constants/prisma-selects';
import {
  startOfDay,
  endOfDay,
  currentMonthRange,
} from '../common/utils/date.utils';
import { somarAgendamentos } from '../common/utils/price.utils';

@Injectable()
export class BarbeariaService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBarbeariaDto, usrCodigo: number) {
    const existing = await this.prisma.barbearia.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new ConflictException('Slug já está em uso');

    return this.prisma.$transaction(async (tx) => {
      const barbearia = await tx.barbearia.create({
        data: { nome: dto.nome, slug: dto.slug },
      });
      await tx.membroBarbearia.create({
        data: { barCodigo: barbearia.codigo, usrCodigo, perfil: 'dono' },
      });
      return barbearia;
    });
  }

  async findOne(barCodigo: number) {
    const barbearia = await this.prisma.barbearia.findUnique({
      where: { codigo: barCodigo },
      include: { tema: true },
    });
    if (!barbearia) throw new NotFoundException('Barbearia não encontrada');
    return barbearia;
  }

  async update(barCodigo: number, dto: UpdateBarbeariaDto) {
    await this.findOne(barCodigo);

    if (dto.slug) {
      const existing = await this.prisma.barbearia.findFirst({
        where: { slug: dto.slug, codigo: { not: barCodigo } },
      });
      if (existing) throw new ConflictException('Slug já está em uso');
    }

    return this.prisma.barbearia.update({
      where: { codigo: barCodigo },
      data: dto,
    });
  }

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
        });

        const totalGasto = somarAgendamentos(agendamentos);

        // Serviço favorito: o mais frequente nos itens
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

  async findMembros(barCodigo: number) {
    return this.prisma.membroBarbearia.findMany({
      where: { barCodigo },
      include: { usuario: { select: SELECT_USUARIO_PERFIL } },
      orderBy: { perfil: 'asc' },
    });
  }

  async convidarMembro(barCodigo: number, dto: ConvidarMembroDto) {
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

    return this.prisma.membroBarbearia.create({
      data: { barCodigo, usrCodigo: usuario.codigo, perfil: dto.perfil },
      include: {
        usuario: { select: { codigo: true, nome: true, email: true } },
      },
    });
  }

  async getTema(barCodigo: number) {
    const tema = await this.prisma.temaTenant.findUnique({
      where: { barCodigo },
    });
    return (
      tema ?? {
        barCodigo,
        corPrimaria: null,
        corFundo: null,
        logoUrl: null,
        subdominio: null,
      }
    );
  }

  async upsertTema(barCodigo: number, dto: UpdateTemaDto) {
    return this.prisma.temaTenant.upsert({
      where: { barCodigo },
      update: dto,
      create: { barCodigo, ...dto },
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
}
