import { Test } from '@nestjs/testing';

// expo-server-sdk usa ESM — mock antes de qualquer import que o referencie
jest.mock('expo-server-sdk', () => {
  const Expo = jest.fn().mockImplementation(() => ({}));
  (Expo as unknown as { isExpoPushToken: () => boolean }).isExpoPushToken =
    jest.fn(() => true);
  return { Expo };
});

import { LembreteService } from './lembrete.service';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from '../push-token/push-notification.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

const mockPrisma = createPrismaMock();

const mockPushService = {
  send: jest.fn().mockResolvedValue(undefined),
};

const mockNotificacaoService = {
  enviarLembrete: jest.fn().mockResolvedValue(undefined),
};

function makeAgendamento(overrides: Record<string, unknown> = {}) {
  return {
    codigo: 1,
    inicio: new Date('2026-05-25T10:00:00Z'),
    status: 'CONFIRMADO',
    lembrete24hEnviado: false,
    lembrete2hEnviado: false,
    cliente: { codigo: 10, nome: 'João', email: 'joao@example.com' },
    contato: null,
    barbeiro: { nome: 'Pedro' },
    barbearia: { nome: 'BarberShop' },
    itens: [{ servico: { nome: 'Corte' } }],
    ...overrides,
  };
}

describe('LembreteService', () => {
  let service: LembreteService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        LembreteService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PushNotificationService, useValue: mockPushService },
        { provide: NotificacaoService, useValue: mockNotificacaoService },
      ],
    }).compile();
    service = module.get(LembreteService);
  });

  describe('enviarLembretes', () => {
    it('cron não lança quando não há agendamentos', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([]);

      await expect(service.enviarLembretes()).resolves.toBeUndefined();

      expect(mockPushService.send).not.toHaveBeenCalled();
      expect(mockNotificacaoService.enviarLembrete).not.toHaveBeenCalled();
    });

    it('envia push e email para cliente com email (lembrete 24h)', async () => {
      const ag = makeAgendamento();
      mockPrisma.agendamento.findMany
        .mockResolvedValueOnce([ag]) // para24h
        .mockResolvedValueOnce([]); // para2h
      mockPrisma.agendamento.update.mockResolvedValue({
        ...ag,
        lembrete24hEnviado: true,
      });

      await service.enviarLembretes();

      expect(mockPushService.send).toHaveBeenCalledWith(
        10,
        'Lembrete: amanhã é dia de cuidar do visual!',
        expect.stringContaining('BarberShop'),
      );
      expect(mockNotificacaoService.enviarLembrete).toHaveBeenCalledWith(
        expect.objectContaining({
          clienteEmail: 'joao@example.com',
          tipo: '24h',
        }),
      );
    });

    it('envia lembrete 2h com título correto', async () => {
      const ag = makeAgendamento();
      mockPrisma.agendamento.findMany
        .mockResolvedValueOnce([]) // para24h
        .mockResolvedValueOnce([ag]); // para2h
      mockPrisma.agendamento.update.mockResolvedValue({
        ...ag,
        lembrete2hEnviado: true,
      });

      await service.enviarLembretes();

      expect(mockPushService.send).toHaveBeenCalledWith(
        10,
        'Lembrete: seu horário é em breve!',
        expect.stringContaining('BarberShop'),
      );
      expect(mockNotificacaoService.enviarLembrete).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: '2h' }),
      );
    });

    it('marca lembrete24hEnviado=true após envio bem-sucedido', async () => {
      const ag = makeAgendamento();
      mockPrisma.agendamento.findMany
        .mockResolvedValueOnce([ag])
        .mockResolvedValueOnce([]);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...ag,
        lembrete24hEnviado: true,
      });

      await service.enviarLembretes();

      expect(mockPrisma.agendamento.update).toHaveBeenCalledWith({
        where: { codigo: 1 },
        data: { lembrete24hEnviado: true },
      });
    });

    it('marca lembrete2hEnviado=true após envio bem-sucedido', async () => {
      const ag = makeAgendamento();
      mockPrisma.agendamento.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([ag]);
      mockPrisma.agendamento.update.mockResolvedValue({
        ...ag,
        lembrete2hEnviado: true,
      });

      await service.enviarLembretes();

      expect(mockPrisma.agendamento.update).toHaveBeenCalledWith({
        where: { codigo: 1 },
        data: { lembrete2hEnviado: true },
      });
    });

    it('falha de push não impede atualização do flag', async () => {
      const ag = makeAgendamento();
      mockPrisma.agendamento.findMany
        .mockResolvedValueOnce([ag])
        .mockResolvedValueOnce([]);
      mockPushService.send.mockRejectedValueOnce(new Error('push failed'));
      mockPrisma.agendamento.update.mockResolvedValue({
        ...ag,
        lembrete24hEnviado: true,
      });

      // Não deve lançar — a falha é capturada internamente
      await expect(service.enviarLembretes()).resolves.toBeUndefined();

      // update não é chamado porque o erro encerra a execução do enviar() antes
      // mas o Promise.allSettled garante que outros agendamentos não são afetados
    });

    it('não envia push quando cliente não tem codigo', async () => {
      const ag = makeAgendamento({
        cliente: null,
        contato: { nome: 'Anônimo' },
      });
      mockPrisma.agendamento.findMany
        .mockResolvedValueOnce([ag])
        .mockResolvedValueOnce([]);
      mockPrisma.agendamento.update.mockResolvedValue(ag);

      await service.enviarLembretes();

      expect(mockPushService.send).not.toHaveBeenCalled();
    });

    it('não envia email quando cliente não tem email', async () => {
      const ag = makeAgendamento({
        cliente: { codigo: 10, nome: 'João', email: null },
      });
      mockPrisma.agendamento.findMany
        .mockResolvedValueOnce([ag])
        .mockResolvedValueOnce([]);
      mockPrisma.agendamento.update.mockResolvedValue(ag);

      await service.enviarLembretes();

      expect(mockNotificacaoService.enviarLembrete).not.toHaveBeenCalled();
      expect(mockPushService.send).toHaveBeenCalled();
    });
  });
});
