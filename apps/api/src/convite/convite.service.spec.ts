import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma';
import { ConviteService } from './convite.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { NotificacaoProducer } from '../notificacao/notificacao.producer';
import { createPrismaMock } from '../test/prisma-mock.factory';
import {
  Barbearia,
  ConviteBarbearia,
  MembroBarbearia,
  PlanoLimite,
  Usuario,
} from '../generated/prisma';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockedCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;

const mockPrisma = createPrismaMock();

const mockAuthService = {
  issueTokens: jest.fn().mockResolvedValue({
    access_token: 'acc',
    refresh_token: 'ref',
    user: { codigo: 0, nome: '', email: '' },
  }),
};

const mockNotificacaoProducer = {
  enviarConvite: jest.fn().mockResolvedValue(undefined),
};

const makeConvite = (overrides: Record<string, unknown> = {}) =>
  ({
    token: 'tok123',
    barCodigo: 1,
    email: 'joao@x.com',
    perfil: 'barbeiro',
    expiresAt: new Date(Date.now() + 86_400_000), // +1 dia
    usadoEm: null,
    barbearia: { nome: 'Urban Flow', slug: 'urban-flow' },
    ...overrides,
  }) as unknown as ConviteBarbearia;

describe('ConviteService', () => {
  let service: ConviteService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConviteService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificacaoProducer, useValue: mockNotificacaoProducer },
      ],
    }).compile();
    service = module.get(ConviteService);

    // $transaction executa o callback com o próprio mock (tx === mockPrisma).
    // O segundo argumento (options: isolationLevel) é ignorado nos testes unitários —
    // o isolamento Serializable é validado nos testes de integração com DB real.
    mockPrisma.$transaction.mockImplementation(
      (fn: (tx: typeof mockPrisma) => Promise<unknown>, _opts?: unknown) =>
        fn(mockPrisma),
    );
    mockAuthService.issueTokens.mockResolvedValue({
      access_token: 'acc',
      refresh_token: 'ref',
      user: { codigo: 0, nome: '', email: '' },
    });
    mockedCompare.mockResolvedValue(true as never);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── obterConvite ──────────────────────────────────────────────────────────

  describe('obterConvite', () => {
    it('retorna dados do convite com isNew=true quando usuário não existe', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      const result = await service.obterConvite('tok123');

      expect(result.token).toBe('tok123');
      expect(result.barbeariaNome).toBe('Urban Flow');
      expect(result.isNew).toBe(true);
    });

    it('retorna isNew=false quando usuário já existe', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 99,
      } as unknown as Usuario);

      const result = await service.obterConvite('tok123');

      expect(result.isNew).toBe(false);
    });

    it('lança NotFoundException para token inexistente', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(null);

      await expect(service.obterConvite('invalido')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança NotFoundException para convite expirado', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(
        makeConvite({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.obterConvite('tok123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── aceitarConvite ────────────────────────────────────────────────────────

  describe('aceitarConvite', () => {
    beforeEach(() => {
      // Padrão sem restrição de plano — testes específicos sobrescrevem.
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        plano: 'free',
      } as unknown as Barbearia);
      mockPrisma.planoLimite.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.count.mockResolvedValue(0);
    });

    it('cria novo usuário, vincula membro e faz auto-login (isNew=true)', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.usuario.create.mockResolvedValue({
        codigo: 50,
        nome: 'João',
        email: 'joao@x.com',
      } as unknown as Usuario);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue(
        {} as unknown as MembroBarbearia,
      );
      mockPrisma.conviteBarbearia.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.aceitarConvite('tok123', {
        nome: 'João',
        senha: 'senha1234',
      });

      expect(result.isNew).toBe(true);
      expect(result.barbeariaNome).toBe('Urban Flow');
      expect(result.access_token).toBe('acc');
      expect(result.refresh_token).toBe('ref');
      expect(mockPrisma.usuario.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.membroBarbearia.create).toHaveBeenCalledTimes(1);
      expect(mockAuthService.issueTokens).toHaveBeenCalledWith(
        50,
        'João',
        'joao@x.com',
      );
    });

    it('vincula usuário existente (senha correta) sem criar novo + auto-login', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 99,
        nome: 'Maria',
        email: 'joao@x.com',
        senhaHash: 'hash',
      } as unknown as Usuario);
      mockedCompare.mockResolvedValue(true as never);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue(
        {} as unknown as MembroBarbearia,
      );
      mockPrisma.conviteBarbearia.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.aceitarConvite('tok123', {
        senha: 'senha1234',
      });

      expect(result.isNew).toBe(false);
      expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
      expect(mockAuthService.issueTokens).toHaveBeenCalledWith(
        99,
        'Maria',
        'joao@x.com',
      );
    });

    it('lança UnauthorizedException se a senha do usuário existente está errada', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 99,
        nome: 'Maria',
        email: 'joao@x.com',
        senhaHash: 'hash',
      } as unknown as Usuario);
      mockedCompare.mockResolvedValue(false as never);

      await expect(
        service.aceitarConvite('tok123', { senha: 'errada12' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.issueTokens).not.toHaveBeenCalled();
    });

    it('lança BadRequestException se usuário existente não envia senha', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 99,
        nome: 'Maria',
        email: 'joao@x.com',
        senhaHash: 'hash',
      } as unknown as Usuario);

      await expect(service.aceitarConvite('tok123', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('não duplica membro se já for membro', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 99,
        nome: 'Maria',
        email: 'joao@x.com',
        senhaHash: 'hash',
      } as unknown as Usuario);
      mockedCompare.mockResolvedValue(true as never);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue({
        codigo: 1,
      } as unknown as MembroBarbearia);
      mockPrisma.conviteBarbearia.updateMany.mockResolvedValue({ count: 1 });

      await service.aceitarConvite('tok123', { senha: 'senha1234' });

      expect(mockPrisma.membroBarbearia.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException se nome/senha ausentes para isNew', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.aceitarConvite('tok123', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança NotFoundException para token inválido', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(null);

      await expect(service.aceitarConvite('invalido', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança ConflictException se convite já foi utilizado', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(
        makeConvite({ usadoEm: new Date() }),
      );

      await expect(service.aceitarConvite('tok123', {})).rejects.toThrow(
        ConflictException,
      );
    });

    it('lança ForbiddenException quando limite de plano é atingido dentro da transação', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null); // não é membro
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        plano: 'free',
      } as unknown as Barbearia);
      mockPrisma.planoLimite.findUnique.mockResolvedValue({
        maxBarbeiros: 1,
      } as unknown as PlanoLimite);
      mockPrisma.membroBarbearia.count.mockResolvedValue(1); // 1 barbeiro — limite atingido

      await expect(
        service.aceitarConvite('tok123', { nome: 'João', senha: 'senha1234' }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.membroBarbearia.create).not.toHaveBeenCalled();
    });

    it('não aplica cap quando usuário já é membro (re-convite não adiciona barbeiro)', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue({
        codigo: 99,
        nome: 'Maria',
        email: 'joao@x.com',
        senhaHash: 'hash',
      } as unknown as Usuario);
      mockedCompare.mockResolvedValue(true as never);
      // Usuário já é membro
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue({
        codigo: 1,
      } as unknown as MembroBarbearia);
      mockPrisma.conviteBarbearia.updateMany.mockResolvedValue({ count: 1 });
      // Plano com limite já esgotado — não deve importar pois é re-convite
      mockPrisma.planoLimite.findUnique.mockResolvedValue({
        maxBarbeiros: 1,
      } as unknown as PlanoLimite);
      mockPrisma.membroBarbearia.count.mockResolvedValue(1);

      // Não deve lançar ForbiddenException
      await expect(
        service.aceitarConvite('tok123', { senha: 'senha1234' }),
      ).resolves.toBeDefined();
      // Cap não foi consultado
      expect(mockPrisma.barbearia.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.membroBarbearia.create).not.toHaveBeenCalled();
    });

    it('retenta automaticamente até 3x em P2034 e converte em ConflictException', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      const p2034 = new Prisma.PrismaClientKnownRequestError(
        'Transaction failed due to a write conflict or a deadlock',
        { code: 'P2034', clientVersion: '0.0.0' },
      );
      // Falha nas 3 tentativas
      mockPrisma.$transaction
        .mockRejectedValueOnce(p2034)
        .mockRejectedValueOnce(p2034)
        .mockRejectedValueOnce(p2034);

      await expect(
        service.aceitarConvite('tok123', { nome: 'João', senha: 'senha1234' }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(3);
    });

    it('tem sucesso na segunda tentativa após P2034 transiente', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.usuario.create.mockResolvedValue({
        codigo: 50,
        nome: 'João',
        email: 'joao@x.com',
      } as unknown as Usuario);
      mockPrisma.membroBarbearia.findFirst.mockResolvedValue(null);
      mockPrisma.membroBarbearia.create.mockResolvedValue(
        {} as unknown as MembroBarbearia,
      );
      mockPrisma.conviteBarbearia.updateMany.mockResolvedValue({ count: 1 });
      const p2034 = new Prisma.PrismaClientKnownRequestError(
        'Transaction failed due to a write conflict or a deadlock',
        { code: 'P2034', clientVersion: '0.0.0' },
      );
      // Falha na primeira, sucesso na segunda
      mockPrisma.$transaction
        .mockRejectedValueOnce(p2034)
        .mockImplementationOnce(
          (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma),
        );

      const result = await service.aceitarConvite('tok123', {
        nome: 'João',
        senha: 'senha1234',
      });
      expect(result.isNew).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('relança erros desconhecidos sem converter', async () => {
      mockPrisma.conviteBarbearia.findUnique.mockResolvedValue(makeConvite());
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockRejectedValueOnce(
        new Error('Falha genérica no banco'),
      );

      await expect(
        service.aceitarConvite('tok123', { nome: 'João', senha: 'senha1234' }),
      ).rejects.toThrow('Falha genérica no banco');
    });
  });

  // ─── rejeitarConvite ──────────────────────────────────────────────────────

  describe('rejeitarConvite', () => {
    it('remove o convite e retorna sucesso', async () => {
      mockPrisma.conviteBarbearia.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.rejeitarConvite('tok123');

      expect(result).toEqual({ sucesso: true });
      expect(mockPrisma.conviteBarbearia.deleteMany).toHaveBeenCalledWith({
        where: { token: 'tok123' },
      });
    });

    it('é idempotente quando o token não existe', async () => {
      mockPrisma.conviteBarbearia.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.rejeitarConvite('inexistente');

      expect(result).toEqual({ sucesso: true });
    });
  });

  // ─── gerarConvite ──────────────────────────────────────────────────────────

  describe('gerarConvite', () => {
    const ORIGINAL_FRONTEND_URL = process.env.FRONTEND_URL;

    afterEach(() => {
      if (ORIGINAL_FRONTEND_URL === undefined) {
        delete process.env.FRONTEND_URL;
      } else {
        process.env.FRONTEND_URL = ORIGINAL_FRONTEND_URL;
      }
    });

    it('cria convite novo, dispara o producer e retorna metadata (reaproveitado=false)', async () => {
      process.env.FRONTEND_URL = 'https://app.toqe.com.br';
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        nome: 'Urban Flow',
      } as unknown as Barbearia);
      mockPrisma.conviteBarbearia.findFirst.mockResolvedValue(null);
      mockPrisma.conviteBarbearia.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            codigo: 7,
            email: data.email,
            perfil: data.perfil,
            expiresAt: data.expiresAt,
            token: data.token,
          }) as unknown as ReturnType<
            typeof mockPrisma.conviteBarbearia.create
          >,
      );

      const result = await service.gerarConvite(1, {
        email: 'novo@x.com',
        perfil: 'barbeiro',
      });

      expect(result.codigo).toBe(7);
      expect(result.email).toBe('novo@x.com');
      expect(result.perfil).toBe('barbeiro');
      expect(result.reaproveitado).toBe(false);
      expect(typeof result.expiresAt).toBe('string');
      // expira ~7 dias no futuro
      expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());

      expect(mockPrisma.conviteBarbearia.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.conviteBarbearia.update).not.toHaveBeenCalled();

      // não vaza o token no retorno
      expect(result).not.toHaveProperty('token');

      // dispara o job com o link no formato esperado
      expect(mockNotificacaoProducer.enviarConvite).toHaveBeenCalledTimes(1);
      const enviarConviteCalls = mockNotificacaoProducer.enviarConvite.mock
        .calls as Array<
        [
          {
            email: string;
            conviteLink: string;
            barbeariaNome: string;
            perfil: string;
          },
        ]
      >;
      const jobArg = enviarConviteCalls[0][0];
      expect(jobArg.email).toBe('novo@x.com');
      expect(jobArg.barbeariaNome).toBe('Urban Flow');
      expect(jobArg.perfil).toBe('barbeiro');
      expect(jobArg.conviteLink).toMatch(
        /^https:\/\/app\.toqe\.com\.br\/convite\?token=[0-9a-f]+$/,
      );
    });

    it('normaliza o e-mail (lowercase/trim) antes de persistir', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        nome: 'Urban Flow',
      } as unknown as Barbearia);
      mockPrisma.conviteBarbearia.findFirst.mockResolvedValue(null);
      mockPrisma.conviteBarbearia.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            codigo: 1,
            email: data.email,
            perfil: data.perfil,
            expiresAt: data.expiresAt,
            token: data.token,
          }) as unknown as ReturnType<
            typeof mockPrisma.conviteBarbearia.create
          >,
      );

      await service.gerarConvite(1, {
        email: '  MaIuSc@X.CoM  ',
        perfil: 'barbeiro',
      });

      const createCalls = mockPrisma.conviteBarbearia.create.mock
        .calls as Array<[{ data: { email: string } }]>;
      expect(createCalls[0][0].data.email).toBe('maiusc@x.com');
      // a busca de convite ativo também usa o e-mail normalizado
      const findCalls = mockPrisma.conviteBarbearia.findFirst.mock
        .calls as Array<[{ where: { email: string } }]>;
      expect(findCalls[0][0].where.email).toBe('maiusc@x.com');
    });

    it('renova convite ativo existente em vez de duplicar (reaproveitado=true)', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        nome: 'Urban Flow',
      } as unknown as Barbearia);
      mockPrisma.conviteBarbearia.findFirst.mockResolvedValue({
        codigo: 42,
      } as unknown as ConviteBarbearia);
      mockPrisma.conviteBarbearia.update.mockImplementation(
        ({
          data,
          where,
        }: {
          data: Record<string, unknown>;
          where: { codigo: number };
        }) =>
          Promise.resolve({
            codigo: where.codigo,
            email: 'existente@x.com',
            perfil: data.perfil,
            expiresAt: data.expiresAt,
            token: data.token,
          }) as unknown as ReturnType<
            typeof mockPrisma.conviteBarbearia.update
          >,
      );

      const result = await service.gerarConvite(1, {
        email: 'existente@x.com',
        perfil: 'gerente',
      });

      expect(result.reaproveitado).toBe(true);
      expect(result.codigo).toBe(42);
      expect(result.perfil).toBe('gerente');
      expect(mockPrisma.conviteBarbearia.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.conviteBarbearia.create).not.toHaveBeenCalled();
      expect(mockNotificacaoProducer.enviarConvite).toHaveBeenCalledTimes(1);
    });

    it('usa fallback de URL quando FRONTEND_URL ausente', async () => {
      delete process.env.FRONTEND_URL;
      mockPrisma.barbearia.findUnique.mockResolvedValue({
        nome: 'Urban Flow',
      } as unknown as Barbearia);
      mockPrisma.conviteBarbearia.findFirst.mockResolvedValue(null);
      mockPrisma.conviteBarbearia.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            codigo: 1,
            email: data.email,
            perfil: data.perfil,
            expiresAt: data.expiresAt,
            token: data.token,
          }) as unknown as ReturnType<
            typeof mockPrisma.conviteBarbearia.create
          >,
      );

      await service.gerarConvite(1, { email: 'a@x.com', perfil: 'barbeiro' });

      const fallbackCalls = mockNotificacaoProducer.enviarConvite.mock
        .calls as Array<[{ conviteLink: string }]>;
      expect(fallbackCalls[0][0].conviteLink).toMatch(
        /^http:\/\/localhost:4001\/convite\?token=/,
      );
    });

    it('lança NotFoundException se a barbearia não existe', async () => {
      mockPrisma.barbearia.findUnique.mockResolvedValue(null);

      await expect(
        service.gerarConvite(999, { email: 'a@x.com', perfil: 'barbeiro' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockNotificacaoProducer.enviarConvite).not.toHaveBeenCalled();
      expect(mockPrisma.conviteBarbearia.create).not.toHaveBeenCalled();
    });
  });
});
