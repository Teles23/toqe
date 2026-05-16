import { render, screen } from "@testing-library/react-native";
import React from "react";

import { Divider } from "../Divider";

describe("Divider", () => {
  it("renderiza com testID padrão", () => {
    render(<Divider />);
    expect(screen.getByTestId("divider")).toBeTruthy();
  });

  it("aplica indent quando fornecido", () => {
    render(<Divider indent={24} testID="d" />);
    const node = screen.getByTestId("d");
    expect(node.props.style.marginLeft).toBe(24);
  });

  it("aplica testID customizado", () => {
    render(<Divider testID="my-divider" />);
    expect(screen.getByTestId("my-divider")).toBeTruthy();
  });
});
