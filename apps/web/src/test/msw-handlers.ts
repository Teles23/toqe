import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const BASE = "http://localhost:3000/api/v1";

export const handlers = [
  // ── Auth (via Next.js BFF) ───────────────────────────────────────────────
  http.post("/auth/login", () =>
    HttpResponse.json({
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      user: { codigo: 1, nome: "Test", email: "test@test.com" },
    }),
  ),
  http.post("/api/auth/login", () =>
    HttpResponse.json({
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      user: { codigo: 1, nome: "Test", email: "test@test.com" },
    }),
  ),
  http.post("/api/auth/logout", () => HttpResponse.json({ ok: true })),
  http.post("/api/auth/forgot-password", () =>
    HttpResponse.json({
      message:
        "Se o e-mail estiver cadastrado, você receberá um link em breve.",
    }),
  ),
  http.post("/api/auth/reset-password", () =>
    HttpResponse.json({ message: "Senha redefinida com sucesso." }),
  ),
  http.post("/api/auth/change-password", () => HttpResponse.json({ ok: true })),
  http.get("/api/auth/check-email", () => HttpResponse.json({ exists: false })),

  // ── Sessões ──────────────────────────────────────────────────────────────
  http.get("/api/auth/sessions", () =>
    HttpResponse.json([
      {
        codigo: 1,
        criadoEm: new Date().toISOString(),
        expiraEm: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      },
    ]),
  ),
  http.delete(
    "/api/auth/sessions",
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.delete(
    "/api/auth/sessions/:id",
    () => new HttpResponse(null, { status: 204 }),
  ),

  // ── 2FA ──────────────────────────────────────────────────────────────────
  http.post("/api/auth/2fa/setup", () =>
    HttpResponse.json({
      qrCode: "data:image/png;base64,mock",
      secret: "MOCK2FASECRET",
    }),
  ),
  http.post("/api/auth/2fa/enable", () => HttpResponse.json({ ok: true })),
  http.post("/api/auth/2fa/disable", () => HttpResponse.json({ ok: true })),
  http.post("/api/auth/2fa/verify", () => HttpResponse.json({ ok: true })), // BFF seta cookies; resposta não é usada pelo cliente

  // ── Upload logo ───────────────────────────────────────────────────────────
  http.post("/api/configuracoes/logo/:barCodigo", () =>
    HttpResponse.json({ logoUrl: "/uploads/logos/mock-logo.jpg" }),
  ),

  // ── Usuário ──────────────────────────────────────────────────────────────
  http.get(`${BASE}/usuarios/me`, () =>
    HttpResponse.json({
      codigo: 1,
      nome: "Test User",
      email: "test@test.com",
      telefone: null,
      avatarUrl: null,
      twoFaEnabled: false,
      barbearias: [
        { codigo: 1, nome: "BarberShop", slug: "barbershop", perfil: "dono" },
      ],
    }),
  ),

  // ── Barbearia ────────────────────────────────────────────────────────────
  http.get(`${BASE}/barbearias/:barCodigo`, ({ params }) =>
    HttpResponse.json({
      codigo: Number(params["barCodigo"]),
      nome: "BarberShop",
      slug: "barbershop",
      telefone: null,
      email: null,
      endereco: null,
      logoUrl: null,
      timezone: "America/Sao_Paulo",
      plano: "basic",
      ativo: true,
      criadoEm: new Date().toISOString(),
    }),
  ),

  // ── Barbeiros ────────────────────────────────────────────────────────────
  http.get(`${BASE}/barbearias/:barCodigo/barbeiros`, () =>
    HttpResponse.json([
      {
        codigo: 10,
        nome: "Carlos Silva",
        email: "carlos@test.com",
        telefone: null,
        avatarUrl: null,
        perfil: "barbeiro",
        atendimentosHoje: 3,
        atendimentosMes: 40,
        faturamentoMes: 2000,
        ticketMedio: 50,
      },
    ]),
  ),

  http.post(`${BASE}/barbearias/:barCodigo/membros`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body, { status: 201 });
  }),

  http.delete(
    `${BASE}/barbearias/:barCodigo/membros/:usrCodigo`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  // ── Clientes ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/barbearias/:barCodigo/clientes`, () =>
    HttpResponse.json([
      {
        codigo: 20,
        nome: "Ana Lima",
        email: "ana@test.com",
        telefone: null,
        avatarUrl: null,
        perfil: "cliente",
        totalVisitas: 5,
        totalGasto: 250,
        ticketMedio: 50,
        ultimaVisita: new Date().toISOString(),
        servicoFav: "Corte",
      },
    ]),
  ),

  http.post(`${BASE}/barbearias/:barCodigo/clientes`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { codigo: 21, perfil: "cliente", ...(body as object) },
      { status: 201 },
    );
  }),

  // ── Serviços ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/barbearias/:barCodigo/servicos`, () =>
    HttpResponse.json([
      {
        codigo: 1,
        barCodigo: 1,
        nome: "Corte",
        precoBase: 25,
        duracaoBase: 30,
        ativo: true,
      },
    ]),
  ),
  // handler legado (relativo) mantido para setup.spec.ts
  http.get("/servicos", () =>
    HttpResponse.json([
      { codigo: 1, nome: "Corte", precoBase: 25, duracaoBase: 30, ativo: true },
    ]),
  ),

  http.post(`${BASE}/barbearias/:barCodigo/servicos`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { codigo: 99, barCodigo: 1, ativo: true, ...(body as object) },
      { status: 201 },
    );
  }),

  http.put(
    `${BASE}/barbearias/:barCodigo/servicos/:codigo`,
    async ({ request }) => {
      const body = await request.json();
      return HttpResponse.json({
        codigo: 1,
        barCodigo: 1,
        ativo: true,
        ...(body as object),
      });
    },
  ),

  http.delete(
    `${BASE}/barbearias/:barCodigo/servicos/:codigo`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  // ── Agenda / Disponibilidade ─────────────────────────────────────────────
  http.get(`${BASE}/agenda/disponibilidade/:barbeiroId`, () =>
    HttpResponse.json(["09:00", "09:30", "10:00", "10:30"]),
  ),

  // ── Agendamentos ─────────────────────────────────────────────────────────
  http.get(`${BASE}/agendamentos`, () => HttpResponse.json([])),
  // handler legado (relativo) mantido para setup.spec.ts
  http.get("/agendamentos", () => HttpResponse.json([])),

  http.post(`${BASE}/agendamentos`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { codigo: 999, status: "pendente", ...(body as object) },
      { status: 201 },
    );
  }),

  // ── Configurações ─────────────────────────────────────────────────────────
  http.get(`${BASE}/barbearias/:barCodigo`, () =>
    HttpResponse.json({
      nome: "BarberShop",
      telefone: null,
      email: null,
      endereco: null,
    }),
  ),
  http.get(`${BASE}/barbearias/:barCodigo/horarios`, () =>
    HttpResponse.json([
      {
        codigo: 1,
        barCodigo: 1,
        diaSemana: 1,
        aberto: true,
        abertura: "09:00",
        fechamento: "19:00",
      },
      {
        codigo: 2,
        barCodigo: 1,
        diaSemana: 2,
        aberto: true,
        abertura: "09:00",
        fechamento: "19:00",
      },
      {
        codigo: 3,
        barCodigo: 1,
        diaSemana: 3,
        aberto: true,
        abertura: "09:00",
        fechamento: "19:00",
      },
      {
        codigo: 4,
        barCodigo: 1,
        diaSemana: 4,
        aberto: true,
        abertura: "09:00",
        fechamento: "19:00",
      },
      {
        codigo: 5,
        barCodigo: 1,
        diaSemana: 5,
        aberto: true,
        abertura: "09:00",
        fechamento: "19:00",
      },
      {
        codigo: 6,
        barCodigo: 1,
        diaSemana: 6,
        aberto: true,
        abertura: "08:00",
        fechamento: "18:00",
      },
      {
        codigo: 7,
        barCodigo: 1,
        diaSemana: 0,
        aberto: false,
        abertura: "09:00",
        fechamento: "18:00",
      },
    ]),
  ),
  http.put(`${BASE}/barbearias/:barCodigo/horarios`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),
  http.get(`${BASE}/barbearias/:barCodigo/notificacoes`, () =>
    HttpResponse.json({
      novoAgendamento: true,
      cancelamento: false,
      lembreteCliente: true,
      lembreteInternos: false,
      relatorioDiario: false,
      clienteNovo: false,
      avaliacaoRecebida: false,
      pagamentoRecebido: false,
    }),
  ),
  http.patch(`${BASE}/barbearias/:barCodigo/notificacoes`, () =>
    HttpResponse.json({ ok: true }),
  ),

  // ── Booking público (`/publico/*`, sem autenticação) ───────────────────
  http.get(`${BASE}/publico/:slug`, ({ params }) =>
    HttpResponse.json({
      codigo: 1,
      nome: "Barbearia Mock",
      slug: params.slug,
      ativo: true,
      timezone: "America/Sao_Paulo",
      tema: { logoUrl: null, corPrimaria: null },
    }),
  ),
  http.get(`${BASE}/publico/:slug/servicos`, () =>
    HttpResponse.json([
      { codigo: 1, nome: "Corte", precoBase: 60, duracaoBase: 30 },
      { codigo: 2, nome: "Barba", precoBase: 45, duracaoBase: 25 },
    ]),
  ),
  http.get(`${BASE}/publico/:slug/barbeiros`, () =>
    HttpResponse.json([
      { codigo: 10, nome: "Carlos", avatarUrl: null },
      { codigo: 11, nome: "Felipe", avatarUrl: null },
    ]),
  ),
  http.get(`${BASE}/publico/:slug/slots`, () =>
    HttpResponse.json([
      { horario: "09:00", barbeiroId: 10 },
      { horario: "09:30", barbeiroId: 10 },
      { horario: "14:00", barbeiroId: 10 },
    ]),
  ),
  http.post(`${BASE}/publico/:slug/agendamentos`, () =>
    HttpResponse.json(
      {
        codigo: 999,
        inicio: "2026-05-20T09:00:00.000Z",
        fim: "2026-05-20T09:30:00.000Z",
        barbeiro: { codigo: 10, nome: "Carlos" },
        cliente: { codigo: 50, nome: "João", email: "joao@x.com" },
        barbearia: { codigo: 1, nome: "Barbearia Mock" },
      },
      { status: 201 },
    ),
  ),

  // ── Legacy handlers (usados em setup.spec.ts com fetch relativo) ─────────
  http.get("/barbearia", () =>
    HttpResponse.json({ codigo: 1, nome: "BarberShop", slug: "barbershop" }),
  ),
];

export const server = setupServer(...handlers);
