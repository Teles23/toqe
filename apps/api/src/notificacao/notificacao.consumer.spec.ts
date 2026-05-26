// expo-server-sdk usa ESM — mock antes de qualquer import que o referencie
jest.mock('expo-server-sdk', () => {
  const Expo = jest.fn().mockImplementation(() => ({}));
  (Expo as unknown as { isExpoPushToken: () => boolean }).isExpoPushToken =
    jest.fn(() => true);
  return { Expo };
});

import { NotificacaoConsumer } from './notificacao.consumer';
import { NotificacaoService } from './notificacao.service';
import { PushNotificationService } from '../push-token/push-notification.service';
import { AgendamentoConfirmadoJob, ConviteEmailJob } from './notificacao.types';
import type { Job } from 'bull';

const mockNotificacaoService = {
  enviarConfirmacaoAgendamento: jest.fn().mockResolvedValue(undefined),
  enviarConviteEmail: jest.fn().mockResolvedValue(undefined),
};

const mockPushService = {
  send: jest.fn().mockResolvedValue(undefined),
};

function makeJob(
  data: Partial<AgendamentoConfirmadoJob>,
): Job<AgendamentoConfirmadoJob> {
  return {
    id: 'test-job-1',
    data: {
      agendamentoCodigo: 1,
      clienteNome: 'João',
      clienteEmail: 'joao@example.com',
      clienteUsrCodigo: 10,
      barbeiroUsrCodigo: 20,
      barCodigo: 5,
      barbeiroNome: 'Pedro',
      barbeariaNome: 'BarberShop',
      inicio: '2026-05-25T10:00:00.000Z',
      fim: '2026-05-25T11:00:00.000Z',
      servicos: ['Corte'],
      ...data,
    },
  } as unknown as Job<AgendamentoConfirmadoJob>;
}

describe('NotificacaoConsumer', () => {
  let consumer: NotificacaoConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new NotificacaoConsumer(
      mockNotificacaoService as unknown as NotificacaoService,
      mockPushService as unknown as PushNotificationService,
    );
  });

  it('processa job corretamente: envia email, push ao cliente e push ao barbeiro', async () => {
    const job = makeJob({});

    await consumer.handleAgendamentoConfirmado(job);

    expect(
      mockNotificacaoService.enviarConfirmacaoAgendamento,
    ).toHaveBeenCalledWith(job.data);
    expect(mockPushService.send).toHaveBeenCalledWith(
      10,
      'Agendamento confirmado!',
      expect.stringContaining('BarberShop'),
    );
    expect(mockPushService.send).toHaveBeenCalledWith(
      20,
      'Novo agendamento!',
      expect.stringContaining('João'),
      expect.objectContaining({
        barCodigo: 5,
        dataAgendamento: '2026-05-25T10:00:00.000Z',
      }),
    );
  });

  it('não envia push ao cliente se clienteUsrCodigo ausente', async () => {
    const job = makeJob({ clienteUsrCodigo: undefined });

    await consumer.handleAgendamentoConfirmado(job);

    expect(mockPushService.send).toHaveBeenCalledTimes(1);
    expect(mockPushService.send).toHaveBeenCalledWith(
      20,
      'Novo agendamento!',
      expect.any(String),
      expect.any(Object),
    );
  });

  it('não envia push ao barbeiro se barbeiroUsrCodigo ausente', async () => {
    const job = makeJob({ barbeiroUsrCodigo: undefined });

    await consumer.handleAgendamentoConfirmado(job);

    expect(mockPushService.send).toHaveBeenCalledTimes(1);
    expect(mockPushService.send).toHaveBeenCalledWith(
      10,
      'Agendamento confirmado!',
      expect.any(String),
    );
  });

  it('envia data payload correto ao barbeiro com barCodigo e dataAgendamento', async () => {
    const job = makeJob({ barCodigo: 99, inicio: '2026-06-01T14:30:00.000Z' });

    await consumer.handleAgendamentoConfirmado(job);

    expect(mockPushService.send).toHaveBeenCalledWith(
      20,
      'Novo agendamento!',
      expect.any(String),
      { barCodigo: 99, dataAgendamento: '2026-06-01T14:30:00.000Z' },
    );
  });

  it('handleSendConvite delega ao service.enviarConviteEmail com o payload do job', async () => {
    const data: ConviteEmailJob = {
      email: 'novo@example.com',
      conviteLink: 'https://app.toqe.com.br/convite?token=abc',
      barbeariaNome: 'BarberShop',
      perfil: 'barbeiro',
    };
    const job = {
      id: 'convite-1',
      data,
    } as unknown as Job<ConviteEmailJob>;

    await consumer.handleSendConvite(job);

    expect(mockNotificacaoService.enviarConviteEmail).toHaveBeenCalledWith(
      data,
    );
    // convite não dispara push
    expect(mockPushService.send).not.toHaveBeenCalled();
  });
});
