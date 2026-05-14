import { Test } from '@nestjs/testing';
import { NotificacaoService } from './notificacao.service';
import { AgendamentoConfirmadoJob } from './notificacao.types';

const mockJob: AgendamentoConfirmadoJob = {
  agendamentoCodigo: 42,
  clienteNome: 'João Silva',
  clienteEmail: 'joao@test.com',
  barbeiroNome: 'Carlos',
  barbeariaNome: 'BarberShop',
  inicio: '2024-06-01T09:00:00.000Z',
  fim: '2024-06-01T09:30:00.000Z',
  servicos: ['Corte', 'Barba'],
};

describe('NotificacaoService', () => {
  let service: NotificacaoService;
  const originalKey = process.env.RESEND_API_KEY;

  afterEach(() => {
    process.env.RESEND_API_KEY = originalKey;
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('sem RESEND_API_KEY', () => {
    beforeEach(async () => {
      delete process.env.RESEND_API_KEY;
      const module = await Test.createTestingModule({
        providers: [NotificacaoService],
      }).compile();
      service = module.get(NotificacaoService);
    });

    it('retorna sem lançar erro quando API key ausente', async () => {
      await expect(
        service.enviarConfirmacaoAgendamento(mockJob),
      ).resolves.toBeUndefined();
    });
  });

  describe('com RESEND_API_KEY configurada', () => {
    const mockSend = jest.fn();

    beforeEach(async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      jest.mock('resend', () => ({
        Resend: jest.fn().mockImplementation(() => ({
          emails: { send: mockSend },
        })),
      }));

      const module = await Test.createTestingModule({
        providers: [NotificacaoService],
      }).compile();
      service = module.get(NotificacaoService);

      // Substitui o resend interno pelo mock diretamente
      (
        service as unknown as { resend: { emails: { send: jest.Mock } } }
      ).resend = { emails: { send: mockSend } };
    });

    it('chama resend.emails.send com destinatário correto', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-123' } });
      await service.enviarConfirmacaoAgendamento(mockJob);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'joao@test.com',
          from: expect.stringContaining('noreply@toqe.com.br') as string,
        }),
      );
    });

    it('inclui nome do cliente e barbearia no subject ou HTML', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-123' } });
      await service.enviarConfirmacaoAgendamento(mockJob);
      const calls = mockSend.mock.calls as Array<
        [{ subject: string; html: string }]
      >;
      const call = calls[0]?.[0];
      expect(call.subject).toContain('BarberShop');
      expect(call.html).toContain('João Silva');
      expect(call.html).toContain('Corte');
      expect(call.html).toContain('Barba');
    });

    it('formata a data em português', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-123' } });
      await service.enviarConfirmacaoAgendamento(mockJob);
      const calls = mockSend.mock.calls as Array<[{ html: string }]>;
      const call = calls[0]?.[0];
      // 01 de junho de 2024 às 09:00
      expect(call.html).toMatch(/junho/i);
    });

    it('relança erro do Resend para permitir retry do BullMQ', async () => {
      mockSend.mockRejectedValue(new Error('Resend API down'));
      await expect(
        service.enviarConfirmacaoAgendamento(mockJob),
      ).rejects.toThrow('Resend API down');
    });
  });
});
