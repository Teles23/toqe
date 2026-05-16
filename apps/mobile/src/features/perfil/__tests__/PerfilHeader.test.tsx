import { render, screen } from "@testing-library/react-native";
import React from "react";

import { PerfilHeader } from "../PerfilHeader";

describe("PerfilHeader", () => {
  it("renderiza nome e email", () => {
    render(<PerfilHeader nome="Carlos Silva" email="carlos@x.com" />);
    expect(screen.getByText("Carlos Silva")).toBeTruthy();
    expect(screen.getByText("carlos@x.com")).toBeTruthy();
  });

  it("renderiza '—' quando nome ausente", () => {
    render(<PerfilHeader nome={null} email={null} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("não renderiza linha de email quando ausente", () => {
    render(<PerfilHeader nome="X" email={null} />);
    expect(screen.queryByText("null")).toBeNull();
  });
});
