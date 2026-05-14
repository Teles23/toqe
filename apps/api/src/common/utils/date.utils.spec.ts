import {
  isTimeOverlap,
  startOfDay,
  endOfDay,
  toDateString,
  currentMonthRange,
} from './date.utils';

const d = (h: number, m = 0) => new Date(2025, 0, 6, h, m, 0);

describe('isTimeOverlap', () => {
  it('slot que começa dentro do range conflita', () => {
    expect(isTimeOverlap(d(9, 15), d(9, 45), d(9, 0), d(9, 30))).toBe(true);
  });

  it('slot que termina dentro do range conflita', () => {
    expect(isTimeOverlap(d(8, 45), d(9, 15), d(9, 0), d(9, 30))).toBe(true);
  });

  it('slot que contém o range conflita', () => {
    expect(isTimeOverlap(d(8, 0), d(10, 0), d(9, 0), d(9, 30))).toBe(true);
  });

  it('slot exatamente no início do range conflita', () => {
    expect(isTimeOverlap(d(9, 0), d(9, 30), d(9, 0), d(9, 30))).toBe(true);
  });

  it('slot antes do range não conflita', () => {
    expect(isTimeOverlap(d(8, 0), d(9, 0), d(9, 0), d(9, 30))).toBe(false);
  });

  it('slot depois do range não conflita', () => {
    expect(isTimeOverlap(d(9, 30), d(10, 0), d(9, 0), d(9, 30))).toBe(false);
  });
});

describe('startOfDay', () => {
  it('retorna cópia com horas zeradas', () => {
    const original = new Date(2025, 0, 6, 14, 30, 0);
    const result = startOfDay(original);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(original.getHours()).toBe(14);
  });
});

describe('endOfDay', () => {
  it('retorna cópia com 23:59:59.999', () => {
    const result = endOfDay(new Date(2025, 0, 6, 8, 0, 0));
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });
});

describe('toDateString', () => {
  it('retorna YYYY-MM-DD da data UTC', () => {
    const date = new Date('2025-01-06T15:00:00Z');
    expect(toDateString(date)).toBe('2025-01-06');
  });
});

describe('currentMonthRange', () => {
  it('retorna início no dia 1 do mês corrente', () => {
    const { inicio } = currentMonthRange();
    expect(inicio.getDate()).toBe(1);
    expect(inicio.getHours()).toBe(0);
  });

  it('retorna fim com 23:59:59.999', () => {
    const { fim } = currentMonthRange();
    expect(fim.getHours()).toBe(23);
    expect(fim.getMinutes()).toBe(59);
    expect(fim.getSeconds()).toBe(59);
  });
});
