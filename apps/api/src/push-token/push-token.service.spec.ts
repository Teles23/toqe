import { Test } from '@nestjs/testing';
import { PushTokenService } from './push-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/prisma-mock.factory';

const mockPrisma = createPrismaMock();

describe('PushTokenService', () => {
  let service: PushTokenService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PushTokenService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(PushTokenService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upsertToken', () => {
    it('faz upsert do token no banco', () => {
      mockPrisma.pushToken.upsert.mockResolvedValue({
        codigo: 1,
        usrCodigo: 1,
        token: 'ExponentPushToken[xxx]',
        plataforma: 'ios',
        criadoEm: new Date(),
      });
      void service.upsertToken(1, 'ExponentPushToken[xxx]', 'ios');
      expect(mockPrisma.pushToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: {
            usrCodigo: 1,
            token: 'ExponentPushToken[xxx]',
            plataforma: 'ios',
          },
        }),
      );
    });
  });

  describe('findByUser', () => {
    it('retorna lista de tokens do usuário', async () => {
      const now = new Date();
      mockPrisma.pushToken.findMany.mockResolvedValue([
        {
          codigo: 1,
          usrCodigo: 1,
          token: 'ExponentPushToken[aaa]',
          plataforma: 'ios',
          criadoEm: now,
        },
        {
          codigo: 2,
          usrCodigo: 1,
          token: 'ExponentPushToken[bbb]',
          plataforma: 'android',
          criadoEm: now,
        },
      ]);
      const result = await service.findByUser(1);
      expect(result).toEqual([
        'ExponentPushToken[aaa]',
        'ExponentPushToken[bbb]',
      ]);
    });
  });

  describe('deleteToken', () => {
    it('deleta o token do usuário', () => {
      mockPrisma.pushToken.deleteMany.mockResolvedValue({ count: 1 });
      void service.deleteToken(1, 'ExponentPushToken[xxx]');
      expect(mockPrisma.pushToken.deleteMany).toHaveBeenCalledWith({
        where: { usrCodigo: 1, token: 'ExponentPushToken[xxx]' },
      });
    });
  });
});
