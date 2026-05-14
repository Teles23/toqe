import { describe, it, expect } from "vitest";
import { barbeiroService } from "./barbeiro.service";

describe("barbeiroService.list", () => {
  it("retorna lista de barbeiros da barbearia", async () => {
    const result = await barbeiroService.list(1);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatchObject({
      codigo: expect.any(Number),
      nome: expect.any(String),
    });
  });

  it("retorna barbeiros com campos de métricas", async () => {
    const result = await barbeiroService.list(1);
    const b = result[0]!;
    expect(b).toHaveProperty("atendimentosHoje");
    expect(b).toHaveProperty("atendimentosMes");
    expect(b).toHaveProperty("faturamentoMes");
    expect(b).toHaveProperty("ticketMedio");
  });
});
