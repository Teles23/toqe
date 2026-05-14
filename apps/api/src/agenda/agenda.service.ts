import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigJornadaDto } from './dto/config-jornada.dto';
import { CreateBloqueioDto } from './dto/create-bloqueio.dto';
import {
  addMinutes,
  parse,
  format,
  isBefore,
  isAfter,
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

  async getJornada(barbeiroId: number) {
    return this.prisma.jornadaTrabalho.findMany({
      where: { barbeiroId },
      orderBy: { diaSemana: 'asc' },
    });
  }

  async createBloqueio(
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

  async getBloqueios(barbeiroId: number, dataInicio: string, dataFim: string) {
    return this.prisma.bloqueioAgenda.findMany({
      where: {
        barbeiroId,
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
        status: { notIn: ['cancelado', 'no_show'] },
      },
    });

    const blocks = await this.prisma.bloqueioAgenda.findMany({
      where: {
        barbeiroId,
        inicio: { gte: startOfDay(targetDate) },
        fim: { lte: endOfDay(targetDate) },
      },
    });

    const isBusy = (slotStart: Date, slotEnd: Date) => {
      // Almoço
      if (startLunch && endLunch) {
        if (
          (isAfter(slotStart, startLunch) ||
            slotStart.getTime() === startLunch.getTime()) &&
          isBefore(slotStart, endLunch)
        )
          return true;
        if (
          isAfter(slotEnd, startLunch) &&
          (isBefore(slotEnd, endLunch) ||
            slotEnd.getTime() === endLunch.getTime())
        )
          return true;
        if (isBefore(slotStart, startLunch) && isAfter(slotEnd, endLunch))
          return true;
      }

      // Agendamentos
      for (const app of appointments) {
        if (
          (isAfter(slotStart, app.inicio) ||
            slotStart.getTime() === app.inicio.getTime()) &&
          isBefore(slotStart, app.fim)
        )
          return true;
        if (
          isAfter(slotEnd, app.inicio) &&
          (isBefore(slotEnd, app.fim) ||
            slotEnd.getTime() === app.fim.getTime())
        )
          return true;
        if (isBefore(slotStart, app.inicio) && isAfter(slotEnd, app.fim))
          return true;
      }

      // Bloqueios
      for (const blk of blocks) {
        if (
          (isAfter(slotStart, blk.inicio) ||
            slotStart.getTime() === blk.inicio.getTime()) &&
          isBefore(slotStart, blk.fim)
        )
          return true;
        if (
          isAfter(slotEnd, blk.inicio) &&
          (isBefore(slotEnd, blk.fim) ||
            slotEnd.getTime() === blk.fim.getTime())
        )
          return true;
        if (isBefore(slotStart, blk.inicio) && isAfter(slotEnd, blk.fim))
          return true;
      }

      return false;
    };

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
