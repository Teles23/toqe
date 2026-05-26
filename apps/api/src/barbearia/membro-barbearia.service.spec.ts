import { Test } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MembroBarbeariaService } from './membro-barbearia.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';
import { Prisma } from '../generated/prisma';
import { PerfilMembro } from './dto/convidar-membro.dto';

const mockPrisma = createPrismaMock();

describe('MembroBarbeariaService', () => {
  let service: MembroBarbeariaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MembroBarbeariaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(MembroBarbeariaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOrCreateCliente', () => {
    const dto = { nome: 'João', email: 'joao@x.com' };

    it('reaproveita usuário+membro existentes (cliente recorrente)', async () => {
      const usuario = { codigo: 99, email: dto.email };
      const membroExistente = {
        usrCodigo: 99,
        barCodigo: 1,
        perfil: 'cliente',
        usuario: { codigo: 99, nome: 'João', email: dto.email },
      };
      mockPrisma.usuario.findUnique.mockResolvedValue(usuario);
      mockPrisma.membroBarbearia.findUnique
        .mockResolvedValueOnce({ usrCodigo: 99 }) // upsertClienteUsuario
        .mockResolvedValueOnce(membroExistente); // re-busca para retornar com include

      const result = await service.findOrCreateCliente(1, dto);
      expect(result).toBe(membroExistente);
      expect(mockPrisma.membroBarbearia.create).not.toHaveBeenCalled();
    });

    it('cria usuário + membro quando email novo', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.usuario.create.mockResolvedValue({
        codigo: 200,
        email: dto.email,
      });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        usrCodigo: 200,
        barCodigo: 1,
        perfil: 'cliente',
        usuario: { codigo: 200, nome: dto.nome, email: dto.email },
      });

      const result = await service.findOrCreateCliente(1, dto);
      expect(result).toHaveProperty('perfil', 'cliente');
      expect(mockPrisma.usuario.create).toHaveBeenCalled();
      expect(mockPrisma.membroBarbearia.create).toHaveBeenCalled();
    });

    it('cria membro quando usuário já existe mas nunca foi cliente', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 50,
        email: dto.email,
      });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        usrCodigo: 50,
        barCodigo: 1,
        perfil: 'cliente',
        usuario: { codigo: 50, nome: dto.nome, email: dto.email },
      });

      const result = await service.findOrCreateCliente(1, dto);
      expect(result).toHaveProperty('perfil', 'cliente');
      expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
      expect(mockPrisma.membroBarbearia.create).toHaveBeenCalled();
    });

    it('walk-in sem email: gera email único server-side e NÃO faz dedup por email', async () => {
      // Captura o email gerado no create (param tipado → leitura segura p/ lint).
      let createdEmail: string | undefined;
      mockPrisma.usuario.create.mockImplementation(
        (args: { data: { email: string } }) => {
          createdEmail = args.data.email;
          return Promise.resolve({ codigo: 300 });
        },
      );
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        usrCodigo: 300,
        barCodigo: 1,
        perfil: 'cliente',
        usuario: { codigo: 300, nome: 'Encaixe', email: 'x' },
      });

      await service.findOrCreateCliente(1, { nome: 'Encaixe' });

      // sem dedup por email (não havia email para buscar)
      expect(mockPrisma.usuario.findUnique).not.toHaveBeenCalled();
      // cria usuário com um email gerado e único (@toqe.internal)
      expect(mockPrisma.usuario.create).toHaveBeenCalled();
      expect(createdEmail).toMatch(/@toqe\.internal$/);
    });
  });

  describe('criarCliente (cadastro manual pelo barbeiro)', () => {
    it('cria cliente com nome + telefone e e-mail informado', async () => {
      let createdData:
        | { nome: string; telefone?: string; email: string }
        | undefined;
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.usuario.create.mockImplementation(
        (args: {
          data: { nome: string; telefone?: string; email: string };
        }) => {
          createdData = args.data;
          return Promise.resolve({ codigo: 400, email: 'novo@x.com' });
        },
      );
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        usrCodigo: 400,
        barCodigo: 1,
        perfil: 'cliente',
        usuario: { codigo: 400, nome: 'Novo', email: 'novo@x.com' },
      });

      const result = await service.criarCliente(1, {
        nome: 'Novo',
        telefone: '(11) 99999-9999',
        email: 'novo@x.com',
      });

      expect(result).toHaveProperty('perfil', 'cliente');
      // E-mail informado → usado direto (sem sintético) + telefone persistido.
      expect(createdData?.email).toBe('novo@x.com');
      expect(createdData?.telefone).toBe('(11) 99999-9999');
      expect(createdData?.nome).toBe('Novo');
    });

    it('cria cliente SEM e-mail: gera sintético @toqe.internal (e-mail opcional)', async () => {
      let createdEmail: string | undefined;
      mockPrisma.usuario.create.mockImplementation(
        (args: { data: { email: string } }) => {
          createdEmail = args.data.email;
          return Promise.resolve({ codigo: 401 });
        },
      );
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        usrCodigo: 401,
        barCodigo: 1,
        perfil: 'cliente',
        usuario: { codigo: 401, nome: 'Sem Email', email: 'x' },
      });

      await service.criarCliente(1, {
        nome: 'Sem Email',
        telefone: '(11) 98888-7777',
      });

      expect(createdEmail).toMatch(/@toqe\.internal$/);
    });

    it('lança ConflictException quando o telefone já pertence a outro usuário', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '0' },
      );
      mockPrisma.usuario.create.mockRejectedValue(p2002);

      await expect(
        service.criarCliente(1, { nome: 'Bsns', telefone: '(71) 98854-5259' }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.membroBarbearia.create).not.toHaveBeenCalled();
    });

    it('lança ConflictException quando o usuário já é cliente da barbearia', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 50,
        email: 'ja@x.com',
      });
      // upsertClienteUsuario → jaEraMembro = true
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue({
        usrCodigo: 50,
      });

      await expect(
        service.criarCliente(1, { nome: 'Já', email: 'ja@x.com' }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.membroBarbearia.create).not.toHaveBeenCalled();
    });
  });

  describe('convidarMembro', () => {
    it('convida membro com sucesso', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 5,
        email: 'x@x.com',
      });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.barbearia.findUniqueOrThrow.mockResolvedValue({
        plano: 'basic',
      });
      mockPrisma.planoLimite.findUnique.mockResolvedValue(null); // sem limite definido
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 5,
        perfil: PerfilMembro.BARBEIRO,
        usuario: { codigo: 5, nome: 'X', email: 'x@x.com' },
      });

      const result = await service.convidarMembro(
        1,
        { email: 'x@x.com', perfil: PerfilMembro.BARBEIRO },
        'dono',
      );
      expect(result).toHaveProperty('perfil', 'barbeiro');
    });

    it('lança NotFoundException se usuário não existe', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      await expect(
        service.convidarMembro(
          1,
          { email: 'nope@x.com', perfil: PerfilMembro.BARBEIRO },
          'dono',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException se já é membro', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({ codigo: 5 });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 5,
      });
      await expect(
        service.convidarMembro(
          1,
          { email: 'x@x.com', perfil: PerfilMembro.BARBEIRO },
          'dono',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('plano sem limite (maxBarbeiros null) → não lança ForbiddenException', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 5,
        email: 'x@x.com',
      });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.barbearia.findUniqueOrThrow.mockResolvedValue({
        plano: 'free',
      });
      mockPrisma.planoLimite.findUnique.mockResolvedValue({
        maxBarbeiros: null,
      });
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 5,
        perfil: PerfilMembro.BARBEIRO,
        usuario: { codigo: 5, nome: 'X', email: 'x@x.com' },
      });

      const result = await service.convidarMembro(
        1,
        { email: 'x@x.com', perfil: PerfilMembro.BARBEIRO },
        'dono',
      );
      expect(result).toHaveProperty('perfil', 'barbeiro');
      expect(mockPrisma.membroBarbearia.count).not.toHaveBeenCalled();
    });

    it('dentro do limite de barbeiros → cria normalmente', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 5,
        email: 'x@x.com',
      });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.barbearia.findUniqueOrThrow.mockResolvedValue({
        plano: 'basic',
      });
      mockPrisma.planoLimite.findUnique.mockResolvedValue({ maxBarbeiros: 3 });
      mockPrisma.membroBarbearia.count.mockResolvedValue(2); // 2 < 3
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 5,
        perfil: PerfilMembro.BARBEIRO,
        usuario: { codigo: 5, nome: 'X', email: 'x@x.com' },
      });

      const result = await service.convidarMembro(
        1,
        { email: 'x@x.com', perfil: PerfilMembro.BARBEIRO },
        'dono',
      );
      expect(result).toHaveProperty('perfil', 'barbeiro');
    });

    it('no limite de barbeiros → lança ForbiddenException', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 5,
        email: 'x@x.com',
      });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.barbearia.findUniqueOrThrow.mockResolvedValue({
        plano: 'free',
      });
      mockPrisma.planoLimite.findUnique.mockResolvedValue({ maxBarbeiros: 1 });
      mockPrisma.membroBarbearia.count.mockResolvedValue(1); // 1 >= 1

      await expect(
        service.convidarMembro(
          1,
          { email: 'x@x.com', perfil: PerfilMembro.BARBEIRO },
          'dono',
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.membroBarbearia.create).not.toHaveBeenCalled();
    });

    it('convidar gerente não verifica limite de barbeiros', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 6,
        email: 'g@x.com',
      });
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 6,
        perfil: PerfilMembro.GERENTE,
        usuario: { codigo: 6, nome: 'G', email: 'g@x.com' },
      });

      const result = await service.convidarMembro(
        1,
        { email: 'g@x.com', perfil: PerfilMembro.GERENTE },
        'dono',
      );
      expect(result).toHaveProperty('perfil', 'gerente');
      expect(mockPrisma.barbearia.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(mockPrisma.planoLimite.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('removerMembro', () => {
    it('remove membro com sucesso', async () => {
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 5,
        perfil: PerfilMembro.BARBEIRO,
      });
      mockPrisma.membroBarbearia.delete.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 5,
      });

      await service.removerMembro(1, 5);
      expect(mockPrisma.membroBarbearia.delete).toHaveBeenCalled();
    });

    it('lança NotFoundException se membro não existe', async () => {
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue(null);
      await expect(service.removerMembro(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança BadRequestException ao tentar remover dono', async () => {
      mockPrisma.membroBarbearia.findUnique.mockResolvedValue({
        barCodigo: 1,
        usrCodigo: 1,
        perfil: 'dono',
      });
      await expect(service.removerMembro(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findMembros', () => {
    it('retorna membros da barbearia ordenados por perfil', async () => {
      const membros = [
        { usrCodigo: 1, perfil: 'barbeiro', usuario: { nome: 'João' } },
      ];
      mockPrisma.membroBarbearia.findMany.mockResolvedValue(membros);

      const result = await service.findMembros(1);
      expect(result).toEqual(membros);
      expect(mockPrisma.membroBarbearia.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { perfil: 'asc' } }),
      );
    });
  });

  describe('findPessoas', () => {
    it('combina clientes (tipo=usuario) e contatos (tipo=contato) ordenados por nome', async () => {
      // findClientes internamente: findMany membros → agendamentos por cliente
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([
        {
          usrCodigo: 1,
          perfil: 'cliente',
          usuario: {
            codigo: 1,
            nome: 'Maria',
            email: 'maria@x.com',
            telefone: null,
            avatarUrl: null,
          },
        },
      ]);
      // agendamentos do cliente Maria
      mockPrisma.agendamento.findMany.mockResolvedValue([]);
      // contatos da barbearia
      mockPrisma.contato.findMany.mockResolvedValue([
        { codigo: 10, barCodigo: 1, nome: 'Ana', telefone: '+5511999' },
      ]);

      const result = await service.findPessoas(1);

      expect(result).toHaveLength(2);
      // Ordenados por nome: Ana < Maria
      expect(result[0]).toMatchObject({
        nome: 'Ana',
        tipo: 'contato',
        email: null,
      });
      expect(result[1]).toMatchObject({
        nome: 'Maria',
        tipo: 'usuario',
        email: 'maria@x.com',
      });
    });

    it('retorna lista vazia quando não há clientes nem contatos', async () => {
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([]);
      mockPrisma.contato.findMany.mockResolvedValue([]);

      const result = await service.findPessoas(1);
      expect(result).toEqual([]);
    });

    it('contato tem stats zerados (totalVisitas=0, totalGasto=0, etc.)', async () => {
      mockPrisma.membroBarbearia.findMany.mockResolvedValue([]);
      mockPrisma.contato.findMany.mockResolvedValue([
        { codigo: 5, barCodigo: 1, nome: 'Carlos', telefone: null },
      ]);

      const result = await service.findPessoas(1);
      expect(result[0]).toMatchObject({
        codigo: 5,
        tipo: 'contato',
        totalVisitas: 0,
        totalGasto: 0,
        ticketMedio: 0,
        ultimaVisita: null,
        servicoFav: null,
      });
    });
  });
});
