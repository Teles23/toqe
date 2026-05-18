import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { GhostButton } from "../GhostButton";

describe("GhostButton", () => {
  it("renderiza e dispara onPress", () => {
    const onPress = jest.fn();
    render(<GhostButton label="Continuar com Google" onPress={onPress} />);
    fireEvent.press(
      screen.getByRole("button", { name: "Continuar com Google" }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("respeita disabled", () => {
    const onPress = jest.fn();
    render(<GhostButton label="Desativado" disabled onPress={onPress} />);
    fireEvent.press(screen.getByRole("button", { name: "Desativado" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
