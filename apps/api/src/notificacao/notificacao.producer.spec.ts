import type { Queue } from 'bull';
import {
  NotificacaoProducer,
  AGENDAMENTO_CONFIRMADO,
} from './notificacao.producer';
import { AgendamentoConfirmadoJob } from './notificacao.types';

describe('NotificacaoProducer', () => {
  let producer: NotificacaoProducer;
  const mockQueue = { add: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    producer = new NotificacaoProducer(mockQueue as unknown as Queue);
  });

  it('should call queue.add with correct arguments on agendamentoConfirmado', async () => {
    const data: AgendamentoConfirmadoJob = {
      agendamentoCodigo: 1,
      clienteNome: 'João',
      clienteEmail: 'joao@email.com',
      barbeiroNome: 'Pedro',
      barbeariaNome: 'Barber Shop',
      servicos: ['Corte'],
      inicio: '2025-01-01T10:00:00Z',
      fim: '2025-01-01T11:00:00Z',
    };

    await producer.agendamentoConfirmado(data);

    expect(mockQueue.add).toHaveBeenCalledWith(AGENDAMENTO_CONFIRMADO, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  });

  it('should propagate queue errors', async () => {
    mockQueue.add.mockRejectedValueOnce(new Error('Queue error'));

    await expect(
      producer.agendamentoConfirmado({} as unknown as AgendamentoConfirmadoJob),
    ).rejects.toThrow('Queue error');
  });
});
