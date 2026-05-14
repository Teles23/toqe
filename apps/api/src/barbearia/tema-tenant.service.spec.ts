import { Test } from '@nestjs/testing';
import { TemaTenantService } from './tema-tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

const mockPrisma = createPrismaMock();

describe('TemaTenantService', () => {
  let service: TemaTenantService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TemaTenantService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(TemaTenantService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getTema', () => {
    it('retorna tema quando existe', async () => {
      const tema = {
        barCodigo: 1,
        corPrimaria: '#000',
        corFundo: '#fff',
        logoUrl: null,
        subdominio: null,
      };
      mockPrisma.temaTenant.findUnique.mockResolvedValue(tema);

      const result = await service.getTema(1);
      expect(result).toEqual(tema);
    });

    it('retorna tema padrão com nulls quando não existe', async () => {
      mockPrisma.temaTenant.findUnique.mockResolvedValue(null);

      const result = await service.getTema(1);
      expect(result).toEqual({
        barCodigo: 1,
        corPrimaria: null,
        corFundo: null,
        logoUrl: null,
        subdominio: null,
      });
    });
  });

  describe('upsertTema', () => {
    it('delega para prisma.temaTenant.upsert', async () => {
      const dto = {
        corPrimaria: '#111',
        corFundo: '#eee',
        logoUrl: null,
        subdominio: null,
      };
      const tema = { barCodigo: 1, ...dto };
      mockPrisma.temaTenant.upsert.mockResolvedValue(tema);

      const result = await service.upsertTema(1, dto as never);
      expect(result).toEqual(tema);
      expect(mockPrisma.temaTenant.upsert).toHaveBeenCalledWith({
        where: { barCodigo: 1 },
        update: dto,
        create: { barCodigo: 1, ...dto },
      });
    });
  });
});
