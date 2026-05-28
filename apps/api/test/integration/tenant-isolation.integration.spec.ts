import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Tenant Isolation Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenA: string;
  let tokenB: string;
  let barCodigoA: string;
  let barCodigoB: string;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id';

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

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
      .post('/barbearias')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nome: 'Bar A', slug: `bar-a-${ts}` });
    barCodigoA = String(barA.body.codigo);

    const barB = await request(app.getHttpServer())
      .post('/barbearias')
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

    expect(res.status).toBe(200);
    const nomes = (res.body as { nome: string }[]).map((s) => s.nome);
    expect(nomes).not.toContain('Serviço A');
  });

  describe('Plano bloqueado bloqueia endpoint protegido', () => {
    let tokenP: string;
    let barBloqueada: string;
    let barLivre: string;

    beforeAll(async () => {
      const ts = Date.now();

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          nome: 'Dono Plano',
          email: `tenantP_${ts}@int.com`,
          senha: 'Senha@123',
        });
      const loginP = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: `tenantP_${ts}@int.com`, senha: 'Senha@123' });
      tokenP = loginP.body.access_token;

      const bloq = await request(app.getHttpServer())
        .post('/barbearias')
        .set('Authorization', `Bearer ${tokenP}`)
        .send({ nome: 'Bar Bloqueada', slug: `bar-bloq-${ts}` });
      barBloqueada = String(bloq.body.codigo);

      const livre = await request(app.getHttpServer())
        .post('/barbearias')
        .set('Authorization', `Bearer ${tokenP}`)
        .send({ nome: 'Bar Livre', slug: `bar-livre-${ts}` });
      barLivre = String(livre.body.codigo);
    });

    it('planoStatus=inadimplente → GET /servicos retorna 403 com a mensagem', async () => {
      await prisma.barbearia.update({
        where: { codigo: Number(barBloqueada) },
        data: { planoStatus: 'inadimplente' },
      });

      const res = await request(app.getHttpServer())
        .get('/servicos')
        .set('Authorization', `Bearer ${tokenP}`)
        .set('x-tenant-id', barBloqueada);

      expect(res.status).toBe(403);
      expect((res.body as { message: string }).message).toContain(
        'inadimplente',
      );
    });

    it('planoStatus=cancelado → GET /servicos retorna 403 com a mensagem', async () => {
      await prisma.barbearia.update({
        where: { codigo: Number(barBloqueada) },
        data: { planoStatus: 'cancelado' },
      });

      const res = await request(app.getHttpServer())
        .get('/servicos')
        .set('Authorization', `Bearer ${tokenP}`)
        .set('x-tenant-id', barBloqueada);

      expect(res.status).toBe(403);
      expect((res.body as { message: string }).message).toContain('cancelado');
    });

    it('planoStatus=ativo → GET /servicos retorna 200', async () => {
      await prisma.barbearia.update({
        where: { codigo: Number(barBloqueada) },
        data: { planoStatus: 'ativo' },
      });

      const res = await request(app.getHttpServer())
        .get('/servicos')
        .set('Authorization', `Bearer ${tokenP}`)
        .set('x-tenant-id', barBloqueada);

      expect(res.status).toBe(200);
    });

    it('bloquear uma barbearia não afeta outra ativa do mesmo dono', async () => {
      await prisma.barbearia.update({
        where: { codigo: Number(barBloqueada) },
        data: { planoStatus: 'cancelado' },
      });
      await prisma.barbearia.update({
        where: { codigo: Number(barLivre) },
        data: { planoStatus: 'ativo' },
      });

      const bloqueada = await request(app.getHttpServer())
        .get('/servicos')
        .set('Authorization', `Bearer ${tokenP}`)
        .set('x-tenant-id', barBloqueada);
      expect(bloqueada.status).toBe(403);

      const livre = await request(app.getHttpServer())
        .get('/servicos')
        .set('Authorization', `Bearer ${tokenP}`)
        .set('x-tenant-id', barLivre);
      expect(livre.status).toBe(200);
    });
  });
});
