import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigJornadaDto } from './dto/config-jornada.dto';
import { ConfigJornadaSemanalDto } from './dto/config-jornada-semanal.dto';
import { CreateBloqueioDto } from './dto/create-bloqueio.dto';
import { StatusAgendamento } from '../common/constants/agendamento-status';
import {
  isTimeOverlap,
  rangeDoDia,
  TIMEZONE_BARBEARIA,
} from '../common/utils/date.utils';
import { addDays, addMinutes, format, isBefore, startOfDay } from 'date-fns';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class AgendaService {
  constructor(private prisma: PrismaService) {}

  async upsertJornada(
    barbeiroId: number,
    barCodigo: number,
    dto: ConfigJornadaDto,
  ) {
    const existing = await this.prisma.jornadaTrabalho.findFirst({
      where: {
        barbeiroId,
        barCodigo,
        diaSemana: dto.diaSemana,
      },
    });

    if (existing) {
      return this.prisma.jornadaTrabalho.update({
        where: { codigo: existing.codigo },
        data: dto,
      });
    }

    return this.prisma.jornadaTrabalho.create({
      data: {
        ...dto,
        barbeiroId,
        barCodigo,
      },
    });
  }

  /**
   * Salva a jornada semanal inteira numa ÚNICA transação (slide 15): dias
   * ativos criam/atualizam o registro; dias inativos (folga) removem o registro
   * do dia. Se qualquer passo falha, nada é persistido — a semana fica íntegra.
   */
  async upsertJornadaSemanal(
    barbeiroId: number,
    barCodigo: number,
    dto: ConfigJornadaSemanalDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      for (const dia of dto.dias) {
        if (dia.ativo) {
          const data = {
            diaSemana: dia.diaSemana,
            inicio: dia.inicio,
            fim: dia.fim,
            almocoIni: dia.almocoIni,
            almocoFim: dia.almocoFim,
          };
          const existing = await tx.jornadaTrabalho.findFirst({
            where: { barbeiroId, barCodigo, diaSemana: dia.diaSemana },
          });
          if (existing) {
            await tx.jornadaTrabalho.update({
              where: { codigo: existing.codigo },
              data,
            });
          } else {
            await tx.jornadaTrabalho.create({
              data: { ...data, barbeiroId, barCodigo },
            });
          }
        } else {
          // Folga: remove o registro do dia (se existir).
          await tx.jornadaTrabalho.deleteMany({
            where: { barbeiroId, barCodigo, diaSemana: dia.diaSemana },
          });
        }
      }

      return tx.jornadaTrabalho.findMany({
        where: { barbeiroId, barCodigo },
        orderBy: { diaSemana: 'asc' },
      });
    });
  }

  getJornada(barbeiroId: number, barCodigo: number) {
    // barCodigo garante isolamento de tenant: barbeiroId de outro tenant retorna []
    return this.prisma.jornadaTrabalho.findMany({
      where: { barbeiroId, barCodigo },
      orderBy: { diaSemana: 'asc' },
    });
  }

  createBloqueio(
    barbeiroId: number,
    barCodigo: number,
    dto: CreateBloqueioDto,
  ) {
    return this.prisma.bloqueioAgenda.create({
      data: {
        ...dto,
        barbeiroId,
        barCodigo,
        inicio: new Date(dto.inicio),
        fim: new Date(dto.fim),
      },
    });
  }

  getBloqueios(
    barbeiroId: number,
    barCodigo: number,
    dataInicio: string,
    dataFim: string,
  ) {
    // barCodigo garante isolamento de tenant
    return this.prisma.bloqueioAgenda.findMany({
      where: {
        barbeiroId,
        barCodigo,
        inicio: { gte: new Date(dataInicio) },
        fim: { lte: new Date(dataFim) },
      },
    });
  }

  async getAvailableSlots(
    barbeiroId: number,
    barCodigo: number,
    dateStr: string,
    totalDuration: number,
    srvCodigo?: number,
  ) {
    const tz = TIMEZONE_BARBEARIA;
    const datePart = dateStr.slice(0, 10);
    const { inicio: inicioDia, fim: fimDia } = rangeDoDia(dateStr, tz);
    // getDay-compatível (0=Dom..6=Sáb) ancorado no fuso da barbearia
    const dayOfWeek = Number(formatInTimeZone(inicioDia, tz, 'i')) % 7;

    // Valida que barbeiroId pertence ao tenant (barCodigo) — impede cross-tenant leak
    const membroDoTenant = await this.prisma.membroBarbearia.findFirst({
      where: {
        usrCodigo: barbeiroId,
        barCodigo,
        perfil: { in: ['barbeiro', 'dono', 'gerente'] },
      },
    });
    if (!membroDoTenant) {
      throw new NotFoundException('Barbeiro não encontrado nesta barbearia');
    }

    // Se um serviço foi informado e o barbeiro o DESATIVOU (TQE_BARBEIRO_SERVICO
    // ativo=false), ele não realiza esse serviço → sem slots. Sem registro =
    // realiza com os valores base (segue normalmente).
    if (srvCodigo != null) {
      const vinculo = await this.prisma.barbeiroServico.findUnique({
        where: { barbeiroId_srvCodigo: { barbeiroId, srvCodigo } },
      });
      if (vinculo && !vinculo.ativo) return [];
    }

    const barbearia = await this.prisma.barbearia.findUnique({
      where: { codigo: barCodigo },
    });
    if (!barbearia) throw new Error('Barbearia not found');

    const interval = barbearia.slotInterval;

    const jornada = await this.prisma.jornadaTrabalho.findFirst({
      where: { barbeiroId, barCodigo, diaSemana: dayOfWeek },
    });

    if (!jornada) return [];

    const parseTime = (timeStr: string) =>
      fromZonedTime(`${datePart} ${timeStr}:00`, tz);
    const startWork = parseTime(jornada.inicio);
    const endWork = parseTime(jornada.fim);

    const startLunch = jornada.almocoIni ? parseTime(jornada.almocoIni) : null;
    const endLunch = jornada.almocoFim ? parseTime(jornada.almocoFim) : null;

    const appointments = await this.prisma.agendamento.findMany({
      where: {
        barbeiroId,
        barCodigo,
        inicio: { gte: inicioDia },
        fim: { lte: fimDia },
        status: {
          notIn: [StatusAgendamento.CANCELADO, StatusAgendamento.NO_SHOW],
        },
      },
    });

    const blocks = await this.prisma.bloqueioAgenda.findMany({
      where: {
        barbeiroId,
        barCodigo,
        inicio: { gte: inicioDia },
        fim: { lte: fimDia },
      },
    });

    const isBusy = (slotStart: Date, slotEnd: Date): boolean =>
      (startLunch !== null &&
        endLunch !== null &&
        isTimeOverlap(slotStart, slotEnd, startLunch, endLunch)) ||
      appointments.some((a) =>
        isTimeOverlap(slotStart, slotEnd, a.inicio, a.fim),
      ) ||
      blocks.some((b) => isTimeOverlap(slotStart, slotEnd, b.inicio, b.fim));

    const availableSlots: string[] = [];
    let currentSlot = startWork;

    while (
      isBefore(addMinutes(currentSlot, totalDuration), endWork) ||
      addMinutes(currentSlot, totalDuration).getTime() === endWork.getTime()
    ) {
      const slotEnd = addMinutes(currentSlot, totalDuration);

      if (!isBusy(currentSlot, slotEnd)) {
        availableSlots.push(formatInTimeZone(currentSlot, tz, 'HH:mm'));
      }

      currentSlot = addMinutes(currentSlot, interval);
    }

    return availableSlots;
  }

  /**
   * Retorna os próximos slots disponíveis nos próximos `dias` dias para a barbearia.
   * Itera por barbeiro e dia até encontrar até 6 slots disponíveis.
   */
  async getProximosSlots(
    barCodigo: number,
    dias: number,
  ): Promise<{
    barbeiroNome: string;
    barbeiroInicial: string;
    servicoNome: string;
    servicoDuracao: number;
    servicoPreco: number;
    slots: { inicio: string; hora: string; dia: string }[];
  }> {
    const barbeiros = await this.prisma.membroBarbearia.findMany({
      where: { barCodigo, perfil: { in: ['barbeiro', 'dono', 'gerente'] } },
      include: { usuario: { select: { codigo: true, nome: true } } },
      orderBy: { usuario: { nome: 'asc' } },
    });

    if (barbeiros.length === 0) {
      throw new NotFoundException('Nenhum barbeiro ativo nesta barbearia');
    }

    // Busca o primeiro serviço ativo para referência
    const servico = await this.prisma.servico.findFirst({
      where: { barCodigo, ativo: true },
      orderBy: { codigo: 'asc' },
    });

    const servicoNome = servico?.nome ?? 'Corte';
    const servicoDuracao = servico?.duracaoBase ?? 30;
    const servicoPreco = servico?.precoBase
      ? Number(servico.precoBase) * 100
      : 0;

    const hoje = new Date();
    const slots: { inicio: string; hora: string; dia: string }[] = [];
    const MAX_SLOTS = 6;

    for (
      let diaOffset = 0;
      diaOffset <= dias && slots.length < MAX_SLOTS;
      diaOffset++
    ) {
      const targetDate = addDays(startOfDay(hoje), diaOffset);
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      const diaLabel =
        diaOffset === 0 ? 'Hoje' : diaOffset === 1 ? 'Amanhã' : dateStr;

      for (const membro of barbeiros) {
        if (slots.length >= MAX_SLOTS) break;

        const horariosDisponiveis = await this.getAvailableSlots(
          membro.usuario.codigo,
          barCodigo,
          dateStr,
          servicoDuracao,
        );

        for (const horario of horariosDisponiveis) {
          if (slots.length >= MAX_SLOTS) break;
          const [hora, minuto] = horario.split(':').map(Number);
          const inicioDate = new Date(targetDate);
          inicioDate.setHours(hora, minuto, 0, 0);
          slots.push({
            inicio: inicioDate.toISOString(),
            hora: horario,
            dia: diaLabel,
          });
        }
      }
    }

    if (slots.length === 0) {
      throw new NotFoundException('Nenhum slot disponível nos próximos dias');
    }

    const primeiroBarbeiro = barbeiros[0].usuario;

    return {
      barbeiroNome: primeiroBarbeiro.nome,
      barbeiroInicial: primeiroBarbeiro.nome.charAt(0).toUpperCase(),
      servicoNome,
      servicoDuracao,
      servicoPreco: Math.round(servicoPreco),
      slots,
    };
  }
}
