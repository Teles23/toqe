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
  http.get("/api/auth/token", () => HttpResponse.json({ token: "mock-token" })),
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

  // ── Convite de barbeiro (via Next.js BFF, endpoints públicos) ────────────
  http.get("/api/convite/:token", ({ params }) =>
    HttpResponse.json({
      token: String(params.token),
      barbeariaNome: "Barbearia Mock",
      barbeariaSlug: "barbearia-mock",
      email: "novo@barbeiro.com",
      perfil: "barbeiro",
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      isNew: true,
    }),
  ),
  http.post("/api/convite/:token/aceitar", () =>
    HttpResponse.json({
      user: { codigo: 42, nome: "Novo Barbeiro", email: "novo@barbeiro.com" },
      isNew: true,
      barbeariaNome: "Barbearia Mock",
    }),
  ),
  http.delete("/api/convite/:token", () =>
    HttpResponse.json({ sucesso: true }),
  ),

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
  http.get(`${BASE}/publico/:slug/avaliacoes`, () =>
    HttpResponse.json({
      media: 4.8,
      total: 3,
      items: [
        {
          nota: 5,
          comentario: "Excelente atendimento!",
          criadoEm: "2026-04-01T10:00:00.000Z",
        },
        {
          nota: 5,
          comentario: null,
          criadoEm: "2026-03-20T09:00:00.000Z",
        },
        {
          nota: 4,
          comentario: "Muito bom!",
          criadoEm: "2026-03-10T08:00:00.000Z",
        },
      ],
    }),
  ),
  http.post(`${BASE}/publico/:slug/agendamentos`, () =>
    HttpResponse.json(
      {
        codigo: 999,
        inicio: "2026-05-20T09:00:00.000Z",
        fim: "2026-05-20T09:30:00.000Z",
        status: "pendente",
        barbeiro: { usrCodigo: 10, nome: "Carlos", avatarUrl: null },
        cliente: {
          usrCodigo: 50,
          nome: "João",
          telefone: null,
          tipo: "usuario",
        },
        itens: [],
        barbearia: { codigo: 1, nome: "Barbearia Mock" },
      },
      { status: 201 },
    ),
  ),

  // ── Admin (Super Admin) ──────────────────────────────────────────────────
  http.get(`${BASE}/admin/metrics`, () =>
    HttpResponse.json({
      mrr: 1246,
      arr: 14952,
      totalTenants: 18,
      activeTenants: 12,
      totalBarbeiros: 34,
      totalAgdMes: 872,
    }),
  ),
  http.get(`${BASE}/admin/barbearias`, () =>
    HttpResponse.json([
      {
        codigo: 1,
        nome: "Barbearia Alpha",
        slug: "alpha",
        cidade: "São Paulo",
        plano: "pro",
        planoStatus: "ativo",
        mrr: 189,
        totalBarbeiros: 3,
        totalAgdMes: 120,
        criadoEm: "2025-01-10T00:00:00.000Z",
      },
      {
        codigo: 2,
        nome: "Barbearia Beta",
        slug: "beta",
        cidade: "Rio de Janeiro",
        plano: "basic",
        planoStatus: "ativo",
        mrr: 89,
        totalBarbeiros: 2,
        totalAgdMes: 68,
        criadoEm: "2025-03-15T00:00:00.000Z",
      },
      {
        codigo: 3,
        nome: "Barbearia Gamma",
        slug: "gamma",
        cidade: "Belo Horizonte",
        plano: "free",
        planoStatus: "inativo",
        mrr: 0,
        totalBarbeiros: 1,
        totalAgdMes: 0,
        criadoEm: "2025-06-01T00:00:00.000Z",
      },
    ]),
  ),
  http.get(`${BASE}/admin/activity`, () =>
    HttpResponse.json([
      {
        tipo: "signup",
        texto: "Nova barbearia: Corte & Cia",
        tempo: "2 min atrás",
      },
      {
        tipo: "upgrade",
        texto: "Alpha fez upgrade para Pro",
        tempo: "18 min atrás",
      },
      { tipo: "payment", texto: "Pagamento R$89 — Beta", tempo: "1h atrás" },
      { tipo: "churn", texto: "Gamma cancelou o plano", tempo: "3h atrás" },
    ]),
  ),
  http.get(`${BASE}/admin/revenue`, () =>
    HttpResponse.json({
      historico: [
        { mes: "Nov/25", mrr: 890 },
        { mes: "Dez/25", mrr: 980 },
        { mes: "Jan/26", mrr: 1050 },
        { mes: "Fev/26", mrr: 1100 },
        { mes: "Mar/26", mrr: 1180 },
        { mes: "Abr/26", mrr: 1200 },
        { mes: "Mai/26", mrr: 1246 },
      ],
      breakdown: [
        { plano: "pro", count: 4, preco: 189, total: 756 },
        { plano: "basic", count: 8, preco: 89, total: 712 },
        { plano: "free", count: 6, preco: 0, total: 0 },
      ],
      churnMes: 0,
      mrr: 1246,
      arr: 14952,
    }),
  ),
  http.get(`${BASE}/admin/barbearias/:id`, ({ params }) =>
    HttpResponse.json({
      codigo: Number(params.id),
      nome: "Barbearia Alpha",
      slug: "alpha",
      cidade: "São Paulo",
      plano: "pro",
      planoStatus: "ativo",
      mrr: 189,
      totalBarbeiros: 3,
      totalAgdMes: 120,
      criadoEm: "2025-01-10T00:00:00.000Z",
    }),
  ),
  http.patch(`${BASE}/admin/barbearias/:id/plano`, () =>
    HttpResponse.json({ ok: true }),
  ),
  http.patch(`${BASE}/admin/barbearias/:id/status`, () =>
    HttpResponse.json({ ok: true }),
  ),

  // ── Notas privadas de clientes ────────────────────────────────────────────
  http.get(`${BASE}/barbearias/:barCodigo/clientes/:clienteCodigo/nota`, () => {
    return HttpResponse.json({ conteudo: "", atualizadoEm: null });
  }),
  http.put(`${BASE}/barbearias/:barCodigo/clientes/:clienteCodigo/nota`, () => {
    return HttpResponse.json({
      conteudo: "",
      atualizadoEm: new Date().toISOString(),
    });
  }),

  // ── Dashboard da rede (multi-unidade) ────────────────────────────────────
  http.get(`${BASE}/barbearias/rede`, () =>
    HttpResponse.json({
      unidades: [
        {
          barCodigo: 1,
          nome: "Barber Alpha",
          faturamentoHoje: 350,
          faturamentoMes: 4200,
          agendamentosHoje: 5,
          concluidos: 3,
        },
      ],
      totais: {
        faturamentoHoje: 350,
        faturamentoMes: 4200,
        agendamentosHoje: 5,
        concluidos: 3,
      },
    }),
  ),

  // ── Legacy handlers (usados em setup.spec.ts com fetch relativo) ─────────
  http.get("/barbearia", () =>
    HttpResponse.json({ codigo: 1, nome: "BarberShop", slug: "barbershop" }),
  ),

  // ── Fidelidade ────────────────────────────────────────────────────────────
  http.get(`${BASE}/fidelidade/saldo/:clienteCodigo`, ({ params }) =>
    HttpResponse.json({
      pontos: 50,
      historico: [
        {
          codigo: 1,
          barCodigo: 1,
          clienteCodigo: Number(params.clienteCodigo),
          pontos: 50,
          tipo: "ganho",
          agendamentoCodigo: 5,
          criadoEm: new Date().toISOString(),
        },
      ],
    }),
  ),
  http.get(`${BASE}/fidelidade/ranking`, () =>
    HttpResponse.json([
      {
        codigo: 1,
        nome: "Cliente Top",
        email: "top@test.com",
        pontosAcumulados: 100,
      },
    ]),
  ),
  http.post(`${BASE}/fidelidade/resgatar`, () =>
    HttpResponse.json({ desconto: 25 }),
  ),

  // ── ApiKeys ──────────────────────────────────────────────────────────────
  http.get(`${BASE}/api-keys`, () =>
    HttpResponse.json([
      {
        codigo: 1,
        barCodigo: 1,
        nome: "Integração Site",
        keyPrefix: "toqe_ab12_cd",
        ativo: true,
        criadoEm: new Date("2026-05-01T00:00:00Z").toISOString(),
        ultimoUsoEm: new Date("2026-05-24T12:00:00Z").toISOString(),
      },
    ]),
  ),
  http.post(`${BASE}/api-keys`, async ({ request }) => {
    const body = (await request.json()) as { nome: string };
    return HttpResponse.json(
      {
        key: "toqe_aabb1234_ccddeeffffffff00112233445566",
        apiKey: {
          codigo: 99,
          barCodigo: 1,
          nome: body.nome,
          keyPrefix: "toqe_aabb1234",
          ativo: true,
          criadoEm: new Date().toISOString(),
          ultimoUsoEm: null,
        },
      },
      { status: 201 },
    );
  }),
  http.delete(
    `${BASE}/api-keys/:codigo`,
    () => new HttpResponse(null, { status: 204 }),
  ),
];

export const server = setupServer(...handlers);
