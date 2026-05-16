import { render, screen } from "@testing-library/react-native";
import React from "react";

import { FormErrorBox } from "../FormErrorBox";

describe("FormErrorBox", () => {
  it("renderiza nada quando error é undefined", () => {
    render(<FormErrorBox />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renderiza nada quando error é null", () => {
    render(<FormErrorBox error={null} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renderiza nada quando error é string vazia", () => {
    render(<FormErrorBox error="" />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renderiza mensagem com role=alert quando error é string não-vazia", () => {
    render(<FormErrorBox error="Falha no login" />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Falha no login")).toBeTruthy();
  });
});
