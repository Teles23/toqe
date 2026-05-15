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

  // ── Usuário ──────────────────────────────────────────────────────────────
  http.get(`${BASE}/usuarios/me`, () =>
    HttpResponse.json({
      codigo: 1,
      nome: "Test User",
      email: "test@test.com",
      telefone: null,
      avatarUrl: null,
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
    HttpResponse.json([]),
  ),
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

  // ── Legacy handlers (usados em setup.spec.ts com fetch relativo) ─────────
  http.get("/barbearia", () =>
    HttpResponse.json({ codigo: 1, nome: "BarberShop", slug: "barbershop" }),
  ),
];

export const server = setupServer(...handlers);
