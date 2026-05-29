import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AsaasController } from './asaas.controller';
import { AsaasService } from './asaas.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, PrismaMock } from '../test/prisma-mock.factory';
import type { AsaasWebhookPayload } from './asaas-webhook.dto';
import type { Barbearia } from '../generated/prisma';

const mockAsaasService = {
  createCustomer: jest.fn(),
  createSubscription: jest.fn(),
  getPaymentLink: jest.fn(),
  cancelSubscription: jest.fn(),
};

function makePayload(
  event: string,
  subscriptionId: string,
): AsaasWebhookPayload {
  return {
    event,
    payment: { subscription: subscriptionId, dueDate: '2026-07-01' },
  } as unknown as AsaasWebhookPayload;
}

describe('AsaasController — webhook security', () => {
  let controller: AsaasController;
  let prisma: PrismaMock;
  const originalEnv = process.env.ASAAS_WEBHOOK_TOKEN;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsaasController],
      providers: [
        { provide: AsaasService, useValue: mockAsaasService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<AsaasController>(AsaasController);
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.ASAAS_WEBHOOK_TOKEN = originalEnv;
  });

  describe('quando ASAAS_WEBHOOK_TOKEN não está configurado', () => {
    it('lança InternalServerErrorException — fail-closed', async () => {
      delete process.env.ASAAS_WEBHOOK_TOKEN;
      await expect(
        controller.webhook(makePayload('PAYMENT_RECEIVED', 'sub_1'), {}),
      ).rejects.toThrow(InternalServerErrorException);
      expect(prisma.barbearia.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('quando ASAAS_WEBHOOK_TOKEN está configurado', () => {
    beforeEach(() => {
      process.env.ASAAS_WEBHOOK_TOKEN = 'secret-token-123';
    });

    it('lança UnauthorizedException quando token recebido é incorreto', async () => {
      await expect(
        controller.webhook(makePayload('PAYMENT_RECEIVED', 'sub_1'), {
          'asaas-access-token': 'wrong-token',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.barbearia.findFirst).not.toHaveBeenCalled();
    });

    it('lança UnauthorizedException quando header está ausente', async () => {
      await expect(
        controller.webhook(makePayload('PAYMENT_RECEIVED', 'sub_1'), {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('processa PAYMENT_RECEIVED com token correto', async () => {
      prisma.barbearia.findFirst.mockResolvedValue({
        codigo: 1,
      } as unknown as Barbearia);
      prisma.barbearia.update.mockResolvedValue({} as unknown as Barbearia);

      const result = await controller.webhook(
        makePayload('PAYMENT_RECEIVED', 'sub_1'),
        { 'asaas-access-token': 'secret-token-123' },
      );

      expect(result).toEqual({ ok: true });
      expect(prisma.barbearia.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ planoStatus: 'ativo' }),
        }),
      );
    });

    it('processa PAYMENT_OVERDUE com token correto', async () => {
      prisma.barbearia.findFirst.mockResolvedValue({
        codigo: 1,
      } as unknown as Barbearia);
      prisma.barbearia.update.mockResolvedValue({} as unknown as Barbearia);

      await controller.webhook(makePayload('PAYMENT_OVERDUE', 'sub_1'), {
        'asaas-access-token': 'secret-token-123',
      });

      expect(prisma.barbearia.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ planoStatus: 'inadimplente' }),
        }),
      );
    });

    it('retorna ok:true quando subscription não encontrada', async () => {
      prisma.barbearia.findFirst.mockResolvedValue(null);

      const result = await controller.webhook(
        makePayload('PAYMENT_RECEIVED', 'sub_unknown'),
        { 'asaas-access-token': 'secret-token-123' },
      );

      expect(result).toEqual({ ok: true });
      expect(prisma.barbearia.update).not.toHaveBeenCalled();
    });
  });
});
