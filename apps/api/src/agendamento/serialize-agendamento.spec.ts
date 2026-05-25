import {
  serializeAgendamento,
  serializeAgendamentos,
} from './serialize-agendamento';

const rawAgendamento = () => ({
  codigo: 1,
  status: 'concluido',
  inicio: new Date('2026-05-10T14:00:00.000Z'),
  fim: new Date('2026-05-10T14:30:00.000Z'),
  tipo: 'AGENDADO',
  cliente: {
    codigo: 42,
    nome: 'João',
    email: 'joao@x.com',
    telefone: '+5511999999999',
  },
  contato: null,
  barbeiro: { codigo: 99, nome: 'Carlos', avatarUrl: 'http://a/x.png' },
  barbearia: { codigo: 1, nome: 'Urban Barber' },
  itens: [{ codigo: 1, preco: 40 }],
});

const rawWalkIn = () => ({
  codigo: 2,
  status: 'pendente',
  inicio: new Date('2026-05-10T15:00:00.000Z'),
  fim: new Date('2026-05-10T15:30:00.000Z'),
  tipo: 'WALK_IN',
  cliente: null,
  contato: { codigo: 99, nome: 'Encaixe', telefone: '+5511888881111' },
  barbeiro: { codigo: 99, nome: 'Carlos', avatarUrl: null },
  barbearia: { codigo: 1, nome: 'Urban Barber' },
  itens: [],
});

describe('serializeAgendamento', () => {
  it('mapeia cliente.codigo → usrCodigo, tipo="usuario", expõe email (TQE_USR)', () => {
    const r = serializeAgendamento(rawAgendamento());
    expect(r.cliente).toEqual({
      usrCodigo: 42,
      nome: 'João',
      telefone: '+5511999999999',
      tipo: 'usuario',
      email: 'joao@x.com',
    });
  });

  it('walk-in: contato.codigo → usrCodigo, tipo="contato", email=null (TQE_CONTATO)', () => {
    const r = serializeAgendamento(rawWalkIn());
    expect(r.cliente).toEqual({
      usrCodigo: 99,
      nome: 'Encaixe',
      telefone: '+5511888881111',
      tipo: 'contato',
      email: null,
    });
  });

  it('campo contato não aparece na resposta pública (absorvido em cliente)', () => {
    const r = serializeAgendamento(rawWalkIn()) as Record<string, unknown>;
    expect(r).not.toHaveProperty('contato');
  });

  it('mapeia barbeiro.codigo → usrCodigo e mantém avatarUrl', () => {
    const r = serializeAgendamento(rawAgendamento());
    expect(r.barbeiro).toEqual({
      usrCodigo: 99,
      nome: 'Carlos',
      avatarUrl: 'http://a/x.png',
    });
  });

  it('preserva os demais campos (codigo, status, itens, barbearia)', () => {
    const r = serializeAgendamento(rawAgendamento());
    expect(r.codigo).toBe(1);
    expect(r.status).toBe('concluido');
    expect(r.itens).toEqual([{ codigo: 1, preco: 40 }]);
    expect(r.barbearia).toEqual({ codigo: 1, nome: 'Urban Barber' });
  });

  it('normaliza itens.preco/duracao Decimal-string → number (evita "R$ 035")', () => {
    const raw = {
      codigo: 9,
      itens: [
        { codigo: 1, preco: '35', duracao: '30' },
        { codigo: 2, preco: '20.5', duracao: '15' },
      ],
    };
    const r = serializeAgendamento(raw as never);
    expect(r).toMatchObject({
      itens: [
        { codigo: 1, preco: 35, duracao: 30 },
        { codigo: 2, preco: 20.5, duracao: 15 },
      ],
    });
  });

  it('normaliza telefone ausente para null (usuario)', () => {
    const raw = rawAgendamento();
    (raw.cliente as { telefone: string | null }).telefone = null;
    const r = serializeAgendamento(raw);
    expect(r.cliente?.telefone).toBeNull();
  });

  it('normaliza telefone ausente para null (contato)', () => {
    const raw = rawWalkIn();
    (raw.contato as { telefone: string | null }).telefone = null;
    const r = serializeAgendamento(raw as never) as {
      cliente: { telefone: string | null } | null;
    };
    expect(r.cliente?.telefone).toBeNull();
  });

  it('retorna null quando o agendamento é null (proximo/atual)', () => {
    expect(serializeAgendamento(null)).toBeNull();
  });

  it('é robusto a cliente/barbeiro ausentes (sem crash)', () => {
    const r = serializeAgendamento({ codigo: 7 } as never);
    expect(r.codigo).toBe(7);
    expect(r.cliente).toBeNull();
  });
});

describe('serializeAgendamentos', () => {
  it('mapeia cada item da lista', () => {
    const list = serializeAgendamentos([rawAgendamento(), rawAgendamento()]);
    expect(list).toHaveLength(2);
    expect(list[0].cliente).toMatchObject({
      usrCodigo: 42,
      nome: 'João',
      tipo: 'usuario',
    });
  });

  it('lista vazia → vazia', () => {
    expect(serializeAgendamentos([])).toEqual([]);
  });
});
