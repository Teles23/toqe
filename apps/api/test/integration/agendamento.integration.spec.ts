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
      .post('/barbearias')
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

  // ─── Walk-in (tipo: WALK_IN) ──────────────────────────────────────────────
  // O backend trata walk-ins como fila paralela ao calendário:
  //   - skip do conflict check (podem coexistir com agendamentos do mesmo horário)
  //   - status inicial PENDENTE (vs CONFIRMADO de agendamentos)
  //   - filtro `tipo` em GET /agendamentos para listar só walk-ins

  describe('Walk-in (tipo=WALK_IN)', () => {
    let walkInCodigo: number;

    it('cria walk-in → 201 com tipo=WALK_IN e status=pendente', async () => {
      const agora = new Date();
      const res = await request(app.getHttpServer())
        .post('/agendamentos')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', barHeader)
        .send({
          barbeiroId,
          clienteId: barbeiroId,
          servicosIds: [servicoId],
          inicio: agora.toISOString(),
          tipo: 'WALK_IN',
        });

      expect(res.status).toBe(201);
      expect(res.body.tipo).toBe('WALK_IN');
      expect(res.body.status).toBe('pendente');
      walkInCodigo = res.body.codigo;
    });

    it('walk-in NO MESMO horário de um agendamento existente → 201 (sem conflito)', async () => {
      // 1. Cria um agendamento normal (AGENDADO) em horário futuro fixo
      const horario = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const agdRes = await request(app.getHttpServer())
        .post('/agendamentos')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', barHeader)
        .send({
          barbeiroId,
          clienteId: barbeiroId,
          servicosIds: [servicoId],
          inicio: horario,
        });
      expect(agdRes.status).toBe(201);

      // 2. Walk-in NO MESMO horário → não deve conflitar
      const walkInRes = await request(app.getHttpServer())
        .post('/agendamentos')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', barHeader)
        .send({
          barbeiroId,
          clienteId: barbeiroId,
          servicosIds: [servicoId],
          inicio: horario,
          tipo: 'WALK_IN',
        });

      expect(walkInRes.status).toBe(201);
      expect(walkInRes.body.tipo).toBe('WALK_IN');
    });

    it('tipo inválido → 400 (validação Zod)', async () => {
      const res = await request(app.getHttpServer())
        .post('/agendamentos')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', barHeader)
        .send({
          barbeiroId,
          clienteId: barbeiroId,
          servicosIds: [servicoId],
          inicio: new Date().toISOString(),
          tipo: 'INVALIDO',
        });

      expect(res.status).toBe(400);
    });

    it('GET /agendamentos?tipo=WALK_IN → retorna só walk-ins', async () => {
      const res = await request(app.getHttpServer())
        .get('/agendamentos?tipo=WALK_IN')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', barHeader);

      expect(res.status).toBe(200);
      const lista = res.body as { codigo: number; tipo: string }[];
      expect(lista.length).toBeGreaterThan(0);
      expect(lista.every((a) => a.tipo === 'WALK_IN')).toBe(true);
      expect(lista.map((a) => a.codigo)).toContain(walkInCodigo);
    });

    it('isolamento de tenant: walk-in da barbearia A não vaza para B', async () => {
      // Cria segunda barbearia para o mesmo dono
      const barBRes = await request(app.getHttpServer())
        .post('/barbearias')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          nome: 'Barbearia B',
          slug: `slug-agd-b-${Date.now()}`,
        });
      expect(barBRes.status).toBe(201);
      const barBHeader = String(barBRes.body.codigo);

      // GET na barbearia B com filtro WALK_IN → não vê walk-ins de A
      const res = await request(app.getHttpServer())
        .get('/agendamentos?tipo=WALK_IN')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', barBHeader);

      expect(res.status).toBe(200);
      const codigos = (res.body as { codigo: number }[]).map((a) => a.codigo);
      expect(codigos).not.toContain(walkInCodigo);
    });
  });
});
