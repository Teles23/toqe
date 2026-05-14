import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Security (supertest)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('POST /barbearia without auth → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/barbearia')
      .send({ nome: 'Test', slug: 'test' });
    expect(res.status).toBe(401);
  });

  it('GET /relatorios/faturamento without tenant header → 400 ou 401', async () => {
    const res = await request(app.getHttpServer()).get(
      '/relatorios/faturamento',
    );
    expect([400, 401]).toContain(res.status);
  });
});
