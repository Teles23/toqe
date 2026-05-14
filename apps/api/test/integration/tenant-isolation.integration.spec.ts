import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Tenant Isolation Integration', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;
  let barCodigoA: string;
  let barCodigoB: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const ts = Date.now();

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nome: 'Dono A',
        email: `tenantA_${ts}@int.com`,
        senha: 'Senha@123',
      });
    const loginA = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `tenantA_${ts}@int.com`, senha: 'Senha@123' });
    tokenA = loginA.body.access_token;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nome: 'Dono B',
        email: `tenantB_${ts}@int.com`,
        senha: 'Senha@123',
      });
    const loginB = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `tenantB_${ts}@int.com`, senha: 'Senha@123' });
    tokenB = loginB.body.access_token;

    const barA = await request(app.getHttpServer())
      .post('/barbearia')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nome: 'Bar A', slug: `bar-a-${ts}` });
    barCodigoA = String(barA.body.codigo);

    const barB = await request(app.getHttpServer())
      .post('/barbearia')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ nome: 'Bar B', slug: `bar-b-${ts}` });
    barCodigoB = String(barB.body.codigo);

    await request(app.getHttpServer())
      .post('/servicos')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-tenant-id', barCodigoA)
      .send({ nome: 'Serviço A', duracaoBase: 30, precoBase: 20 });
  });

  afterAll(async () => {
    await app.close();
  });

  it('serviços de barbearia A não aparecem em barbearia B', async () => {
    const res = await request(app.getHttpServer())
      .get('/servicos')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-tenant-id', barCodigoB);

    expect([200]).toContain(res.status);
    const nomes = (res.body as any[]).map((s: any) => s.nome);
    expect(nomes).not.toContain('Serviço A');
  });
});
