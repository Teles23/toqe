import { Test } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { PreferenciasController } from './preferencias.controller';
import { PreferenciasService } from './preferencias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockPreferenciasService = {
  find: jest.fn(),
  update: jest.fn(),
};

const mockReq = { user: { sub: 42 } } as JwtRequest;

describe('PreferenciasController', () => {
  let controller: PreferenciasController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PreferenciasController],
      providers: [
        { provide: PreferenciasService, useValue: mockPreferenciasService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockGuard)
      .compile();
    controller = module.get(PreferenciasController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('find', () => {
    it('delega para preferenciasService.find com usrCodigo e barCodigo convertido', async () => {
      const prefs = { email: true, push: false, whatsapp: false, sms: false };
      mockPreferenciasService.find.mockResolvedValue(prefs);

      const result = await controller.find(mockReq, '1');

      expect(mockPreferenciasService.find).toHaveBeenCalledWith(42, 1);
      expect(result).toEqual(prefs);
    });
  });

  describe('update', () => {
    it('delega para preferenciasService.update com usrCodigo, barCodigo e dto', async () => {
      const dto = { email: true, push: true, whatsapp: false, sms: false };
      const updated = { ...dto };
      mockPreferenciasService.update.mockResolvedValue(updated);

      const result = await controller.update(mockReq, '1', dto as never);

      expect(mockPreferenciasService.update).toHaveBeenCalledWith(42, 1, dto);
      expect(result).toEqual(updated);
    });
  });
});
