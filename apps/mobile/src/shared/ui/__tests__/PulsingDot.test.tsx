import { render, screen } from "@testing-library/react-native";
import React from "react";

import { PulsingDot } from "../PulsingDot";

describe("PulsingDot", () => {
  it("renderiza sem crash com defaults", () => {
    render(<PulsingDot />);
    expect(screen.getByTestId("pulsing-dot")).toBeTruthy();
  });

  it("respeita testID customizado", () => {
    render(<PulsingDot testID="online-dot" />);
    expect(screen.getByTestId("online-dot")).toBeTruthy();
  });

  it("aceita size e cor customizadas sem crash", () => {
    render(<PulsingDot size={16} color="#ff0000" />);
    expect(screen.getByTestId("pulsing-dot")).toBeTruthy();
  });
});
