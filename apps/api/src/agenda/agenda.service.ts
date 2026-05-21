import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigJornadaDto } from './dto/config-jornada.dto';
import { CreateBloqueioDto } from './dto/create-bloqueio.dto';
import { StatusAgendamento } from '../common/constants/agendamento-status';
import { isTimeOverlap } from '../common/utils/date.utils';
import {
  addMinutes,
  parse,
  format,
  isBefore,
  startOfDay,
  endOfDay,
  getDay,
} from 'date-fns';

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
  ) {
    const targetDate = new Date(dateStr);
    const dayOfWeek = getDay(targetDate);

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

    const barbearia = await this.prisma.barbearia.findUnique({
      where: { codigo: barCodigo },
    });
    if (!barbearia) throw new Error('Barbearia not found');

    const interval = barbearia.slotInterval;

    const jornada = await this.prisma.jornadaTrabalho.findFirst({
      where: { barbeiroId, diaSemana: dayOfWeek },
    });

    if (!jornada) return [];

    const parseTime = (timeStr: string) => parse(timeStr, 'HH:mm', targetDate);
    const startWork = parseTime(jornada.inicio);
    const endWork = parseTime(jornada.fim);

    const startLunch = jornada.almocoIni ? parseTime(jornada.almocoIni) : null;
    const endLunch = jornada.almocoFim ? parseTime(jornada.almocoFim) : null;

    const appointments = await this.prisma.agendamento.findMany({
      where: {
        barbeiroId,
        inicio: { gte: startOfDay(targetDate) },
        fim: { lte: endOfDay(targetDate) },
        status: {
          notIn: [StatusAgendamento.CANCELADO, StatusAgendamento.NO_SHOW],
        },
      },
    });

    const blocks = await this.prisma.bloqueioAgenda.findMany({
      where: {
        barbeiroId,
        inicio: { gte: startOfDay(targetDate) },
        fim: { lte: endOfDay(targetDate) },
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
        availableSlots.push(format(currentSlot, 'HH:mm'));
      }

      currentSlot = addMinutes(currentSlot, interval);
    }

    return availableSlots;
  }
}
