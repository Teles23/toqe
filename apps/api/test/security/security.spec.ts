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

  describe('POST /barbearias/:id/convite (geração de convite)', () => {
    let donoToken: string;
    let barbeiroToken: string;
    let estranhoToken: string;
    let barCodigo: number;

    beforeAll(async () => {
      const ts = Date.now();

      // Dono: cria a barbearia
      const donoEmail = `sec_dono_${ts}@x.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nome: 'Dono', email: donoEmail, senha: 'Senha@123' });
      donoToken = (
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: donoEmail, senha: 'Senha@123' })
      ).body.access_token;

      const bar = await request(app.getHttpServer())
        .post('/barbearias')
        .set('Authorization', `Bearer ${donoToken}`)
        .send({ nome: 'Sec Convite', slug: `sec-cvt-${ts}` });
      barCodigo = bar.body.codigo;

      // Barbeiro: usuário existente vinculado como 'barbeiro' (role insuficiente)
      const barbeiroEmail = `sec_barbeiro_${ts}@x.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nome: 'Barbeiro', email: barbeiroEmail, senha: 'Senha@123' });
      await request(app.getHttpServer())
        .post(`/barbearias/${barCodigo}/membros`)
        .set('Authorization', `Bearer ${donoToken}`)
        .set('x-tenant-id', String(barCodigo))
        .send({ email: barbeiroEmail, perfil: 'barbeiro' });
      barbeiroToken = (
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: barbeiroEmail, senha: 'Senha@123' })
      ).body.access_token;

      // Estranho: usuário autenticado que NÃO é membro da barbearia
      const estranhoEmail = `sec_estranho_${ts}@x.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nome: 'Estranho', email: estranhoEmail, senha: 'Senha@123' });
      estranhoToken = (
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: estranhoEmail, senha: 'Senha@123' })
      ).body.access_token;
    });

    it('sem Authorization → 401', async () => {
      const res = await request(app.getHttpServer())
        .post(`/barbearias/${barCodigo}/convite`)
        .set('x-tenant-id', String(barCodigo))
        .send({ email: 'alvo@x.com', perfil: 'barbeiro' });
      expect(res.status).toBe(401);
    });

    it('usuário que não é membro da barbearia → 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/barbearias/${barCodigo}/convite`)
        .set('Authorization', `Bearer ${estranhoToken}`)
        .set('x-tenant-id', String(barCodigo))
        .send({ email: 'alvo@x.com', perfil: 'barbeiro' });
      expect(res.status).toBe(403);
    });

    it('membro com perfil insuficiente (barbeiro) → 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/barbearias/${barCodigo}/convite`)
        .set('Authorization', `Bearer ${barbeiroToken}`)
        .set('x-tenant-id', String(barCodigo))
        .send({ email: 'alvo@x.com', perfil: 'barbeiro' });
      expect(res.status).toBe(403);
    });

    it('dono da barbearia → 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`/barbearias/${barCodigo}/convite`)
        .set('Authorization', `Bearer ${donoToken}`)
        .set('x-tenant-id', String(barCodigo))
        .send({ email: `alvo_${Date.now()}@x.com`, perfil: 'barbeiro' });
      expect(res.status).toBe(201);
    });
  });
});
