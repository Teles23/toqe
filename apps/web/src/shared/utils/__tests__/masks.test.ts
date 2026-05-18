import { describe, expect, it } from "vitest";
import { maskCurrency, maskSlug, maskTelefone, parseCurrency } from "../masks";

describe("maskTelefone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(maskTelefone("11999999999")).toBe("(11) 99999-9999");
  });

  it("formata fixo com 10 dígitos", () => {
    expect(maskTelefone("1199999999")).toBe("(11) 9999-9999");
  });

  it("retorna vazio para string vazia", () => {
    expect(maskTelefone("")).toBe("");
  });

  it("ignora caracteres não-numéricos na entrada", () => {
    expect(maskTelefone("(11) 99999-9999")).toBe("(11) 99999-9999");
  });

  it("limita a 11 dígitos", () => {
    expect(maskTelefone("119999999991234")).toBe("(11) 99999-9999");
  });
});

describe("maskSlug", () => {
  it("converte para lowercase e substitui espaços por hífens", () => {
    expect(maskSlug("Minha Barbearia!")).toBe("minha-barbearia");
  });

  it("colapsa hífens duplos", () => {
    expect(maskSlug("minha--barbearia")).toBe("minha-barbearia");
  });

  it("remove caracteres especiais", () => {
    expect(maskSlug("Barbearia do Zé!@#")).toBe("barbearia-do-z");
  });

  it("mantém números", () => {
    expect(maskSlug("barbearia123")).toBe("barbearia123");
  });
});

describe("maskCurrency", () => {
  it("formata número corretamente", () => {
    expect(maskCurrency(1234.56)).toContain("1.234,56");
  });

  it("retorna R$ 0,00 para NaN", () => {
    expect(maskCurrency("abc")).toBe("R$ 0,00");
  });

  it("formata zero", () => {
    expect(maskCurrency(0)).toBe("R$\xa00,00");
  });
});

describe("parseCurrency", () => {
  it("parseia valor monetário mascarado", () => {
    expect(parseCurrency("R$ 1.234,56")).toBeCloseTo(1234.56);
  });

  it("retorna 0 para string inválida", () => {
    expect(parseCurrency("abc")).toBe(0);
  });
});
