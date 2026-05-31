import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ApiPublicaService } from './api-publica.service';
import { PrismaService } from '../prisma/prisma.service';
import { ServicoService } from '../servico/servico.service';
import { TenantContextService } from '../tenant/tenant-context/tenant-context.service';
import { createPrismaMock } from '../test/prisma-mock.factory';
import type {
  Agendamento,
  MembroBarbearia,
  Servico,
  Usuario,
} from '../generated/prisma';

describe('ApiPublicaService', () => {
  let service: ApiPublicaService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let tenantContext: { run: jest.Mock };

  beforeEach(async () => {
    prisma = createPrismaMock();
    tenantContext = {
      run: jest
        .fn()
        .mockImplementation(
          (
            _barCodigo: number,
            fn: (tx: ReturnType<typeof createPrismaMock>) => Promise<unknown>,
          ) => fn(prisma),
        ),
    };

    const module = await Test.createTestingModule({
      providers: [
        ApiPublicaService,
        { provide: PrismaService, useValue: prisma },
        { provide: ServicoService, useValue: { findAll: jest.fn() } },
        { provide: TenantContextService, useValue: tenantContext },
      ],
    }).compile();

    service = module.get(ApiPublicaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('criarAgendamento', () => {
    const barCodigo = 1;
    const dto = {
      barbeiroId: 10,
      servicoCodigo: 5,
      inicio: '2026-06-01T09:00:00.000Z',
      clienteNome: 'João',
      clienteEmail: 'joao@example.com',
    };

    const membroBarb = {
      usrCodigo: 10,
      barCodigo: 1,
      perfil: 'barbeiro',
    } as unknown as MembroBarbearia;
    const servicoMock = {
      codigo: 5,
      barCodigo: 1,
      ativo: true,
      duracaoBase: 30,
      precoBase: 60,
      barbeiros: [],
    } as unknown as Servico & { barbeiros: unknown[] };
    const clienteMock = {
      codigo: 99,
      email: 'joao@example.com',
      nome: 'João',
    } as unknown as Usuario;
    const agendamentoMock = {
      codigo: 500,
      barCodigo: 1,
      barbeiroId: 10,
      clienteId: 99,
      itens: [],
      cliente: { codigo: 99, nome: 'João' },
      barbeiro: { codigo: 10, nome: 'Carlos' },
    } as unknown as Agendamento;

    it('rejeita barbeiroId que não pertence à barbearia', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue(null);

      await expect(service.criarAgendamento(barCodigo, dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(tenantContext.run).not.toHaveBeenCalled();
    });

    it('rejeita serviço inativo ou de outra barbearia', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue(membroBarb);
      prisma.servico.findFirst.mockResolvedValue(null);

      await expect(service.criarAgendamento(barCodigo, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança ConflictException quando há agendamento no horário', async () => {
      // barber check (called on this.prisma before tenantContext.run)
      prisma.membroBarbearia.findFirst.mockResolvedValue(membroBarb);
      // service lookup
      prisma.servico.findFirst.mockResolvedValue(servicoMock);
      // inside the tx (same prisma mock via tenantContext.run)
      prisma.usuario.findUnique.mockResolvedValue(clienteMock);
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        usrCodigo: 99,
        barCodigo: 1,
        perfil: 'cliente',
      } as unknown as MembroBarbearia);
      // conflict found
      prisma.$queryRaw.mockResolvedValue([{ count: BigInt(1) }]);

      await expect(service.criarAgendamento(barCodigo, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('ativa o contexto de tenant (RLS) durante a transação', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue(membroBarb);
      prisma.servico.findFirst.mockResolvedValue(servicoMock);
      prisma.usuario.findUnique.mockResolvedValue(clienteMock);
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        usrCodigo: 99,
        barCodigo: 1,
        perfil: 'cliente',
      } as unknown as MembroBarbearia);
      prisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      prisma.agendamento.create.mockResolvedValue(agendamentoMock);

      await service.criarAgendamento(barCodigo, dto);

      expect(tenantContext.run).toHaveBeenCalledWith(
        barCodigo,
        expect.any(Function),
      );
    });

    it('cria agendamento com sucesso quando todos os dados são válidos', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue(membroBarb);
      prisma.servico.findFirst.mockResolvedValue(servicoMock);
      prisma.usuario.findUnique.mockResolvedValue(clienteMock);
      prisma.membroBarbearia.findFirst.mockResolvedValue({
        usrCodigo: 99,
        barCodigo: 1,
        perfil: 'cliente',
      } as unknown as MembroBarbearia);
      prisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      prisma.agendamento.create.mockResolvedValue(agendamentoMock);

      const result = await service.criarAgendamento(barCodigo, dto);

      expect(result).toEqual(agendamentoMock);
      expect(prisma.agendamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            barbeiroId: dto.barbeiroId,
            barCodigo,
          }),
        }),
      );
    });

    it('cria cliente provisório quando não existe', async () => {
      prisma.membroBarbearia.findFirst.mockResolvedValue(membroBarb);
      prisma.servico.findFirst.mockResolvedValue(servicoMock);
      // cliente não existe
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue(clienteMock);
      prisma.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
      prisma.agendamento.create.mockResolvedValue(agendamentoMock);

      const result = await service.criarAgendamento(barCodigo, dto);

      expect(result).toEqual(agendamentoMock);
      expect(prisma.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: dto.clienteEmail,
            nome: dto.clienteNome,
          }),
        }),
      );
    });
  });
});
