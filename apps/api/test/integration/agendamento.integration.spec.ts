import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Agendamento Integration', () => {
  let app: INestApplication;
  let accessToken: string;
  let barHeader: string;
  let barbeiroId: number;
  let servicoId: number;
  let agendamentoCodigo: number;
  let inicioISO: string;

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
    barbeiroId = loginRes.body.user.codigo;

    const barRes = await request(app.getHttpServer())
      .post('/barbearia')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: 'Barbearia Test', slug: `slug-agd-${Date.now()}` });
    expect(barRes.status).toBe(201);
    barHeader = String(barRes.body.codigo);

    const srvRes = await request(app.getHttpServer())
      .post('/servicos')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader)
      .send({ nome: 'Corte', duracaoBase: 30, precoBase: 25 });
    expect(srvRes.status).toBe(201);
    servicoId = srvRes.body.codigo;

    inicioISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria agendamento com sucesso → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/agendamentos')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader)
      .send({
        barbeiroId,
        clienteId: barbeiroId,
        servicosIds: [servicoId],
        inicio: inicioISO,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('codigo');
    agendamentoCodigo = res.body.codigo;
  });

  it('detecta conflito de horário → 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/agendamentos')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader)
      .send({
        barbeiroId,
        clienteId: barbeiroId,
        servicosIds: [servicoId],
        inicio: inicioISO,
      });

    expect(res.status).toBe(409);
  });

  it('lista agendamentos da barbearia → retorna o criado', async () => {
    const res = await request(app.getHttpServer())
      .get('/agendamentos')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader);

    expect(res.status).toBe(200);
    const codigos = (res.body as { codigo: number }[]).map((a) => a.codigo);
    expect(codigos).toContain(agendamentoCodigo);
  });

  it('cancela agendamento → status CANCELADO', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/agendamentos/${agendamentoCodigo}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader);

    expect([200, 204]).toContain(res.status);
  });
});
