import { fromZonedTime } from 'date-fns-tz';

/** Fuso de referência das barbearias. Brasil não tem mais horário de verão (desde 2019). */
export const TIMEZONE_BARBEARIA = 'America/Sao_Paulo';

/**
 * Converte uma data-calendário (`YYYY-MM-DD`, ou ISO completo do qual só a parte
 * da data importa) nos instantes UTC de início e fim daquele dia **no fuso da
 * barbearia** — independente do fuso em que o servidor roda.
 *
 * Resolve o bug de `new Date("YYYY-MM-DD")` (que parseia como UTC) combinado com
 * `startOfDay`/`endOfDay` do date-fns (que usam o fuso local): em servidor com
 * offset negativo isso deslocava o dia em um para trás.
 */
export function rangeDoDia(
  dateInput: string,
  timeZone: string = TIMEZONE_BARBEARIA,
): { inicio: Date; fim: Date } {
  const datePart = dateInput.slice(0, 10);
  return {
    inicio: fromZonedTime(`${datePart} 00:00:00.000`, timeZone),
    fim: fromZonedTime(`${datePart} 23:59:59.999`, timeZone),
  };
}

/**
 * Returns true if [slotStart, slotEnd) overlaps with [rangeStart, rangeEnd).
 * Covers: slot starts inside range, slot ends inside range, slot fully contains range.
 */
export function isTimeOverlap(
  slotStart: Date,
  slotEnd: Date,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  return (
    (slotStart >= rangeStart && slotStart < rangeEnd) ||
    (slotEnd > rangeStart && slotEnd <= rangeEnd) ||
    (slotStart < rangeStart && slotEnd > rangeEnd)
  );
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Returns YYYY-MM-DD string from a UTC date (avoids timezone drift in toISOString) */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function currentMonthRange(): { inicio: Date; fim: Date } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { inicio, fim };
}
