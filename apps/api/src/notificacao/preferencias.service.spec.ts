import { PreferenciasService } from './preferencias.service';
import { UpdatePreferenciasDto } from './dto/update-preferencias.dto';
import { createPrismaMock } from '../test/prisma-mock.factory';
import type { PrismaService } from '../prisma/prisma.service';

describe('PreferenciasService', () => {
  let service: PreferenciasService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new PreferenciasService(prisma as unknown as PrismaService);
  });

  describe('find', () => {
    it('should return defaults when no DB records exist', async () => {
      prisma.notificacaoPreferencia.findMany.mockResolvedValueOnce([]);

      const result = await service.find(1, 1);

      expect(result).toEqual({
        email: true,
        push: false,
        whatsapp: false,
        sms: false,
      });
    });

    it('should override defaults with DB records', async () => {
      prisma.notificacaoPreferencia.findMany.mockResolvedValueOnce([
        { canal: 'email', ativo: false },
        { canal: 'push', ativo: true },
      ]);

      const result = await service.find(1, 1);

      expect(result).toEqual({
        email: false,
        push: true,
        whatsapp: false,
        sms: false,
      });
    });
  });

  describe('update', () => {
    it('should call $transaction and then return find result', async () => {
      prisma.$transaction.mockResolvedValueOnce(undefined);
      prisma.notificacaoPreferencia.findMany.mockResolvedValueOnce([
        { canal: 'email', ativo: true },
        { canal: 'push', ativo: true },
        { canal: 'whatsapp', ativo: false },
        { canal: 'sms', ativo: false },
      ]);

      const dto: UpdatePreferenciasDto = {
        email: true,
        push: true,
        whatsapp: false,
        sms: false,
      };
      const result = await service.update(1, 1, dto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        email: true,
        push: true,
        whatsapp: false,
        sms: false,
      });
    });
  });
});
