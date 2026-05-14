import { describe, it, expect } from "vitest";
import { server, handlers } from "./msw-handlers";

describe("MSW setup", () => {
  it("server está configurado e ativo", () => {
    expect(server).toBeDefined();
    expect(typeof server.listen).toBe("function");
    expect(typeof server.close).toBe("function");
  });

  it("handlers exporta array não-vazio", () => {
    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers.length).toBeGreaterThan(0);
  });

  it("handler de login retorna access_token e user", async () => {
    const res = await fetch("/auth/login", { method: "POST" });
    const json = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      user: { codigo: number; nome: string };
    };
    expect(json.access_token).toBe("mock-token");
    expect(json.refresh_token).toBe("mock-refresh");
    expect(json.user).toHaveProperty("codigo", 1);
  });

  it("handler de agendamentos retorna lista vazia", async () => {
    const res = await fetch("/agendamentos");
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it("handler de servicos retorna servico Corte", async () => {
    const res = await fetch("/servicos");
    const json = (await res.json()) as Array<{
      nome: string;
      precoBase: number;
    }>;
    expect(json).toHaveLength(1);
    expect(json[0]).toMatchObject({ nome: "Corte", precoBase: 25 });
  });

  it("handler de barbearia retorna dados da barbearia", async () => {
    const res = await fetch("/barbearia");
    const json = (await res.json()) as { nome: string; slug: string };
    expect(json).toMatchObject({ nome: "BarberShop", slug: "barbershop" });
  });
});
