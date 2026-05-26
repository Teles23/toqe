import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Integração dos endpoints /servicos/barbeiro contra um Postgres REAL
 * (Testcontainers + migrations aplicadas). Valida o que os unit specs (Prisma
 * mockado) não conseguem: upsert por compound key, unique de nome (409), a flag
 * de permissão lida da barbearia real, ownership e a lista consolidada montada
 * a partir de linhas reais.
 */
describe('Serviços do barbeiro — Integration', () => {
  let app: INestApplication;
  let donoToken: string;
  let barbeiroToken: string;
  let barCodigo: string;
  let srvCodigo: number;
  let barbeiroId: number;
  let donoId: number;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id';

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();

    const server = app.getHttpServer();
    const ts = Date.now();
    const donoEmail = `dono_srv_${ts}@integration.com`;
    const barbEmail = `barb_srv_${ts}@integration.com`;

    const register = (email: string) =>
      request(server)
        .post('/auth/register')
        .send({ nome: 'User', email, senha: 'Senha@123' });
    const login = async (email: string) => {
      const res = await request(server)
        .post('/auth/login')
        .send({ email, senha: 'Senha@123' });
      return res.body.access_token as string;
    };

    await register(donoEmail);
    donoToken = await login(donoEmail);
    await register(barbEmail);

    const barRes = await request(server)
      .post('/barbearias')
      .set('Authorization', `Bearer ${donoToken}`)
      .send({ nome: 'Barbearia Serviços', slug: `srv-${ts}` })
      .expect(201);
    barCodigo = String(barRes.body.codigo);

    await request(server)
      .post(`/barbearias/${barCodigo}/membros`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ email: barbEmail, perfil: 'barbeiro' });

    barbeiroToken = await login(barbEmail);

    const membros = await request(server)
      .get(`/barbearias/${barCodigo}/membros`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', barCodigo)
      .expect(200);
    donoId = membros.body.find(
      (m: { perfil: string }) => m.perfil === 'dono',
    ).usrCodigo;
    barbeiroId = membros.body.find(
      (m: { perfil: string }) => m.perfil === 'barbeiro',
    ).usrCodigo;

    const srvRes = await request(server)
      .post('/servicos')
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ nome: 'Corte', precoBase: 40, duracaoBase: 30 })
      .expect(201);
    srvCodigo = srvRes.body.codigo;
  });

  afterAll(async () => {
    await app.close();
  });

  const getConsolidado = (barbId: number) =>
    request(app.getHttpServer())
      .get(`/servicos/barbeiro/${barbId}`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', barCodigo);

  it('lista consolidada: serviço da barbearia sem registro = base, ativo, não-exclusivo', async () => {
    const res = await getConsolidado(barbeiroId).expect(200);
    const item = res.body.find(
      (s: { servico: { codigo: number } }) => s.servico.codigo === srvCodigo,
    );
    expect(item).toBeDefined();
    expect(item.barbeiro).toBeNull();
    expect(item.precoEfetivo).toBe(40);
    expect(item.duracaoEfetiva).toBe(30);
    expect(item.exclusivo).toBe(false);
  });

  it('PATCH ativo=false cria o registro (upsert) e a lista reflete', async () => {
    await request(app.getHttpServer())
      .patch(`/servicos/barbeiro/${barbeiroId}/${srvCodigo}`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ ativo: false })
      .expect(200);

    const res = await getConsolidado(barbeiroId).expect(200);
    const item = res.body.find(
      (s: { servico: { codigo: number } }) => s.servico.codigo === srvCodigo,
    );
    expect(item.barbeiro.ativo).toBe(false);
  });

  it('PUT preço/duração (dono pode sempre) atualiza o registro (upsert update)', async () => {
    await request(app.getHttpServer())
      .put(`/servicos/barbeiro/${barbeiroId}/${srvCodigo}`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ precoProprio: 55, duracaoMin: 45 })
      .expect(200);

    const res = await getConsolidado(barbeiroId).expect(200);
    const item = res.body.find(
      (s: { servico: { codigo: number } }) => s.servico.codigo === srvCodigo,
    );
    expect(item.precoEfetivo).toBe(55);
    expect(item.duracaoEfetiva).toBe(45);
  });

  it('barbeiro SEM permissão (flag false) recebe 403 ao alterar preço', async () => {
    await request(app.getHttpServer())
      .put(`/servicos/barbeiro/${barbeiroId}/${srvCodigo}`)
      .set('Authorization', `Bearer ${barbeiroToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ precoProprio: 70, duracaoMin: 30 })
      .expect(403);
  });

  it('dono habilita barbeiroAlteraPreco → barbeiro passa a conseguir alterar', async () => {
    await request(app.getHttpServer())
      .put(`/barbearias/${barCodigo}`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ barbeiroAlteraPreco: true })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/servicos/barbeiro/${barbeiroId}/${srvCodigo}`)
      .set('Authorization', `Bearer ${barbeiroToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ precoProprio: 70, duracaoMin: 30 })
      .expect(200);
  });

  it('barbeiro NÃO pode gerenciar serviços de outro barbeiro (ownership 403)', async () => {
    await request(app.getHttpServer())
      .patch(`/servicos/barbeiro/${donoId}/${srvCodigo}`)
      .set('Authorization', `Bearer ${barbeiroToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ ativo: false })
      .expect(403);
  });

  it('cria serviço exclusivo (dono) e ele aparece na lista como exclusivo; nome duplicado → 409', async () => {
    const nome = `Exclusivo ${Date.now()}`;
    await request(app.getHttpServer())
      .post(`/servicos/barbeiro/${barbeiroId}`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ nome, precoBase: 60, duracaoBase: 40 })
      .expect(201);

    const res = await getConsolidado(barbeiroId).expect(200);
    const excl = res.body.find(
      (s: { servico: { nome: string } }) => s.servico.nome === nome,
    );
    expect(excl).toBeDefined();
    expect(excl.exclusivo).toBe(true);

    // nome duplicado na mesma barbearia → 409
    await request(app.getHttpServer())
      .post(`/servicos/barbeiro/${barbeiroId}`)
      .set('Authorization', `Bearer ${donoToken}`)
      .set('x-tenant-id', barCodigo)
      .send({ nome, precoBase: 60, duracaoBase: 40 })
      .expect(409);
  });
});
