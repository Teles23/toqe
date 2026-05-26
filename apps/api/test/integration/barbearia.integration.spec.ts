import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Barbearia Integration', () => {
  let app: INestApplication;
  let accessToken: string;
  let barCodigo: string;
  let membroEmail: string;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id';

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const email = `bar_${Date.now()}@integration.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nome: 'Dono', email, senha: 'Senha@123' });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: 'Senha@123' });
    accessToken = loginRes.body.access_token;

    membroEmail = `membro_${Date.now()}@integration.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nome: 'Membro', email: membroEmail, senha: 'Senha@123' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria barbearia', async () => {
    const res = await request(app.getHttpServer())
      .post('/barbearias')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: 'Barbearia Integração', slug: `slug-bar-${Date.now()}` })
      .expect(201);

    expect(res.body).toHaveProperty('codigo');
    barCodigo = String(res.body.codigo);
  });

  it('convida membro', async () => {
    const res = await request(app.getHttpServer())
      .post(`/barbearias/${barCodigo}/membros`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ email: membroEmail, perfil: 'barbeiro' });

    expect([201, 200]).toContain(res.status);
  });

  it('lista membros da barbearia', async () => {
    const res = await request(app.getHttpServer())
      .get(`/barbearias/${barCodigo}/membros`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barCodigo);

    expect([200]).toContain(res.status);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
