import { Test } from '@nestjs/testing';
import { NotificacaoService } from './notificacao.service';
import type { AgendamentoConfirmadoJob } from './notificacao.types';

const mockSend = jest.fn();

// Deve estar no escopo do módulo — Jest o eleva antes dos imports,
// então new Resend() no construtor do service recebe o mock automaticamente.
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

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

    it('enviarConviteEmail é no-op (sem lançar) quando API key ausente', async () => {
      await expect(
        service.enviarConviteEmail({
          email: 'novo@x.com',
          conviteLink: 'https://app.toqe.com.br/convite?token=abc',
          barbeariaNome: 'Urban Flow',
          perfil: 'barbeiro',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('com RESEND_API_KEY configurada', () => {
    beforeEach(async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      mockSend.mockReset();

      const module = await Test.createTestingModule({
        providers: [NotificacaoService],
      }).compile();
      service = module.get(NotificacaoService);
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
      expect(call.html).toMatch(/junho/i);
    });

    it('relança erro do Resend para permitir retry do BullMQ', async () => {
      mockSend.mockRejectedValue(new Error('Resend API down'));
      await expect(
        service.enviarConfirmacaoAgendamento(mockJob),
      ).rejects.toThrow('Resend API down');
    });

    describe('enviarConviteEmail', () => {
      const conviteJob = {
        email: 'novo@x.com',
        conviteLink: 'https://app.toqe.com.br/convite?token=abc123',
        barbeariaNome: 'Urban Flow',
        perfil: 'barbeiro',
      };

      it('envia para o destinatário correto com o link no HTML', async () => {
        mockSend.mockResolvedValue({ data: { id: 'email-conv' } });
        await service.enviarConviteEmail(conviteJob);

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'novo@x.com',
            from: expect.stringContaining('noreply@toqe.com.br') as string,
          }),
        );
        const calls = mockSend.mock.calls as Array<
          [{ subject: string; html: string }]
        >;
        const call = calls[0]?.[0];
        expect(call.subject).toContain('Urban Flow');
        expect(call.html).toContain('Urban Flow');
        expect(call.html).toContain('barbeiro');
        // o link de aceite aparece (botão + fallback de texto)
        expect(call.html).toContain(conviteJob.conviteLink);
      });

      it('relança erro do Resend para permitir retry do BullMQ', async () => {
        mockSend.mockRejectedValue(new Error('Resend API down'));
        await expect(service.enviarConviteEmail(conviteJob)).rejects.toThrow(
          'Resend API down',
        );
      });
    });
  });
});
