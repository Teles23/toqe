import { Test } from '@nestjs/testing';
import { CanActivate } from '@nestjs/common';
import { BarbeariaController } from './barbearia.controller';
import { BarbeariaService } from './barbearia.service';
import { MembroBarbeariaService } from './membro-barbearia.service';
import { TemaTenantService } from './tema-tenant.service';
import { ConviteService } from '../convite/convite.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FeatureFlagGuard } from '../auth/guards/feature-flag.guard';
import { PerfilMembro } from './dto/convidar-membro.dto';

const mockGuard: CanActivate = { canActivate: jest.fn(() => true) };

const mockBarbeariaService = {
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockMembroService = {
  findBarbeiros: jest.fn(),
  findClientes: jest.fn(),
  findMembros: jest.fn(),
  convidarMembro: jest.fn(),
  removerMembro: jest.fn(),
};

const mockTemaService = {
  getTema: jest.fn(),
  upsertTema: jest.fn(),
};

const mockConviteService = {
  gerarConvite: jest.fn(),
};

describe('BarbeariaController', () => {
  let controller: BarbeariaController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [BarbeariaController],
      providers: [
        { provide: BarbeariaService, useValue: mockBarbeariaService },
        { provide: MembroBarbeariaService, useValue: mockMembroService },
        { provide: TemaTenantService, useValue: mockTemaService },
        { provide: ConviteService, useValue: mockConviteService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .overrideGuard(TenantGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .overrideGuard(FeatureFlagGuard)
      .useValue(mockGuard)
      .compile();
    controller = module.get(BarbeariaController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('delega para barbeariaService.create com sub do usuario', () => {
      const dto = { nome: 'BarberShop', slug: 'bs' };
      const req = { user: { sub: 10 } } as JwtRequest;
      mockBarbeariaService.create.mockResolvedValue({ codigo: 1 });

      void controller.create(dto as never, req);

      expect(mockBarbeariaService.create).toHaveBeenCalledWith(dto, 10);
    });
  });

  describe('findMembros', () => {
    it('delega para membroService.findMembros com barCodigo', () => {
      mockMembroService.findMembros.mockResolvedValue([]);

      void controller.findMembros(1, '1');

      expect(mockMembroService.findMembros).toHaveBeenCalledWith(1);
    });
  });

  describe('convidarMembro', () => {
    it('delega para membroService.convidarMembro com barCodigo, dto e callerPerfil', () => {
      const dto = { email: 'x@x.com', perfil: PerfilMembro.BARBEIRO };
      mockMembroService.convidarMembro.mockResolvedValue({ usrCodigo: 5 });
      const req = { user: { sub: 1, perfil: 'dono' } } as never;

      void controller.convidarMembro(1, dto, req);

      expect(mockMembroService.convidarMembro).toHaveBeenCalledWith(
        1,
        dto,
        'dono',
      );
    });
  });

  describe('gerarConvite', () => {
    it('delega para conviteService.gerarConvite com barCodigo e dto', () => {
      const dto = { email: 'novo@x.com', perfil: 'barbeiro' as const };
      mockConviteService.gerarConvite.mockResolvedValue({
        codigo: 1,
        email: 'novo@x.com',
        perfil: 'barbeiro',
        expiresAt: new Date().toISOString(),
        reaproveitado: false,
      });

      void controller.gerarConvite(1, dto, '1');

      expect(mockConviteService.gerarConvite).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('getTema', () => {
    it('delega para temaService.getTema com barCodigo', () => {
      mockTemaService.getTema.mockResolvedValue({ corPrimaria: '#fff' });

      void controller.getTema(1, '1');

      expect(mockTemaService.getTema).toHaveBeenCalledWith(1);
    });
  });

  describe('removerMembro', () => {
    it('delega para membroService.removerMembro com barCodigo e usrCodigo', () => {
      mockMembroService.removerMembro.mockResolvedValue(undefined);

      void controller.removerMembro(1, 5, '1');

      expect(mockMembroService.removerMembro).toHaveBeenCalledWith(1, 5);
    });
  });
});
