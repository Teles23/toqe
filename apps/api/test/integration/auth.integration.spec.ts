import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import {
  GOOGLE_TOKEN_VERIFIER,
  type GoogleTokenVerifier,
} from '../../src/auth/google-token-verifier';

// Stub determinístico — substitui o impl real (google-auth-library) na suite.
// Cada teste pode reconfigurar via `(stubVerifier.verify as jest.Mock).mockXxx(...)`.
const stubVerifier: GoogleTokenVerifier = {
  verify: jest.fn(),
};

describe('Auth Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Garante que o impl real não tente ler GOOGLE_CLIENT_ID na inicialização
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id';

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GOOGLE_TOKEN_VERIFIER)
      .useValue(stubVerifier)
      .compile();

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

  // ─── Google Auth (DI: stub verifier substitui google-auth-library) ──────
  // Estratégia: o impl real `GoogleAuthLibraryVerifier` é substituído via
  // overrideProvider por um stub. Isso é Dependency Inversion (interface +
  // DI), NÃO mock do SUT — o fluxo completo (controller → service → DB →
  // generateTokens) executa contra Postgres real via Testcontainers.

  describe('POST /auth/google', () => {
    const verifySpy = stubVerifier.verify as jest.Mock;
    let googleAccessToken: string;
    let googleRefreshToken: string;

    beforeEach(() => {
      verifySpy.mockReset();
    });

    it('email NOVO → cria user OAuth com senhaHash null + emite tokens', async () => {
      const googleEmail = `google_${Date.now()}@gmail.com`;
      verifySpy.mockResolvedValueOnce({
        email: googleEmail,
        nome: 'Usuário Google',
        avatarUrl: 'https://avatar/x.png',
      });

      const res = await request(app.getHttpServer())
        .post('/auth/google')
        .send({ idToken: 'fake_google_id_token' })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      expect(res.body.user.email).toBe(googleEmail);
      expect(verifySpy).toHaveBeenCalledWith('fake_google_id_token');

      googleAccessToken = res.body.access_token;
      googleRefreshToken = res.body.refresh_token;
    });

    it('email EXISTENTE → reusa user, NÃO duplica', async () => {
      // Primeiro login Google
      const sameEmail = `google_reuse_${Date.now()}@gmail.com`;
      verifySpy.mockResolvedValue({
        email: sameEmail,
        nome: 'Reuso',
        avatarUrl: null,
      });

      const firstRes = await request(app.getHttpServer())
        .post('/auth/google')
        .send({ idToken: 't1' })
        .expect(200);
      const firstCodigo = firstRes.body.user.codigo;

      // Segundo login Google com MESMO email
      const secondRes = await request(app.getHttpServer())
        .post('/auth/google')
        .send({ idToken: 't2' })
        .expect(200);

      // Mesmo user.codigo → reusou
      expect(secondRes.body.user.codigo).toBe(firstCodigo);
    });

    it('idToken inválido (verifier lança) → 401', async () => {
      verifySpy.mockRejectedValueOnce(
        new UnauthorizedException('ID token Google inválido'),
      );

      await request(app.getHttpServer())
        .post('/auth/google')
        .send({ idToken: 'invalid' })
        .expect(401);
    });

    it('user OAuth NÃO consegue logar com /auth/login (senhaHash null)', async () => {
      const oauthEmail = `oauth_only_${Date.now()}@gmail.com`;
      verifySpy.mockResolvedValueOnce({
        email: oauthEmail,
        nome: 'OAuth',
        avatarUrl: null,
      });
      await request(app.getHttpServer())
        .post('/auth/google')
        .send({ idToken: 'tx' })
        .expect(200);

      // Agora tenta login normal — deve falhar com 401 (sem senha)
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: oauthEmail, senha: 'qualquer_senha' })
        .expect(401);

      expect(res.body.message).toMatch(/Google/i);
    });

    it('refresh do token Google funciona igual ao login email', async () => {
      // Reusa tokens do primeiro teste (mesmo describe, ordem sequencial)
      expect(googleRefreshToken).toBeTruthy();

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: googleRefreshToken })
        .expect(201);

      expect(res.body.access_token).toBeTruthy();
      expect(res.body.access_token).not.toBe(googleAccessToken);
      expect(res.body.refresh_token).not.toBe(googleRefreshToken);
    });
  });
});
