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
import { PrismaService } from '../prisma/prisma.service';
import { AgendamentoConfirmadoJob, ConviteEmailJob } from './notificacao.types';
import type { Job } from 'bull';

const mockNotificacaoService = {
  enviarConfirmacaoAgendamento: jest.fn().mockResolvedValue(undefined),
  enviarConviteEmail: jest.fn().mockResolvedValue(undefined),
};

const mockPushService = {
  send: jest.fn().mockResolvedValue(undefined),
};

const agBase = {
  codigo: 1,
  inicio: new Date('2026-05-25T10:00:00.000Z'),
  fim: new Date('2026-05-25T11:00:00.000Z'),
  barCodigo: 5,
  cliente: { nome: 'João', email: 'joao@example.com' },
  contato: null,
  barbeiro: { nome: 'Pedro' },
  barbearia: { nome: 'BarberShop' },
  itens: [{ servico: { nome: 'Corte' } }],
};

const mockPrisma = {
  agendamento: {
    findUnique: jest.fn().mockResolvedValue(agBase),
  },
};

function makeJob(
  data: Partial<AgendamentoConfirmadoJob>,
): Job<AgendamentoConfirmadoJob> {
  return {
    id: 'test-job-1',
    data: {
      agendamentoCodigo: 1,
      clienteUsrCodigo: 10,
      barbeiroUsrCodigo: 20,
      barCodigo: 5,
      ...data,
    },
  } as unknown as Job<AgendamentoConfirmadoJob>;
}

describe('NotificacaoConsumer', () => {
  let consumer: NotificacaoConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.agendamento.findUnique.mockResolvedValue(agBase);
    consumer = new NotificacaoConsumer(
      mockNotificacaoService as unknown as NotificacaoService,
      mockPushService as unknown as PushNotificationService,
      mockPrisma as unknown as PrismaService,
    );
  });

  it('processa job corretamente: busca do DB, envia email, push ao cliente e push ao barbeiro', async () => {
    const job = makeJob({});

    await consumer.handleAgendamentoConfirmado(job);

    expect(mockPrisma.agendamento.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { codigo: 1 } }),
    );
    expect(
      mockNotificacaoService.enviarConfirmacaoAgendamento,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        agendamentoCodigo: 1,
        clienteEmail: 'joao@example.com',
        clienteNome: 'João',
        barbeiroNome: 'Pedro',
        barbeariaNome: 'BarberShop',
        servicos: ['Corte'],
      }),
    );
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
    const job = makeJob({ barCodigo: 99 });
    mockPrisma.agendamento.findUnique.mockResolvedValue({
      ...agBase,
      barCodigo: 99,
      inicio: new Date('2026-06-01T14:30:00.000Z'),
      fim: new Date('2026-06-01T15:00:00.000Z'),
    });

    await consumer.handleAgendamentoConfirmado(job);

    expect(mockPushService.send).toHaveBeenCalledWith(
      20,
      'Novo agendamento!',
      expect.any(String),
      { barCodigo: 99, dataAgendamento: '2026-06-01T14:30:00.000Z' },
    );
  });

  it('ignora job silenciosamente se agendamento não encontrado no DB', async () => {
    mockPrisma.agendamento.findUnique.mockResolvedValue(null);
    const job = makeJob({});

    await consumer.handleAgendamentoConfirmado(job);

    expect(
      mockNotificacaoService.enviarConfirmacaoAgendamento,
    ).not.toHaveBeenCalled();
    expect(mockPushService.send).not.toHaveBeenCalled();
  });

  it('não envia email se cliente não tem email (walk-in sem conta)', async () => {
    mockPrisma.agendamento.findUnique.mockResolvedValue({
      ...agBase,
      cliente: null,
      contato: { nome: 'Visitante' },
    });
    const job = makeJob({ clienteUsrCodigo: undefined });

    await consumer.handleAgendamentoConfirmado(job);

    expect(
      mockNotificacaoService.enviarConfirmacaoAgendamento,
    ).not.toHaveBeenCalled();
    // push ao barbeiro ainda ocorre
    expect(mockPushService.send).toHaveBeenCalledTimes(1);
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
    expect(mockPushService.send).not.toHaveBeenCalled();
  });
});
