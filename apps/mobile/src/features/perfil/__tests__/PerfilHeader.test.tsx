import { render, screen } from "@testing-library/react-native";
import React from "react";

import { PerfilHeader } from "../PerfilHeader";

describe("PerfilHeader", () => {
  it("renderiza nome e role label", () => {
    render(<PerfilHeader nome="Carlos Silva" roleLabel="Barbeiro" />);
    expect(screen.getByText("Carlos Silva")).toBeTruthy();
    expect(screen.getByText("Barbeiro")).toBeTruthy();
  });

  it("renderiza '—' quando nome ausente", () => {
    render(<PerfilHeader nome={null} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("não renderiza role label quando ausente", () => {
    render(<PerfilHeader nome="X" />);
    // sem roleLabel, nada além do nome aparece como texto extra
    expect(screen.queryByText("Barbeiro")).toBeNull();
    expect(screen.queryByText("Cliente")).toBeNull();
  });

  it("aceita prop email legada sem renderizá-la (não vaza no header)", () => {
    // Retrocompat: callers antigos passavam email mas agora não é exibido aqui.
    render(<PerfilHeader nome="Ana" email="ana@x.com" />);
    expect(screen.queryByText("ana@x.com")).toBeNull();
  });

  it("renderiza avatar (ClienteAvatar) com iniciais do nome", () => {
    render(<PerfilHeader nome="Marcos Silva" />);
    expect(screen.getByText("MS")).toBeTruthy();
  });
});
