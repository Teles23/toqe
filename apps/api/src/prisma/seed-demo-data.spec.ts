import { buildAgendamentosDemo } from '../../prisma/seed-demo-data';
import { StatusAgendamento } from '../common/constants/agendamento-status';

describe('buildAgendamentosDemo (seed de demonstração)', () => {
  const statusValidos = Object.values(StatusAgendamento) as string[];

  it('usa apenas status existentes no enum StatusAgendamento', () => {
    const lista = buildAgendamentosDemo(new Date(2026, 4, 26, 8, 30));
    for (const ag of lista) {
      expect(statusValidos).toContain(ag.status);
    }
  });

  it('é idempotente: a mesma data de referência produz os mesmos horários', () => {
    const ref = new Date(2026, 4, 26, 3, 0);
    const a = buildAgendamentosDemo(ref).map((x) => x.inicio.toISOString());
    const b = buildAgendamentosDemo(ref).map((x) => x.inicio.toISOString());
    expect(a).toEqual(b);
  });

  it('não usa horário relativo ao "agora": chamadas em momentos diferentes do mesmo dia coincidem', () => {
    const manha = buildAgendamentosDemo(new Date(2026, 4, 26, 6, 0));
    const noite = buildAgendamentosDemo(new Date(2026, 4, 26, 22, 0));
    expect(manha.map((x) => x.inicio.toISOString())).toEqual(
      noite.map((x) => x.inicio.toISOString()),
    );
  });

  it('gera 3 agendamentos com chave (barbeiro + inicio) única — sem colisão de dedup', () => {
    const lista = buildAgendamentosDemo(new Date(2026, 4, 26, 12, 0));
    expect(lista).toHaveLength(3);
    const chaves = lista.map(
      (x) => `${x.barbeiroEmail}@${x.inicio.toISOString()}`,
    );
    expect(new Set(chaves).size).toBe(3);
  });

  it('ancora os horários no início do dia da referência (sem componente de minuto/segundo)', () => {
    const lista = buildAgendamentosDemo(new Date(2026, 4, 26, 17, 45, 12));
    for (const ag of lista) {
      expect(ag.inicio.getMinutes()).toBe(0);
      expect(ag.inicio.getSeconds()).toBe(0);
    }
  });
});
