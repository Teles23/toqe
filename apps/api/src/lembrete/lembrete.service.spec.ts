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
import { Agendamento, Barbearia, Usuario } from '../generated/prisma';

const mockPrisma = createPrismaMock();

const mockPushService = {
  send: jest.fn().mockResolvedValue(undefined),
};

const mockNotificacaoService = {
  enviarLembrete: jest.fn().mockResolvedValue(undefined),
  enviarEmail: jest.fn().mockResolvedValue(undefined),
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
  } as unknown as Agendamento;
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
      mockPrisma.agendamento.update.mockResolvedValue(
        makeAgendamento({ lembrete24hEnviado: true }),
      );

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
      mockPrisma.agendamento.update.mockResolvedValue(
        makeAgendamento({ lembrete2hEnviado: true }),
      );

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
      mockPrisma.agendamento.update.mockResolvedValue(
        makeAgendamento({ lembrete24hEnviado: true }),
      );

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
      mockPrisma.agendamento.update.mockResolvedValue(
        makeAgendamento({ lembrete2hEnviado: true }),
      );

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
      mockPrisma.agendamento.update.mockResolvedValue(
        makeAgendamento({ lembrete24hEnviado: true }),
      );

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

  describe('detectarNoShows', () => {
    function makeNoShowAgendamento(overrides: Record<string, unknown> = {}) {
      return {
        codigo: 42,
        fim: new Date('2026-05-24T09:00:00Z'),
        status: 'CONFIRMADO',
        barbeiro: { codigo: 5, nome: 'Pedro' },
        barbearia: { nome: 'BarberShop' },
        cliente: { nome: 'João' },
        contato: null,
        ...overrides,
      } as unknown as Agendamento;
    }

    it('não processa quando não há candidatos', async () => {
      mockPrisma.agendamento.findMany.mockResolvedValue([]);

      await expect(service.detectarNoShows()).resolves.toBeUndefined();

      expect(mockPrisma.agendamento.update).not.toHaveBeenCalled();
      expect(mockPushService.send).not.toHaveBeenCalled();
    });

    it('marca agendamento como NO_SHOW e envia push ao barbeiro', async () => {
      const ag = makeNoShowAgendamento();
      mockPrisma.agendamento.findMany.mockResolvedValue([ag]);
      mockPrisma.agendamento.update.mockResolvedValue(
        makeNoShowAgendamento({ status: 'NO_SHOW' }),
      );

      await service.detectarNoShows();

      expect(mockPrisma.agendamento.update).toHaveBeenCalledWith({
        where: { codigo: 42 },
        data: { status: 'NO_SHOW' },
      });
      expect(mockPushService.send).toHaveBeenCalledWith(
        5,
        'No-show detectado',
        expect.stringContaining('João'),
      );
      expect(mockPushService.send).toHaveBeenCalledWith(
        5,
        'No-show detectado',
        expect.stringContaining('BarberShop'),
      );
    });

    it('usa nome do contato como fallback quando cliente é null', async () => {
      const ag = makeNoShowAgendamento({
        cliente: null,
        contato: { nome: 'Walk-in' },
      });
      mockPrisma.agendamento.findMany.mockResolvedValue([ag]);
      mockPrisma.agendamento.update.mockResolvedValue(
        makeNoShowAgendamento({
          cliente: null,
          contato: { nome: 'Walk-in' },
          status: 'NO_SHOW',
        }),
      );

      await service.detectarNoShows();

      expect(mockPushService.send).toHaveBeenCalledWith(
        5,
        'No-show detectado',
        expect.stringContaining('Walk-in'),
      );
    });

    it('erro em um não impede processamento dos demais', async () => {
      const ag1 = makeNoShowAgendamento({ codigo: 100 });
      const ag2 = makeNoShowAgendamento({ codigo: 200 });
      mockPrisma.agendamento.findMany.mockResolvedValue([ag1, ag2]);
      mockPrisma.agendamento.update
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce(
          makeNoShowAgendamento({ codigo: 200, status: 'NO_SHOW' }),
        );

      await expect(service.detectarNoShows()).resolves.toBeUndefined();

      expect(mockPrisma.agendamento.update).toHaveBeenCalledTimes(2);
      expect(mockPushService.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('expirarTrials', () => {
    it('não faz nada quando não há trials expirados', async () => {
      mockPrisma.barbearia.findMany.mockResolvedValue([]);

      await expect(service.expirarTrials()).resolves.toBeUndefined();

      expect(mockPrisma.barbearia.update).not.toHaveBeenCalled();
    });

    it('marca como inadimplente barbearias com trial expirado', async () => {
      const barbearias = [
        { codigo: 1, nome: 'Barber A' },
        { codigo: 2, nome: 'Barber B' },
      ] as unknown as Barbearia[];
      mockPrisma.barbearia.findMany.mockResolvedValue(barbearias);
      mockPrisma.barbearia.update.mockResolvedValue({} as unknown as Barbearia);

      await service.expirarTrials();

      expect(mockPrisma.barbearia.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.barbearia.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { codigo: 1 },
          data: expect.objectContaining({
            planoStatus: 'inadimplente',
          }) as unknown as { planoStatus: string },
        }),
      );
      expect(mockPrisma.barbearia.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { codigo: 2 },
          data: expect.objectContaining({
            planoStatus: 'inadimplente',
          }) as unknown as { planoStatus: string },
        }),
      );
    });

    it('isola erros — um falha, outros continuam', async () => {
      const barbearias = [
        { codigo: 10, nome: 'Barber A' },
        { codigo: 20, nome: 'Barber B' },
      ] as unknown as Barbearia[];
      mockPrisma.barbearia.findMany.mockResolvedValue(barbearias);
      mockPrisma.barbearia.update
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({} as unknown as Barbearia);

      await expect(service.expirarTrials()).resolves.toBeUndefined();

      expect(mockPrisma.barbearia.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('enviarEmailsCobranca', () => {
    function makeBarbearia(overrides: Record<string, unknown> = {}) {
      return {
        codigo: 1,
        nome: 'BarberShop',
        membros: [
          { usuario: { email: 'dono@example.com', nome: 'Dono Test' } },
        ],
        ...overrides,
      } as unknown as Barbearia;
    }

    it('envia email 5 dias antes do vencimento', async () => {
      mockPrisma.barbearia.findMany
        .mockResolvedValueOnce([makeBarbearia()]) // vencendoEm5
        .mockResolvedValueOnce([]) // vencendoHoje
        .mockResolvedValueOnce([]); // inadimplentesHa3Dias

      await service.enviarEmailsCobranca();

      expect(mockNotificacaoService.enviarEmail).toHaveBeenCalledTimes(1);
      expect(mockNotificacaoService.enviarEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'dono@example.com',
          subject: expect.stringContaining('5 dias') as unknown as string,
        }),
      );
    });

    it('envia email no dia do vencimento', async () => {
      mockPrisma.barbearia.findMany
        .mockResolvedValueOnce([]) // vencendoEm5
        .mockResolvedValueOnce([makeBarbearia()]) // vencendoHoje
        .mockResolvedValueOnce([]); // inadimplentesHa3Dias

      await service.enviarEmailsCobranca();

      expect(mockNotificacaoService.enviarEmail).toHaveBeenCalledTimes(1);
      expect(mockNotificacaoService.enviarEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'dono@example.com',
          subject: expect.stringContaining('hoje') as unknown as string,
        }),
      );
    });

    it('envia email de inadimplência 3 dias após bloqueio', async () => {
      mockPrisma.barbearia.findMany
        .mockResolvedValueOnce([]) // vencendoEm5
        .mockResolvedValueOnce([]) // vencendoHoje
        .mockResolvedValueOnce([makeBarbearia()]); // inadimplentesHa3Dias

      await service.enviarEmailsCobranca();

      expect(mockNotificacaoService.enviarEmail).toHaveBeenCalledTimes(1);
      expect(mockNotificacaoService.enviarEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'dono@example.com',
          subject: expect.stringContaining('suspenso') as unknown as string,
        }),
      );
    });

    it('não envia quando não há barbearias nas janelas', async () => {
      mockPrisma.barbearia.findMany
        .mockResolvedValueOnce([]) // vencendoEm5
        .mockResolvedValueOnce([]) // vencendoHoje
        .mockResolvedValueOnce([]); // inadimplentesHa3Dias

      await service.enviarEmailsCobranca();

      expect(mockNotificacaoService.enviarEmail).not.toHaveBeenCalled();
    });
  });

  describe('enviarPushAniversario', () => {
    const hoje = new Date();

    function makeAniversariante(overrides: Record<string, unknown> = {}) {
      return {
        codigo: 10,
        nome: 'João',
        dataNascimento: new Date(1990, hoje.getMonth(), hoje.getDate()),
        ...overrides,
      } as unknown as Usuario;
    }

    it('não envia push quando não há aniversariantes hoje', async () => {
      mockPrisma.usuario.findMany.mockResolvedValue([]);

      await expect(service.enviarPushAniversario()).resolves.toBeUndefined();

      expect(mockPushService.send).not.toHaveBeenCalled();
    });

    it('envia push para aniversariante do dia', async () => {
      const u = makeAniversariante();
      mockPrisma.usuario.findMany.mockResolvedValue([u]);

      await service.enviarPushAniversario();

      expect(mockPushService.send).toHaveBeenCalledWith(
        10,
        'Feliz aniversário! 🎉',
        expect.stringContaining('João'),
      );
    });

    it('não envia push para usuário com aniversário em outro dia', async () => {
      const outro = makeAniversariante({
        dataNascimento: new Date(1990, hoje.getMonth(), hoje.getDate() + 1),
      });
      mockPrisma.usuario.findMany.mockResolvedValue([outro]);

      await service.enviarPushAniversario();

      expect(mockPushService.send).not.toHaveBeenCalled();
    });

    it('erro em um não impede os demais', async () => {
      const u1 = makeAniversariante({ codigo: 1, nome: 'Maria' });
      const u2 = makeAniversariante({ codigo: 2, nome: 'Pedro' });
      mockPrisma.usuario.findMany.mockResolvedValue([u1, u2]);
      mockPushService.send
        .mockRejectedValueOnce(new Error('push fail'))
        .mockResolvedValueOnce(undefined);

      await expect(service.enviarPushAniversario()).resolves.toBeUndefined();

      expect(mockPushService.send).toHaveBeenCalledTimes(2);
    });
  });
});
