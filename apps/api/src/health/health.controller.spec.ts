import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const mockPrisma = { $queryRaw: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new HealthController(
      mockPrisma as unknown as import('../prisma/prisma.service').PrismaService,
    );
  });

  describe('live', () => {
    it('should return { status: "ok" } synchronously', () => {
      const result = controller.live();
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('ready', () => {
    it('should return { status: "ok", db: "connected" } when $queryRaw resolves', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

      const result = await controller.ready();

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok', db: 'connected' });
    });

    it('should propagate error when $queryRaw rejects', async () => {
      const dbError = new Error('DB connection failed');
      mockPrisma.$queryRaw.mockRejectedValueOnce(dbError);

      await expect(controller.ready()).rejects.toThrow('DB connection failed');
    });
  });
});
