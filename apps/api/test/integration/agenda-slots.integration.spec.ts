import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Integração (Postgres real) dos slots ancorados em America/Sao_Paulo.
 *
 * Fecha o flanco do fix do doc 76 (off-by-one): o unit test mockava o Prisma;
 * aqui provamos contra o banco real, via HTTP, que pedir o dia X retorna o dia X
 * no fuso BRT — e que slots ocupados (agendamento) e horário de almoço somem.
 *
 * Data escolhida: 2026-06-15 → SEGUNDA-feira (diaSemana 1) em BRT.
 * O dia em America/Sao_Paulo (UTC-3) começa às 03:00:00Z. Se a API parseasse
 * "2026-06-15" como meia-noite UTC + startOfDay local (UTC-3), cairia em
 * 2026-06-14 (DOMINGO, diaSemana 0) → como NÃO configuramos jornada de domingo,
 * a lista viria vazia. Recebê-la preenchida prova que o dia certo foi usado.
 */
describe('Agenda Slots Integration (fuso America/Sao_Paulo)', () => {
  let app: INestApplication;
  let accessToken: string;
  let barHeader: string;
  let barbeiroId: number;
  let servicoId: number;

  // Jornada de SEGUNDA: 09:00–15:00 com almoço 12:00–13:00.
  // slotInterval da barbearia = 30 (default), serviço de 30min →
  // slots esperados (sem ocupação): 09:00 09:30 10:00 10:30 11:00 11:30
  //                                 13:00 13:30 14:00 14:30
  // (12:00 e 12:30 caem no almoço; 14:30+30=15:00 = fim, ainda cabe).
  const DATA = '2026-06-15';
  const DIA_SEMANA_SEGUNDA = 1;
  const SLOTS_ESPERADOS = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
  ];
  // 10:00 BRT (UTC-3) = 13:00:00Z — instante que o agendamento vai ocupar.
  const INICIO_AGENDAMENTO_ISO = '2026-06-15T13:00:00.000Z';

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID =
      process.env.GOOGLE_CLIENT_ID ?? 'test-google-client-id';

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const email = `slots_${Date.now()}@integration.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nome: 'Dono Slots', email, senha: 'Senha@123' });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: 'Senha@123' });
    accessToken = loginRes.body.access_token;
    // O dono registrado é membro da barbearia (perfil dono) → passa no check
    // de pertencimento ao tenant em getAvailableSlots.
    barbeiroId = loginRes.body.user.codigo;

    const barRes = await request(app.getHttpServer())
      .post('/barbearias')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: 'Barbearia Slots', slug: `slug-slots-${Date.now()}` });
    expect(barRes.status).toBe(201);
    barHeader = String(barRes.body.codigo);

    const srvRes = await request(app.getHttpServer())
      .post('/servicos')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader)
      .send({ nome: 'Corte', duracaoBase: 30, precoBase: 25 });
    expect(srvRes.status).toBe(201);
    servicoId = srvRes.body.codigo;

    // Configura a jornada da SEGUNDA (diaSemana 1) com almoço.
    const jornadaRes = await request(app.getHttpServer())
      .post(`/agenda/jornada/${barbeiroId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader)
      .send({
        diaSemana: DIA_SEMANA_SEGUNDA,
        inicio: '09:00',
        fim: '15:00',
        almocoIni: '12:00',
        almocoFim: '13:00',
      });
    expect(jornadaRes.status).toBe(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('pedir o dia X (2026-06-15, segunda BRT) retorna a jornada de segunda, não a de domingo (regressão off-by-one)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/agenda/disponibilidade/${barbeiroId}`)
      .query({ data: DATA, duracao: 30 })
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader);

    expect(res.status).toBe(200);
    // Domingo (diaSemana 0) não tem jornada — se o range tivesse andado um dia
    // para trás, a lista viria vazia. Vir preenchida prova o dia-calendário certo.
    expect((res.body as string[]).length).toBeGreaterThan(0);
    expect(res.body).toEqual(SLOTS_ESPERADOS);
  });

  it('não retorna os horários do almoço (12:00 e 12:30)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/agenda/disponibilidade/${barbeiroId}`)
      .query({ data: DATA, duracao: 30 })
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader);

    expect(res.status).toBe(200);
    const slots = res.body as string[];
    expect(slots).not.toContain('12:00');
    expect(slots).not.toContain('12:30');
    // sanidade: bordas do almoço continuam disponíveis
    expect(slots).toContain('11:30');
    expect(slots).toContain('13:00');
  });

  it('agendamento real ocupando 10:00 BRT (13:00Z) remove esse slot da lista', async () => {
    // Antes: 10:00 disponível
    const antes = await request(app.getHttpServer())
      .get(`/agenda/disponibilidade/${barbeiroId}`)
      .query({ data: DATA, duracao: 30 })
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader);
    expect(antes.status).toBe(200);
    expect(antes.body as string[]).toContain('10:00');

    // Cria um agendamento REAL ocupando 10:00 BRT (= 2026-06-15T13:00:00Z)
    const agdRes = await request(app.getHttpServer())
      .post('/agendamentos')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader)
      .send({
        barbeiroId,
        clienteId: barbeiroId,
        servicosIds: [servicoId],
        inicio: INICIO_AGENDAMENTO_ISO,
      });
    expect(agdRes.status).toBe(201);

    // Depois: 10:00 sumiu, demais permanecem
    const depois = await request(app.getHttpServer())
      .get(`/agenda/disponibilidade/${barbeiroId}`)
      .query({ data: DATA, duracao: 30 })
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-tenant-id', barHeader);
    expect(depois.status).toBe(200);
    const slots = depois.body as string[];
    expect(slots).not.toContain('10:00');
    // slots vizinhos seguem livres
    expect(slots).toContain('09:30');
    expect(slots).toContain('10:30');
    expect(slots).toEqual(SLOTS_ESPERADOS.filter((s) => s !== '10:00'));
  });
});
