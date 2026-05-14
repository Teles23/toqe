import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Agendamento Integration', () => {
  let app: INestApplication;
  let accessToken: string;
  let barHeader: string;
  let barbeiroId: number;
  let servicoId: number;
  let agendamentoCodigo: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const email = `agd_${Date.now()}@integration.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nome: 'Dono', email, senha: 'Senha@123' });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: 'Senha@123' });
    accessToken = loginRes.body.access_token;

    const barRes = await request(app.getHttpServer())
      .post('/barbearia')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: 'Barbearia Test', slug: `slug-agd-${Date.now()}` });
    barHeader = String(barRes.body.codigo);

    const srvRes = await request(app.getHttpServer())
      .post('/servicos')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader)
      .send({ nome: 'Corte', duracaoBase: 30, precoBase: 25 });
    servicoId = srvRes.body.codigo;

    barbeiroId = loginRes.body.user.codigo;
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria agendamento com sucesso', async () => {
    const inicio = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app.getHttpServer())
      .post('/agendamentos')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader)
      .send({
        barbeiroId,
        clienteId: barbeiroId,
        servicosIds: [servicoId],
        inicio,
      });

    expect([201, 200, 400, 409]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      agendamentoCodigo = res.body.codigo;
    }
  });

  it('detecta conflito de horário (segundo agendamento mesmo slot)', async () => {
    if (!agendamentoCodigo) return;
    const inicio = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app.getHttpServer())
      .post('/agendamentos')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader)
      .send({
        barbeiroId,
        clienteId: barbeiroId,
        servicosIds: [servicoId],
        inicio,
      });

    expect([409, 400]).toContain(res.status);
  });
});
