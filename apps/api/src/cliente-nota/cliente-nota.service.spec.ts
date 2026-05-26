import { Test } from '@nestjs/testing';
import { ClienteNotaService } from './cliente-nota.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

const mockPrisma = createPrismaMock();

describe('ClienteNotaService', () => {
  let service: ClienteNotaService;
  const barCodigo = 1;
  const barbeiroId = 10;
  const clienteId = 20;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClienteNotaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ClienteNotaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('obterNota', () => {
    it('retorna conteúdo e atualizadoEm quando a nota existe', async () => {
      const data = new Date('2026-05-22T10:00:00Z');
      mockPrisma.clienteNota.findUnique.mockResolvedValue({
        conteudo: 'máquina 2 nas laterais',
        atualizadoEm: data,
      });

      const result = await service.obterNota(barCodigo, barbeiroId, clienteId);

      expect(result).toEqual({
        conteudo: 'máquina 2 nas laterais',
        atualizadoEm: data.toISOString(),
      });
      expect(mockPrisma.clienteNota.findUnique).toHaveBeenCalledWith({
        where: {
          barCodigo_barbeiroId_clienteId: { barCodigo, barbeiroId, clienteId },
        },
        select: { conteudo: true, atualizadoEm: true },
      });
    });

    it('retorna conteúdo vazio quando não há nota', async () => {
      mockPrisma.clienteNota.findUnique.mockResolvedValue(null);

      const result = await service.obterNota(barCodigo, barbeiroId, clienteId);

      expect(result).toEqual({ conteudo: '', atualizadoEm: null });
    });
  });

  describe('salvarNota', () => {
    it('faz upsert com conteúdo aparado quando não vazio', async () => {
      const data = new Date('2026-05-22T10:00:00Z');
      mockPrisma.clienteNota.upsert.mockResolvedValue({
        conteudo: 'corte na régua',
        atualizadoEm: data,
      });

      const result = await service.salvarNota(
        barCodigo,
        barbeiroId,
        clienteId,
        '  corte na régua  ',
      );

      expect(result.conteudo).toBe('corte na régua');
      expect(result.atualizadoEm).toBe(data.toISOString());
      const calls = mockPrisma.clienteNota.upsert.mock
        .calls as unknown as Array<
        [{ create: { conteudo: string }; update: { conteudo: string } }]
      >;
      const arg = calls[0][0];
      expect(arg.create.conteudo).toBe('corte na régua');
      expect(arg.update.conteudo).toBe('corte na régua');
    });

    it('remove a nota (deleteMany) quando o conteúdo é vazio', async () => {
      mockPrisma.clienteNota.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.salvarNota(
        barCodigo,
        barbeiroId,
        clienteId,
        '   ',
      );

      expect(result).toEqual({ conteudo: '', atualizadoEm: null });
      expect(mockPrisma.clienteNota.deleteMany).toHaveBeenCalledWith({
        where: { barCodigo, barbeiroId, clienteId },
      });
      expect(mockPrisma.clienteNota.upsert).not.toHaveBeenCalled();
    });
  });
});
