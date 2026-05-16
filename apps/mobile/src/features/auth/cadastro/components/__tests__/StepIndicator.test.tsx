import { render, screen } from "@testing-library/react-native";
import React from "react";

import { StepIndicator } from "../StepIndicator";

describe("StepIndicator", () => {
  it("renderiza N dots para N steps", () => {
    render(<StepIndicator total={3} current={1} />);
    expect(screen.getByTestId("step-dot-1")).toBeTruthy();
    expect(screen.getByTestId("step-dot-2")).toBeTruthy();
    expect(screen.getByTestId("step-dot-3")).toBeTruthy();
  });

  it("expõe progressbar com valores corretos", () => {
    render(<StepIndicator total={3} current={2} />);
    const bar = screen.getByTestId("step-indicator");
    expect(bar.props.accessibilityRole).toBe("progressbar");
    expect(bar.props.accessibilityValue).toEqual({ min: 1, max: 3, now: 2 });
    expect(bar.props.accessibilityLabel).toBe("Passo 2 de 3");
  });

  it("aceita current = total (último passo)", () => {
    render(<StepIndicator total={3} current={3} />);
    expect(screen.getByTestId("step-dot-3")).toBeTruthy();
  });

  it("aceita testID customizado", () => {
    render(<StepIndicator total={2} current={1} testID="cadastro-progress" />);
    expect(screen.getByTestId("cadastro-progress")).toBeTruthy();
  });
});
