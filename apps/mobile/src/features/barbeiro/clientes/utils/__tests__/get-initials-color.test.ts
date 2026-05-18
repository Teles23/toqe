import {
  getInitials,
  getInitialsColor,
  INITIALS_COLORS,
} from "../get-initials-color";

describe("getInitialsColor", () => {
  it("mesmo nome retorna sempre a mesma cor (determinismo)", () => {
    const first = getInitialsColor("Marcos Silva");
    const second = getInitialsColor("Marcos Silva");
    expect(first).toBe(second);
  });

  it("retorna sempre uma cor da paleta INITIALS_COLORS", () => {
    const names = [
      "Carlos",
      "Ana Lima",
      "Pedro Henrique",
      "X",
      "",
      "12345",
      "Marcos da Silva e Souza",
    ];
    for (const name of names) {
      const color = getInitialsColor(name);
      expect(INITIALS_COLORS).toContain(color);
    }
  });

  it("nomes diferentes podem mapear para cores diferentes", () => {
    const colors = new Set(
      ["Ana", "Bruno", "Carla", "Diego", "Eduardo", "Fátima"].map(
        getInitialsColor,
      ),
    );
    // Não exige distribuição perfeita, só que o hash não colapsa tudo em 1 cor
    expect(colors.size).toBeGreaterThan(1);
  });
});

describe("getInitials", () => {
  it("retorna até 2 letras maiúsculas para nomes com 2+ palavras", () => {
    expect(getInitials("Marcos Silva")).toBe("MS");
    expect(getInitials("Ana Paula Souza")).toBe("AP");
  });

  it("retorna 1 letra quando o nome tem só uma palavra", () => {
    expect(getInitials("Carlos")).toBe("C");
    expect(getInitials("X")).toBe("X");
  });

  it("retorna string vazia para nome vazio", () => {
    expect(getInitials("")).toBe("");
  });

  it("normaliza para maiúscula independente do input", () => {
    expect(getInitials("ana paula")).toBe("AP");
    expect(getInitials("ANA PAULA")).toBe("AP");
  });

  it("ignora múltiplos espaços entre palavras", () => {
    expect(getInitials("Marcos   Silva")).toBe("MS");
    expect(getInitials("  Ana  Lima  ")).toBe("AL");
  });
});
