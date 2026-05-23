import { emailVisivel } from "../cliente";

describe("emailVisivel", () => {
  it("retorna o e-mail quando é real", () => {
    expect(emailVisivel("carlos@gmail.com")).toBe("carlos@gmail.com");
  });

  it("esconde e-mail sintético @toqe.internal (walk-in/encaixe)", () => {
    expect(emailVisivel("encaixe-1-abc123@toqe.internal")).toBeNull();
  });

  it("esconde e-mail sintético @walk-in.local", () => {
    expect(emailVisivel("anon@walk-in.local")).toBeNull();
  });

  it("é case-insensitive no domínio sintético", () => {
    expect(emailVisivel("X@TOQE.INTERNAL")).toBeNull();
  });

  it("retorna null para vazio, espaços ou nulo", () => {
    expect(emailVisivel("")).toBeNull();
    expect(emailVisivel("   ")).toBeNull();
    expect(emailVisivel(null)).toBeNull();
    expect(emailVisivel(undefined)).toBeNull();
  });
});
