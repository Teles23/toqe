import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Auth Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const email = `test_${Date.now()}@integration.com`;
  const senha = 'Senha@123';
  let refreshToken: string;

  it('register → cria usuário', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nome: 'Integração', email, senha })
      .expect(201);

    expect(res.body).toHaveProperty('email', email);
  });

  it('login → retorna access e refresh token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    refreshToken = res.body.refresh_token;
  });

  it('refresh → rotação real no banco', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body.refresh_token).not.toBe(refreshToken);
    refreshToken = res.body.refresh_token;
  });

  it('logout → revoga token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha });
    const token = loginRes.body.access_token;
    const rt = loginRes.body.refresh_token;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken: rt })
      .expect(200);
  });
});
