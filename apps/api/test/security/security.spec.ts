import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../../src/auth/auth.module';
import { PrismaService } from '../../src/prisma/prisma.service';

const mockPrisma = {
  usuario: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
  },
  membroBarbearia: { findMany: jest.fn() },
  $queryRaw: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

describe('Security (supertest)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login without body → 400', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('GET /agendamentos without Authorization → 401', async () => {
    const res = await request(app.getHttpServer()).get('/agendamentos');
    expect(res.status).toBe(401);
  });

  it('GET /agendamentos with invalid token → 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/agendamentos')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});
