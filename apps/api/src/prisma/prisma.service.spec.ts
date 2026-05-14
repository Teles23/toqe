import { PrismaService } from './prisma.service';

jest.mock('../generated/prisma', () => ({
  PrismaClient: class MockPrismaClient {
    constructor(_opts?: unknown) {}
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);
  },
}));
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({})),
}));

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
    jest.spyOn(service, '$connect').mockResolvedValue();
    jest.spyOn(service, '$disconnect').mockResolvedValue();
  });

  afterEach(() => jest.clearAllMocks());

  it('onModuleInit chama $connect', async () => {
    await service.onModuleInit();
    expect(service.$connect).toHaveBeenCalled();
  });

  it('onModuleDestroy chama $disconnect', async () => {
    await service.onModuleDestroy();
    expect(service.$disconnect).toHaveBeenCalled();
  });
});
