import { normalizeReturnTo } from "../return-to";

describe("normalizeReturnTo", () => {
  it("aceita rotas públicas de booking", () => {
    expect(normalizeReturnTo("/b/urban-flow")).toBe("/b/urban-flow");
  });

  it("aceita rotas internas de barbearia do cliente", () => {
    expect(normalizeReturnTo("/(cliente)/barbearia/urban-flow")).toBe(
      "/(cliente)/barbearia/urban-flow",
    );
  });

  it("rejeita URLs absolutas e rotas fora do fluxo público", () => {
    expect(normalizeReturnTo("https://evil.example/b/urban")).toBeNull();
    expect(normalizeReturnTo("/(barbeiro)/agenda")).toBeNull();
    expect(normalizeReturnTo("/admin")).toBeNull();
  });
});

