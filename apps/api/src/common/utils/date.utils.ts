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
