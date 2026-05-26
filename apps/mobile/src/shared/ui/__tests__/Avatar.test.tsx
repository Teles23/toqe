import { render, screen } from "@testing-library/react-native";
import React from "react";

import { __getInitials, Avatar } from "../Avatar";

describe("Avatar — getInitials", () => {
  it("retorna primeira+última letra de nome com 2+ palavras", () => {
    expect(__getInitials("Carlos Silva")).toBe("CS");
    expect(__getInitials("Maria Aparecida Lima")).toBe("ML");
  });

  it("retorna primeira letra de nome com 1 palavra", () => {
    expect(__getInitials("Carlos")).toBe("C");
  });

  it("retorna ? quando vazio/null/undefined", () => {
    expect(__getInitials("")).toBe("?");
    expect(__getInitials(null)).toBe("?");
    expect(__getInitials(undefined)).toBe("?");
    expect(__getInitials("   ")).toBe("?");
  });

  it("normaliza para maiúsculas", () => {
    expect(__getInitials("carlos silva")).toBe("CS");
  });
});

describe("Avatar — render", () => {
  it("renderiza iniciais quando sem uri", () => {
    render(<Avatar name="Carlos Silva" testID="av" />);
    expect(screen.getByText("CS")).toBeTruthy();
  });

  it("renderiza '?' quando sem nome e sem uri", () => {
    render(<Avatar testID="av" />);
    expect(screen.getByText("?")).toBeTruthy();
  });

  it("renderiza Image quando uri é fornecida", () => {
    render(<Avatar uri="https://x.com/a.png" name="A" testID="av" />);
    // Imagem renderiza, iniciais não devem aparecer
    expect(screen.queryByText("A")).toBeNull();
  });

  it("aceita size customizado", () => {
    render(<Avatar name="X" size="xl" testID="av-xl" />);
    expect(screen.getByTestId("av-xl")).toBeTruthy();
  });
});
