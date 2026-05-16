import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Security (supertest)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id';

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
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

  it('POST /barbearias without auth → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/barbearias')
      .send({ nome: 'Test', slug: 'test' });
    expect(res.status).toBe(401);
  });

  it('GET /barbearias/1/relatorios/faturamento without auth → 401', async () => {
    const res = await request(app.getHttpServer()).get(
      '/barbearias/1/relatorios/faturamento',
    );
    expect(res.status).toBe(401);
  });
});
