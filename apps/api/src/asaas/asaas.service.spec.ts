import { Test } from '@nestjs/testing';
import { AsaasService } from './asaas.service';

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

function mockOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockErr(status: number) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: () => Promise.resolve('err'),
  });
}

describe('AsaasService', () => {
  let service: AsaasService;

  beforeEach(async () => {
    process.env.ASAAS_API_KEY = 'test-api-key';
    const module = await Test.createTestingModule({
      providers: [AsaasService],
    }).compile();
    service = module.get(AsaasService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ASAAS_API_KEY;
  });

  describe('createCustomer', () => {
    it('retorna customer criado', async () => {
      mockOk({ id: 'cus_1', name: 'João', email: 'j@j.com' });
      const r = await service.createCustomer('João', 'j@j.com');
      expect(r.id).toBe('cus_1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/customers'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('lança erro quando API falha', async () => {
      mockErr(422);
      await expect(service.createCustomer('X', 'x@x.com')).rejects.toThrow(
        'Asaas API error',
      );
    });
  });

  describe('createSubscription', () => {
    it('usa preço correto para plano pro', async () => {
      mockOk({
        id: 'sub_1',
        customerId: 'cus_1',
        status: 'ACTIVE',
        nextDueDate: '2026-06-01',
        value: 99,
        cycle: 'MONTHLY',
      });
      const r = await service.createSubscription('cus_1', 'pro', '2026-06-01');
      expect(r.value).toBe(99);
      expect(r.id).toBe('sub_1');
    });

    it('usa preço correto para plano basic', async () => {
      mockOk({
        id: 'sub_2',
        customerId: 'cus_1',
        status: 'ACTIVE',
        nextDueDate: '2026-06-01',
        value: 49,
        cycle: 'MONTHLY',
      });
      await service.createSubscription('cus_1', 'basic', '2026-06-01');
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as { value: number };
      expect(body.value).toBe(49);
    });
  });

  describe('cancelSubscription', () => {
    it('faz DELETE no subscription', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
      await service.cancelSubscription('sub_1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/sub_1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
