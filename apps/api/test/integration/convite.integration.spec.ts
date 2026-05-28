import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Geração de convite por e-mail (chunk 1/3 — backend).
 *
 * HTTP real + Postgres real (Testcontainers). `RESEND_API_KEY` fica ausente no
 * ambiente de teste → o envio de e-mail é no-op; aqui asserta-se a criação da
 * linha `ConviteBarbearia` e o aceite ponta a ponta pelo fluxo já existente.
 */
describe('Convite (geração por e-mail) Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let donoToken: string;
  let barCodigo: number;
  let conviteEmail: string;

  beforeAll(async () => {
    // Garante o no-op de e-mail (sem chamada real ao Resend).
    delete process.env.RESEND_API_KEY;
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id';

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    const ts = Date.now();
    const donoEmail = `dono_cvt_${ts}@integration.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nome: 'Dono', email: donoEmail, senha: 'Senha@123' });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: donoEmail, senha: 'Senha@123' });
    donoToken = login.body.access_token;

    const bar = await request(app.getHttpServer())
      .post('/barbearias')
      .set('Authorization', `Bearer ${donoToken}`)
      .send({ nome: 'Barbearia Convite', slug: `slug-cvt-${ts}` })
      .expect(201);
    barCodigo = bar.body.codigo;

    conviteEmail = `convidado_${ts}@integration.com`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /barbearias/:id/convite → 201 e cria a linha ConviteBarbearia no Postgres', async () => {
    const res = await request(app.getHttpServer())
      .post(`/barbearias/${barCodigo}/convite`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', String(barCodigo))
      .send({ email: conviteEmail, perfil: 'barbeiro' })
      .expect(201);

    expect(res.body).toMatchObject({
      email: conviteEmail,
      perfil: 'barbeiro',
      reaproveitado: false,
    });
    expect(res.body.codigo).toEqual(expect.any(Number));
    expect(typeof res.body.expiresAt).toBe('string');
    // não vaza o token no retorno
    expect(res.body).not.toHaveProperty('token');

    const convite = await prisma.conviteBarbearia.findUnique({
      where: { codigo: res.body.codigo },
    });
    expect(convite).not.toBeNull();
    expect(convite?.email).toBe(conviteEmail);
    expect(convite?.barCodigo).toBe(barCodigo);
    expect(convite?.perfil).toBe('barbeiro');
    expect(convite?.usadoEm).toBeNull();
    expect(convite?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    // expira ~7 dias no futuro
    expect(convite?.expiresAt.getTime()).toBeLessThanOrEqual(
      Date.now() + 7 * 24 * 60 * 60 * 1000 + 60_000,
    );
  });

  it('perfil default = barbeiro quando omitido no body', async () => {
    const email = `default_${Date.now()}@integration.com`;
    const res = await request(app.getHttpServer())
      .post(`/barbearias/${barCodigo}/convite`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', String(barCodigo))
      .send({ email })
      .expect(201);

    expect(res.body.perfil).toBe('barbeiro');
  });

  it('idempotência: segundo POST para o mesmo e-mail renova (reaproveitado=true) sem duplicar', async () => {
    const res = await request(app.getHttpServer())
      .post(`/barbearias/${barCodigo}/convite`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', String(barCodigo))
      .send({ email: conviteEmail, perfil: 'gerente' })
      .expect(201);

    expect(res.body.reaproveitado).toBe(true);
    expect(res.body.perfil).toBe('gerente'); // perfil atualizado

    const ativos = await prisma.conviteBarbearia.findMany({
      where: { barCodigo, email: conviteEmail, usadoEm: null },
    });
    expect(ativos).toHaveLength(1); // não duplicou
  });

  it('o token gerado é aceitável pelo fluxo de aceite existente (ponta a ponta)', async () => {
    const aceiteEmail = `aceite_${Date.now()}@integration.com`;
    const gen = await request(app.getHttpServer())
      .post(`/barbearias/${barCodigo}/convite`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', String(barCodigo))
      .send({ email: aceiteEmail, perfil: 'barbeiro' })
      .expect(201);

    const convite = await prisma.conviteBarbearia.findUnique({
      where: { codigo: gen.body.codigo },
      select: { token: true },
    });
    const token = convite?.token;
    expect(token).toBeTruthy();

    // GET do convite retorna isNew=true (usuário ainda não existe)
    const info = await request(app.getHttpServer())
      .get(`/convite/${token}`)
      .expect(200);
    expect(info.body.email).toBe(aceiteEmail);
    expect(info.body.isNew).toBe(true);

    // Aceite cria usuário novo + vincula como membro + auto-login
    const aceite = await request(app.getHttpServer())
      .post(`/convite/${token}/aceitar`)
      .send({ nome: 'Convidado', senha: 'Senha@123' })
      .expect(200);
    expect(aceite.body.access_token).toBeTruthy();
    expect(aceite.body.isNew).toBe(true);

    // O convite foi marcado como usado e o membro existe no tenant
    const usado = await prisma.conviteBarbearia.findUnique({
      where: { codigo: gen.body.codigo },
      select: { usadoEm: true },
    });
    expect(usado?.usadoEm).not.toBeNull();

    const usuario = await prisma.usuario.findUnique({
      where: { email: aceiteEmail },
      select: { codigo: true },
    });
    expect(usuario).not.toBeNull();
    const membro = await prisma.membroBarbearia.findFirst({
      where: { barCodigo, usrCodigo: usuario!.codigo },
    });
    expect(membro?.perfil).toBe('barbeiro');
  });
});
