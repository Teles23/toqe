import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const handlers = [
  http.post("/auth/login", () =>
    HttpResponse.json({
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      user: { codigo: 1, nome: "Test", email: "test@test.com" },
    }),
  ),
  http.get("/agendamentos", () => HttpResponse.json([])),
  http.get("/servicos", () =>
    HttpResponse.json([
      { codigo: 1, nome: "Corte", precoBase: 25, duracaoBase: 30, ativo: true },
    ]),
  ),
  http.get("/barbearia", () =>
    HttpResponse.json({ codigo: 1, nome: "BarberShop", slug: "barbershop" }),
  ),
];

export const server = setupServer(...handlers);
